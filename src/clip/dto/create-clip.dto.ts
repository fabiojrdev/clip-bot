import { IsOptional, IsString } from 'class-validator';

export class CreateClipDto {
  @IsString()
  @IsOptional()
  channel?: string;

  @IsString()
  @IsOptional()
  user?: string;
}
