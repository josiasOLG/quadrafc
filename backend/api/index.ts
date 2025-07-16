import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/shared/filters/global-exception.filter';
import { ResponseTransformInterceptor } from '../src/shared/interceptors/response-transform.interceptor';

let cachedApp: any = null;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Validate required environment variables for JWT
  const requiredEnvVars = ['JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
  }

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

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    })
  );

  // CORS configuration for JWT tokens e upload de imagens
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
      'http://192.168.18.5:2001',
      // Add your custom domains here
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Cache-Control',
      'Pragma',
      'Expires',
      'X-iOS-PWA',
      'X-iOS-PWA-Retry',
      'X-iOS-PWA-Session-Refresh',
      'X-iOS-PWA-Touch',
      'X-Upload-Source',
      'X-File-Type',
    ],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 horas para pre-flight cache
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Trust proxy for JWT in production (Vercel)
  if (process.env.NODE_ENV === 'production') {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  // Swagger documentation - Only in development
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('QuadraFC API')
      .setDescription('API para o app de palpites de futebol brasileiro')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.init();
  cachedApp = app;
  return app;
}

// For Vercel serverless functions
export default async function handler(req: any, res: any) {
  try {
    // Configurar headers específicos para upload no Vercel
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization,Accept,X-Requested-With,Cache-Control,X-iOS-PWA,X-Upload-Source'
      );
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }

    const app = await createApp();

    // Simple API status route
    if (req.url === '/api' || req.url === '/api/') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        message: 'QuadraFC API is running! 🚀',
        version: '1.0.0',
        authentication: 'JWT Bearer Token',
        docs: process.env.NODE_ENV !== 'production' ? '/docs' : 'Swagger disabled in production',
        environment: process.env.NODE_ENV || 'development',
        upload_limit: '10mb',
        vercel_function: true,
      });
    }

    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process request',
      timestamp: new Date().toISOString(),
    });
  }
}

// For local development
if (require.main === module) {
  async function bootstrap() {
    const app = await createApp();
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3000);
    await app.listen(port);
  }
  bootstrap();
}
