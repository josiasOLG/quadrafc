import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/shared/filters/global-exception.filter';
import { ResponseTransformInterceptor } from '../src/shared/interceptors/response-transform.interceptor';

let cachedApp: any = null;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Cookie parser middleware
  app.use(cookieParser());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Response transform interceptor
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

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:2001',
      'https://quadrafc-frontend.vercel.app',
      'https://quadrafc-admin.vercel.app',
      // Add your custom domains here
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    optionsSuccessStatus: 200,
  });

  // Global prefix
  app.setGlobalPrefix('api');

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
  const app = await createApp();

  // Simple API status route
  if (req.url === '/api' || req.url === '/api/') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      message: 'QuadraFC API is running! 🚀',
      version: '1.0.0',
      docs: process.env.NODE_ENV !== 'production' ? '/docs' : 'Swagger disabled in production',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

// For local development
if (require.main === module) {
  async function bootstrap() {
    const app = await createApp();
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 QuadraFC Backend running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }
  bootstrap();
}
