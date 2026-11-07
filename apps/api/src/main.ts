import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { env } from '@/interface/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT);
}

void bootstrap();
