import "./env";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({origin:allowedOrigins,credentials:true});
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
  const config = new DocumentBuilder().setTitle("SIGA Elite API").setVersion("0.1.0").addCookieAuth("siga_session").build();
  SwaggerModule.setup("docs",app,SwaggerModule.createDocument(app,config));
  await app.listen(Number(process.env.PORT ?? process.env.API_PORT ?? 4000),"0.0.0.0");
}
void bootstrap();
