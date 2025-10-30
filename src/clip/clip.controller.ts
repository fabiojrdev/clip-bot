import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ClipService } from './clip.service';
import { CreateClipDto } from './dto/create-clip.dto';

@Controller('clip')
export class ClipController {
  private readonly logger = new Logger(ClipController.name);

  constructor(private readonly clipService: ClipService) {}

  // GET /clip?channel=$(channel)&user=$(user)
  // Esse endpoint será chamado via $(customapi ...)
  @Get()
  async createAndAnnounce(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    const twitchChannel = query.channel || 'meucanal';
    const twitchUser = query.user || 'alguem';

    // Dispara o fluxo, mas NÃO espera terminar pra responder.
    // Isso evita timeout no StreamElements.
    this.clipService
      .processClipRequest(twitchChannel, twitchUser)
      .catch((err) => {
        this.logger.error(
          'Erro inesperado em processClipRequest:',
          err?.stack || err,
        );
      });

    // O que volta pro chat da Twitch imediatamente.
    // Você pode customizar essa frase se quiser.
    const responseText =
      'Tentativa de clip iniciada. Verifique o Discord 👍';

    return res.status(200).type('text/plain').send(responseText);
  }
}
