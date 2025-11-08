import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ClipService } from './clip.service';
import { CreateClipDto } from './dto/create-clip.dto';

@Controller('clip')
export class ClipController {
  private readonly logger = new Logger(ClipController.name);

  constructor(private readonly clipService: ClipService) {}

  private async processRequest(
    query: CreateClipDto,
    res: Response,
    resultWebhookKey: string,
  ) {
    const twitchChannel = query.channel || 'meucanal';
    const twitchUser = query.user || 'alguem';

    try {
      // Aguarda o clip ser criado
      const clipUrl = await this.clipService.processClipRequest(
        twitchChannel,
        twitchUser,
        resultWebhookKey,
      );

      if (clipUrl) {
        // Retorna as duas mensagens separadas por quebra de linha
        const responseText = `Criando seu clip, segura a mao ai!\nToma teu clipe: ${clipUrl}`;
        return res.status(200).type('text/plain').send(responseText);
      }

      return res
        .status(200)
        .type('text/plain')
        .send('Criando seu clip, segura a mao ai!\nFalha ao criar clipe. Tente novamente.');
    } catch (err: any) {
      this.logger.error(
        'Erro inesperado em processClipRequest:',
        err?.stack || err,
      );
      return res
        .status(200)
        .type('text/plain')
        .send('Criando seu clip, segura a mao ai!\nErro ao processar clipe.');
    }
  }

  // GET /clip?channel=$(channel)&user=$(user)
  // Esse endpoint serǭ chamado via $(customapi ...)
  @Get()
  async createAndAnnounce(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    return this.processRequest(query, res, 'DISCORD_WEBHOOK_CLIP');
  }

  @Get('highlight')
  async createHighlightClip(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    return this.processRequest(query, res, 'DISCORD_WEBHOOK_CLIP_HIGHLIGHT');
  }

  @Get('pinadas')
  async createPinnedClip(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    return this.processRequest(query, res, 'DISCORD_WEBHOOK_CLIP_PINADAS');
  }

  @Get('rage')
  async createRageClip(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    return this.processRequest(query, res, 'DISCORD_WEBHOOK_CLIP_RAGE');
  }

  @Get('profit')
  async createProfitClip(
    @Query() query: CreateClipDto,
    @Res() res: Response,
  ) {
    return this.processRequest(query, res, 'DISCORD_WEBHOOK_CLIP_PROFIT');
  }
}
