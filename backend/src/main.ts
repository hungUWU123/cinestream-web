import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security - Disable crossOriginResourcePolicy to allow frontend to load local static assets (avatars)
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Dynamically allow the request origin to support localhost, local IPs, and VPS testing
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Serve Static Files & Ensure Uploads Dir Exists
  const uploadsDir = join(process.cwd(), 'uploads');
  const avatarsDir = join(uploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 HùngCinema Backend running on: http://localhost:${port}/api`);
}

bootstrap();
