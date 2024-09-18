import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {NestExpressApplication} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const apiVersion = config.get("API_VERSION");
  app.setGlobalPrefix(apiVersion);

  await app.listen(3001);
  console.log("ddcm-logic-demo running on port: 3001");
  console.log("-------------------------------------------------------------");
  console.log("Created by: Denny Somad Tio");
  console.log("Visit My Linkedin Profile: ");
  console.log("https://www.linkedin.com/in/denny-somad-tio/");
  console.log("OR");
  console.log("Visit My Portfolio: ");
  console.log("https://dennytio90.my.id/");
  console.log("-------------------------------------------------------------");
}
bootstrap();
