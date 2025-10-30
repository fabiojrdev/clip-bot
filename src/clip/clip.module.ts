import { ClipService } from './clip.service';
import { ClipController } from './clip.controller';

@Module({
  imports: [HttpModule],
  controllers: [ClipController],
  providers: [ClipService],
})
export class ClipModule {}
