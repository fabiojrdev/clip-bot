import { ClipService } from './clip.service';
import { ClipController } from './clip.controller';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  controllers: [ClipController],
  providers: [ClipService],
})
export class ClipModule {}
