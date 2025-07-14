import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Cookie parser middleware
  app.use(cookieParser());

  // Increase payload size limit for file uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor(reflector));

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:2001',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:2001',
      'https://quadrafc.vercel.app',
      'https://quadrafc-frontend.vercel.app',
      'https://quadrafc-admin.vercel.app',
      'http://192.168.18.5:4200',
      configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-iOS-PWA',
      'X-iOS-PWA-Retry',
      'X-iOS-PWA-Session-Refresh',
      'X-iOS-PWA-Touch',
      'Cache-Control',
      'Pragma',
      'Expires',
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200, // Para suporte a navegadores legados
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('QuadraFC API')
    .setDescription('API para o app de palpites de futebol brasileiro')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 QuadraFC Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
