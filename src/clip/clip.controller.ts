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

    try {
      // Aguarda o clip ser criado
      const clipUrl = await this.clipService.processClipRequest(
        twitchChannel,
        twitchUser,
      );

      if (clipUrl) {
        // Retorna as duas mensagens separadas por quebra de linha
        const responseText = `Criando seu clip segura a mão 👍\nTomae teu clipe truta: ${clipUrl}`;
        return res.status(200).type('text/plain').send(responseText);
      } else {
        return res
          .status(200)
          .type('text/plain')
          .send('Criando seu clip segura a mão 👍\n❌ Falha ao criar clipe. Tente novamente.');
      }
    } catch (err: any) {
      this.logger.error(
        'Erro inesperado em processClipRequest:',
        err?.stack || err,
      );
      return res
        .status(200)
        .type('text/plain')
        .send('Criando seu clip segura a mão 👍\n❌ Erro ao processar clipe.');
    }
  }
}
