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
 * Initialize and configures a NestJS application,
 * set up view directories, static assets, CORS (Cross-Origin Resource Sharing) settings, and start the application server
 */
async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false
    });
    app.setBaseViewsDir(join(__dirname, 'views'));
    app.useStaticAssets(join(__dirname, 'statics'), { prefix: '/statics' });
    app.setViewEngine('hbs');

    // Proxy routes retain their raw request stream; only reserved local routes parse bodies.
    for (const prefix of ['/api', '/v1', '/mcp']) {
        app.use(prefix, json({ limit: '10mb' }), urlencoded({ extended: true, limit: '10mb' }));
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
        .setDescription('Sample API Gateway endpoints')
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
