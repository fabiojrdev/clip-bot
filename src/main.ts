import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // habilitar CORS caso vc chame isso de outra origem
  app.enableCors({
    origin: '*',
  });

  await app.listen(3000);
  console.log('Clip API rodando na porta 3000');
}
bootstrap();
