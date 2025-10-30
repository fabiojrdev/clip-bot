import { Controller, Get, Query } from '@nestjs/common';
import { ClipService } from './clip.service';
import { CreateClipDto } from './dto/create-clip.dto';

@Controller('clip')
export class ClipController {
  constructor(private readonly clipService: ClipService) {}

  // Exemplo de uso:
  // GET /clip?channel=nomedocanal&type=chat&user=fulano
  //
  // No StreamElements você vai chamar algo tipo:
  // $(customapi.https://SEU-DOMINIO.com/clip?channel=$(channel)&user=$(user))
  //
  @Get()
  async createAndAnnounce(@Query() query: CreateClipDto) {
    const twitchChannel = query.channel || 'meucanal';
    const twitchUser = query.user || 'alguem';

    const msg = await this.clipService.handleClipFlow(
      twitchChannel,
      twitchUser,
    );

    // IMPORTANTE:
    // StreamElements espera texto puro na resposta HTTP.
    // Então vamos retornar string e não JSON.
    return msg;
  }
}
