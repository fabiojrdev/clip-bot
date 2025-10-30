import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClipModule } from './clip/clip.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClipModule,
  ],
})
export class AppModule {}
