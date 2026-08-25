import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '~app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { env } from '~config/env.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { OpenApiService } from '@hodfords/api-gateway';

/**
 * 初始化并配置 NestJS 应用，设置视图目录、静态资源和 CORS（跨源资源共享），
 * 然后启动应用服务器。
 */
async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false
    });
    app.setBaseViewsDir(join(__dirname, 'views'));
    app.useStaticAssets(join(__dirname, 'statics'), { prefix: '/statics' });
    app.setViewEngine('hbs');

    // 下游代理路由必须保留原始请求流，本地控制器仍需使用解析后的请求体。
    const jsonParser = json({ limit: '10mb' });
    const formParser = urlencoded({ extended: true, limit: '10mb' });
    const proxiedApiPrefixes = env.API_SERVICES.filter((service) => service.prefix.startsWith('api/')).map(
        (service) => `/${service.prefix.slice(4)}`
    );
    app.use('/api', (request, response, next) => {
        const isProxyRequest = proxiedApiPrefixes.some(
            (prefix) => request.url === prefix || request.url.startsWith(`${prefix}/`)
        );
        if (isProxyRequest) {
            next();
            return;
        }
        jsonParser(request, response, (error) => {
            if (error) {
                next(error);
                return;
            }
            formParser(request, response, next);
        });
    });
    for (const prefix of ['/v1', '/mcp']) {
        app.use(prefix, jsonParser, formParser);
    }
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true
        })
    );

    app.enableCors({
        origin: env.CORS_ORIGINS,
        credentials: true
    });

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

    const swaggerConfig = new DocumentBuilder()
        .setTitle('API Gateway')
        .setDescription('Pavilion API Gateway')
        .setVersion('1.0')
        .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    app.get(OpenApiService).registerLocalDocument('pavilion', swaggerDocument as any);
    SwaggerModule.setup('swagger', app, swaggerDocument);

    app.enableShutdownHooks();
    await app.listen(env.APP_PORT);
}

bootstrap()
    .then(() => console.log(`Server is running on ${env.APP_PORT}`))
    .catch(console.error);
