import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const port = config.get<number>('app.port') ?? 3000
  const prefix = config.get<string>('app.prefix') ?? 'api'
  const corsOrigin = config.get<string>('app.corsOrigin') ?? 'http://localhost:6019'

  app.setGlobalPrefix(prefix)
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  await app.listen(port)
  const logger = new Logger('Bootstrap')
  logger.log(`Platform API running on http://localhost:${port}/${prefix}`)
  logger.log(`CORS origin: ${corsOrigin}`)
}
bootstrap()
