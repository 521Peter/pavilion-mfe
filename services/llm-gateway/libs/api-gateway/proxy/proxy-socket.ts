import { Request } from 'express';
import { Socket } from 'node:net';
import * as http from 'node:http';
import { ProxyServerOptions } from './proxy-server-option.type';
import { IncomingMessage } from 'http';

export class ProxySocket {
    /** HTTP 解析器在客户端握手期间一并消费的升级协议字节。 */
    private clientHead?: Buffer;

    constructor(
        private req: Request,
        private socket: Socket,
        private options: ProxyServerOptions
    ) {}

    checkMethodAndHeader() {
        return !(
            this.req.method !== 'GET' ||
            !this.req.headers.upgrade ||
            this.req.headers.upgrade.toLowerCase() !== 'websocket'
        );
    }

    createHttpHeader(line: string, headers: http.IncomingHttpHeaders) {
        return (
            Object.keys(headers)
                .reduce(
                    (head, key) => {
                        const value = headers[key];

                        if (!Array.isArray(value)) {
                            head.push(key + ': ' + value);
                            return head;
                        }

                        for (let i = 0; i < value.length; i++) {
                            head.push(key + ': ' + value[i]);
                        }
                        return head;
                    },
                    [line]
                )
                .join('\r\n') + '\r\n\r\n'
        );
    }

    buildRequestOptions(extraHeaders: NodeJS.Dict<string> = {}): http.RequestOptions {
        const url = new URL(this.options.host);

        return {
            method: this.req.method,
            host: url.host,
            hostname: url.hostname,
            port: url.port,
            headers: {
                ...this.req.headers,
                ...extraHeaders
            },
            path: this.req.url,
            // 升级时绝不能从 keep-alive 池借用套接字。池化套接字到达时，代理的空闲超时
            // 已启动且计时部分经过，该定时器会在移交给升级协议后继续存在；一旦对端静默，
            // 隧道便会在会话中途断开。对 Engine.IO 而言，这发生在两次 ping 之间的 25 秒间隔。
            // 升级需要使用代理永远不会回收的套接字。
            agent: false
        };
    }

    handleWebsocket(extraHeaders: NodeJS.Dict<string> = {}, head?: Buffer) {
        if (!this.checkMethodAndHeader()) {
            return this.socket.destroy();
        }
        this.clientHead = head;
        const proxyReq = http.request(this.buildRequestOptions(extraHeaders));
        this.socket.setTimeout(0);
        this.socket.setNoDelay(true);
        this.socket.setKeepAlive(true, 0);

        proxyReq.on('error', (err: Error) => {
            if (!this.socket.destroyed) {
                this.socket.end();
            }
        });

        proxyReq.on('upgrade', (proxyRes: Request, proxySocket: Socket, proxyHead: Buffer) => {
            this.onUpgrade(proxyRes, proxySocket, proxyHead);
        });

        proxyReq.on('response', (proxyRes) => this.onResponse(proxyRes));
        proxyReq.end();
    }

    private onUpgrade(proxyRes: Request, proxySocket: Socket, proxyHead: Buffer) {
        proxySocket.on('close', () => {
            this.socket.end();
        });

        // Node 的 HTTP 解析器按完整数据块读取，因此升级协议的字节可能随握手一起被消费，
        // 并作为 head 缓冲区移交。它们已经离开数据流，仅连接管道会丢失这些字节，
        // 因此要在连接管道前将每个 head 推回对应套接字前端。
        // 主动先发送数据的服务器（Engine.IO 会立即发送 OPEN 包）否则会丢失第一帧，
        // 使连接看似存活却永远无法完成握手。
        // handleWebsocket 会以相同方式清理客户端套接字；上游也要这样处理，
        // 防止继承的空闲定时器回收隧道。
        proxySocket.setTimeout(0);

        if (proxyHead?.length) {
            proxySocket.unshift(proxyHead);
        }

        if (this.clientHead?.length) {
            this.socket.unshift(this.clientHead);
        }

        this.socket.write(this.createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers));

        proxySocket.pipe(this.socket).pipe(proxySocket);
    }

    private onResponse(proxyRes: IncomingMessage) {
        const headers: NodeJS.Dict<string> = {};
        let writeChunk = (chunk: Buffer | string) => {
            this.socket.write(chunk);
        };
        if (this.req.httpVersion === '1.1' && proxyRes.headers['content-length'] === undefined) {
            headers['transfer-encoding'] = 'chunked';
            writeChunk = (chunk: Buffer | string) => {
                this.socket.write(chunk.length.toString(16));
                this.socket.write('\r\n');
                this.socket.write(chunk);
                this.socket.write('\r\n');
            };
        }

        const proxyHead = this.createHttpHeader(
            `HTTP/${this.req.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}`,
            headers
        );
        if (!this.socket.destroyed) {
            this.socket.write(proxyHead);
            proxyRes.on('data', (chunk) => {
                writeChunk(chunk);
            });
            proxyRes.on('end', () => {
                writeChunk('');
                this.socket.destroySoon();
            });
        } else {
            // 确保响应已被消费
            proxyRes.resume();
        }
    }
}
