import {
    ForbiddenException,
    HttpStatus,
    Inject,
    Injectable,
    Logger,
    MethodNotAllowedException,
    OnModuleInit,
    ServiceUnavailableException
} from '@nestjs/common';
import { OpenApiService } from './open-api.service';
import { ApiServiceDetail } from '../types/api-service.type';
import { Request, Response } from 'express';
import { RequestService } from './request.service';
import { ThrottlerService } from '../../throttlers/services/throttler.service';
import { DEFAULT_SERVER_NAME } from '../constants/default-server-name.constant';
import { HttpAdapterHost } from '@nestjs/core';
import { Socket } from 'node:net';
import { WsRequestService } from './ws-request.service';
import { API_GATEWAY_OPTION } from '../../constants/api-gateway.constant';
import { ApiGatewayOption } from '../../types/api-gateway-option.type';
import { ProxyRequest } from '../models/proxy-request.model';
import { isReqUrlInWhitelist } from '../helpers/whitelist.helper';
import { matchesPrefixSegment } from '../helpers/prefix.helper';
import { ProxyServer } from '../../proxy/proxy-server';
import { Dispatcher } from 'undici';
import ResponseData = Dispatcher.ResponseData;

@Injectable()
export class ProxyService implements OnModuleInit {
    private logger = new Logger(ProxyService.name);
    private proxyServers: { [key in string]: ProxyServer } = {};
    private prefixServers: string[] = [];
    private directPrefixServers: string[] = [];
    private directPrefixOwner: { [key in string]: string } = {};
    private hasDefaultServer: boolean = false;

    constructor(
        private swaggerService: OpenApiService,
        private requestService: RequestService,
        private wsRequestService: WsRequestService,
        private throttlerService: ThrottlerService,
        private adapterHost: HttpAdapterHost,
        @Inject(API_GATEWAY_OPTION) private apiGatewayOption: ApiGatewayOption
    ) {}

    /**
     * 模块初始化时初始化 API 服务并设置 WebSocket 处理器。
     */
    onModuleInit(): void {
        const serverInstance = this.adapterHost.httpAdapter;
        serverInstance.getHttpServer().on('upgrade', async (request, socket, head) => {
            try {
                await this.handleWebSocketRequest(request, socket, head);
            } catch (e) {
                console.error(e);
            }
        });

        const initialLoads: Promise<void>[] = [];
        for (const apiService of this.apiGatewayOption.apiServices) {
            if (apiService.prefix === DEFAULT_SERVER_NAME) {
                this.hasDefaultServer = true;
            }
            initialLoads.push(
                this.swaggerService
                    .getServiceDetail(apiService)
                    .then(() => {
                        this.logger.log(`Start ${apiService.prefix} successfully.`);
                    })
                    .catch((error) => {
                        console.error(error);
                        this.logger.error(`Start ${apiService.prefix} failed. ${error.message}`);
                    })
            );
            this.prefixServers.push(apiService.prefix);
            this.registerDirectPrefixes(apiService);
            this.createProxyServer(apiService);
        }

        // 所有服务的文档首次加载结束后标记就绪，
        // 且不阻塞模块其余初始化过程。
        Promise.allSettled(initialLoads).then(() => this.swaggerService.markInitialLoadComplete());
    }

    /**
     * 根据服务的普通前缀注册其直接前缀。
     * 直接前缀会原样转发给所属服务，不会被移除。
     * 不同服务发生冲突时，配置顺序靠前的服务优先。
     * @param {ApiServiceDetail} apiService API 服务详情
     */
    private registerDirectPrefixes(apiService: ApiServiceDetail): void {
        for (const directPrefix of apiService.directPrefixes ?? []) {
            if (this.directPrefixOwner[directPrefix] === undefined) {
                this.directPrefixOwner[directPrefix] = apiService.prefix;
                this.directPrefixServers.push(directPrefix);
            }
        }
    }

    /**
     * 判断请求 URL 是否属于已配置的直接前缀（按完整路径段匹配）。
     * @param {string} url URL
     * @returns {boolean} URL 是否为直接前缀请求
     */
    private isDirectPrefixRequest(url: string): boolean {
        return this.directPrefixServers.some((directPrefix) => matchesPrefixSegment(url, directPrefix));
    }

    /**
     * 为指定 API 服务设置代理服务器，同时处理 HTTP 和 WebSocket 请求，
     * 配置代理将请求转发到目标服务，并管理错误处理和请求修改。
     * @param {ApiServiceDetail} apiService API 服务详情
     */
    private createProxyServer(apiService: ApiServiceDetail): void {
        this.proxyServers[apiService.prefix] = new ProxyServer({
            host: apiService.host,
            enableWs: true,
            pool: this.apiGatewayOption.pool,
            errorHandler: this.handleProxyError.bind(this),
            responseHandler: (proxyRes, req) => this.handleProxyResponse(apiService, proxyRes, req),
            rewritePath: (request) => this.rewritePath(request, apiService.prefix)
        });
    }

    handleProxyResponse(apiService: ApiServiceDetail, proxyRes: ResponseData, req: Request): void {
        if (
            proxyRes.statusCode >= 300 &&
            proxyRes.statusCode < 400 &&
            !isReqUrlInWhitelist(req.url, this.apiGatewayOption.bypassRoutePrefixes || []) &&
            !this.isDirectPrefixRequest(req.url)
        ) {
            proxyRes.headers.location = '/' + apiService.prefix + proxyRes.headers.location;
        }
    }

    handleProxyError(error: Error, req: Request, res: Response): void {
        if (res.writableEnded) {
            this.logger.error(`Error: ${error.message}`);
            return;
        }
        const errorResponse = {
            message: 'Service unavailable.'
        };
        // eslint-disable-next-line @typescript-eslint/naming-convention
        res.writeHead(HttpStatus.SERVICE_UNAVAILABLE, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
    }

    /**
     * 从传入请求中移除指定前缀以修改路径。
     * @param {ClientRequest} request 请求
     * @param {string} prefix 前缀
     */
    private rewritePath(request: Request, prefix: string): string {
        const newPath = this.removePath(prefix, request.path);
        const url = new URL(newPath, 'http://dummy-base.local');
        if (!url.pathname.endsWith('/') && !this.requestService.isStaticRequest(request)) {
            url.pathname += '/';
        }
        return url.pathname + url.search;
    }

    /**
     * 仅当指定前缀是首个路径段时才将其从 URL 中移除。
     * 因此直接前缀请求（路径不以服务的普通前缀开头）保持不变，转发时保留其前缀。
     * @param {string} prefix 前缀
     * @param {string} url URL
     * @returns {string} 转发到后端服务前正确清理后的 URL
     */
    private removePath(prefix: string, url: string): string {
        const base = `/${prefix}`;
        if (url === base) {
            return '/';
        }
        const next = url.charAt(base.length);
        if (url.startsWith(base) && (next === '/' || next === '?' || next === '#')) {
            return url.slice(base.length) || '/';
        }
        return url;
    }

    /**
     * 根据传入请求是静态资源请求还是普通 HTTP 请求，决定处理方式。
     * @param {Request} request 请求
     * @param {Response} response 响应
     */
    async handleRequest(request: Request, response: Response): Promise<void> {
        if (this.requestService.isStaticRequest(request)) {
            await this.handleStaticRequest(response, request);
        } else {
            await this.handleHttpRequest(request, response);
        }
    }

    /**
     * 将静态资源请求转发给代理服务器。根据请求 URL 决定使用哪个代理服务器，
     * 并通过代理的 web 方法转发请求。
     * @param {Response} response 响应
     * @param {Request} request 请求
     */
    private async handleStaticRequest(response: Response, request: Request): Promise<void> {
        const serverName = this.getServerName(request.url);
        await this.proxyServers[serverName].forwardRequest(request, response);
    }

    /**
     * 处理 WebSocket 连接升级请求，决定由哪个代理服务器处理，验证 WebSocket 令牌，
     * 并携带必要请求头将请求转发到适当的服务器。
     * @param {Request} request 请求
     * @param {Socket} socket 套接字
     * @param {Buffer} head HTTP 解析器随握手一并消费的升级协议字节
     */
    private async handleWebSocketRequest(request: Request, socket: Socket, head?: Buffer): Promise<void> {
        const serverName = this.getServerName(request.url);
        const proxyRequest = new ProxyRequest();
        if (!(await this.wsRequestService.handle(request, proxyRequest))) {
            throw new ForbiddenException();
        }
        await this.proxyServers[serverName].forwardWebsocket(request, socket, {
            headers: proxyRequest.getKebabHeaders(),
            head
        });
    }

    /**
     * 处理传入的 HTTP 请求：确定转发目标后端服务、执行限流检查并设置适当的请求头。
     * 同时处理特定路由的自定义限流，并确保由正确的后端服务器处理请求。
     * @param {Request} request 请求
     * @param {Response} response 响应
     */
    private async handleHttpRequest(request: Request, response: Response): Promise<void> {
        const serverName = this.getServerName(request.url);
        const byPassRoutePrefixes = this.apiGatewayOption.bypassRoutePrefixes || [];
        if (byPassRoutePrefixes.some((prefix) => request.url.startsWith(`${prefix}`))) {
            await this.proxyServers[serverName].forwardRequest(request, response);
            return;
        }

        const routerDetail = this.swaggerService.getRouterDetail(
            serverName,
            request.method,
            this.removePath(serverName, request.url)
        );

        if (!routerDetail) {
            throw new MethodNotAllowedException();
        }

        // 在认证前应用全局 IP 上限，使未认证/被拒绝的洪泛请求同样受限。
        // 此检查会标记请求，因此下方的 checkLimitOfRequest 不会重复执行（避免重复计数）。
        await this.throttlerService.checkGlobalIpRequest(request);

        const proxyRequest = new ProxyRequest();
        if (!(await this.requestService.handle(routerDetail, request, proxyRequest))) {
            throw new ForbiddenException();
        }
        await this.throttlerService.checkLimitOfRequest(routerDetail, request);
        if (this.throttlerService.checkRouterHasCustomLimit(routerDetail)) {
            response.on('finish', async () => {
                await this.throttlerService.increaseRouterLimit(routerDetail, request, response);
            });
        }
        await this.proxyServers[serverName].forwardRequest(request, response, {
            headers: proxyRequest.getKebabHeaders()
        });
    }

    /**
     * 根据 URL 确定处理请求的正确代理服务器（或后端服务）。
     * 在预定义服务器前缀列表中查找匹配项并返回对应服务器名称。
     * @param {string} url URL
     * @returns {string} 服务器名称
     */
    getServerName(url: string): string {
        // 直接前缀先于普通前缀求值（FR-006）：重叠时直接前缀（保留方）所属服务优先。
        // removePath 仅移除开头前缀，因此会保留匹配到的直接前缀。
        for (const directPrefix of this.directPrefixServers) {
            if (matchesPrefixSegment(url, directPrefix)) {
                return this.directPrefixOwner[directPrefix];
            }
        }
        let serverName: string;
        for (const prefix of this.prefixServers) {
            if (matchesPrefixSegment(url, prefix)) {
                serverName = prefix;
                break;
            }
        }
        if (!serverName || (serverName && !this.swaggerService.apiDocs[serverName])) {
            if (this.hasDefaultServer) {
                return DEFAULT_SERVER_NAME;
            }
            throw new ServiceUnavailableException();
        }

        return serverName;
    }
}
