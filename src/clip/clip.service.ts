import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { ClipApiResponse } from './types/clip-response.type';

@Injectable()
export class ClipService {
  private readonly logger = new Logger(ClipService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Cria o clip na API externa (thefyrewire) e retorna o link do clip.
   */
  async createClip(channel: string): Promise<string> {
    // Monta a URL que você já usa hoje no comando:
    //
    // !command add !clip $(customapi.https://api.thefyrewire.com/twitch/clips/create/c6130e3ef34e636b0126ccf2e5d72d87?channel=$(channel))
    //
    // Ou seja:
    //  base: https://api.thefyrewire.com/twitch/clips/create
    //  /{CHANNEL_ID}?channel={channelDaTwitch}
    //
    // Vamos montar isso dinâmico:

    const baseUrl = this.config.get<string>('CLIP_API_BASE'); // ex: https://api.thefyrewire.com/twitch/clips/create
    const defaultChannelId = this.config.get<string>('DEFAULT_CHANNEL'); // ex: c6130...
    const channelIdToUse = defaultChannelId;

    const clipUrlApi = `${baseUrl}/${channelIdToUse}?channel=${encodeURIComponent(
      channel,
    )}`;

    this.logger.debug(`Chamando Clip API: ${clipUrlApi}`);

    const { data } = await firstValueFrom(
      this.http.get<ClipApiResponse>(clipUrlApi, {
        // se precisar header tipo Authorization, coloca aqui:
        // headers: { 'Authorization': `Bearer ${this.config.get('CLIP_API_KEY')}` }
      }),
    );

    // Ajuste aqui caso o retorno seja diferente
    const clipUrl = data.url;

    if (!clipUrl) {
      throw new Error('Clip API não retornou url do clip.');
    }

    return clipUrl;
  }

  /**
   * Envia o link do clip no Discord via webhook.
   */
  async sendToDiscord(clipUrl: string, twitchUser?: string, twitchChannel?: string) {
    const webhookUrl = this.config.get<string>('DISCORD_WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn('DISCORD_WEBHOOK_URL não configurado, pulando envio pro Discord.');
      return;
    }

    const content = `🎬 Novo clip criado ${twitchUser ? `por ${twitchUser} ` : ''}no canal ${twitchChannel ?? ''}: ${clipUrl}`;

    this.logger.debug(`Enviando pro Discord: ${content}`);

    await firstValueFrom(
      this.http.post(
        webhookUrl,
        {
          content,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  /**
   * Fluxo completo: cria clip, manda pro Discord e retorna pro chat.
   */
  async handleClipFlow(twitchChannel: string, twitchUser?: string) {
    // 1. cria clip
    const clipUrl = await this.createClip(twitchChannel);

    // 2. manda no Discord
    await this.sendToDiscord(clipUrl, twitchUser, twitchChannel);

    // 3. devolve pro StreamElements (texto puro que vai aparecer no chat)
    return `Clip criado: ${clipUrl}`;
  }
}
