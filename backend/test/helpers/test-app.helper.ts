import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test BEFORE NestJS ConfigModule reads process.env
// dotenv does NOT override existing env vars (safe for CI where env is set by workflow)
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

let app: INestApplication;

export async function createTestApp(): Promise<{ app: INestApplication; server: any }> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  const server = app.getHttpServer();
  return { app, server };
}

export async function closeTestApp(application?: INestApplication): Promise<void> {
  const appToClose = application || app;
  if (appToClose) {
    await appToClose.close();
  }
}
