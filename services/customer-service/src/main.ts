import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Pavilion AI Customer Service")
    .setDescription("Customer service APIs exposed only through the Pavilion gateway")
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", in: "header", name: "auth-user-id" }, "auth-user-id")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("swagger", app, document);
  app.getHttpAdapter().get("/openapi-json", (_request, response) => response.json(document));

  const port = Number(process.env.PORT || 3100);
  await app.listen(port, "127.0.0.1");
  console.log(`Customer service is running on http://127.0.0.1:${port}`);
}

bootstrap().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
