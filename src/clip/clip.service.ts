import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ClipService {
  private readonly logger = new Logger(ClipService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Dispara uma mensagem inicial no Discord dizendo que a tentativa começou.
   */
  async sendAttemptLog(twitchChannel?: string, twitchUser?: string) {
    const webhookUrl = this.config.get<string>('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn('DISCORD_WEBHOOK_URL não configurado, pulando tentativa inicial.');
      return;
    }

    const baseMsg = 'Tentativa de clip foi iniciada:';
    // Você pediu exatamente esse texto incluindo o próprio webhook na mesma linha.
    // Vou mandar exatamente como você descreveu.
    const fullMsg = `${baseMsg} ${webhookUrl}\nCanal: ${twitchChannel ?? '-'} | User: ${twitchUser ?? '-'}`;

    await firstValueFrom(
      this.http.post(
        webhookUrl,
        { content: fullMsg },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  /**
   * Dispara uma segunda mensagem no Discord com o resultado/link do clip.
   */
  async sendResultLog(clipUrl: string, twitchChannel?: string, twitchUser?: string) {
    const webhookUrl = this.config.get<string>('DISCORD_CLIPES_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn('DISCORD_WEBHOOK_URL não configurado, pulando resultado.');
      return;
    }

    const content = [
      '✅ Clip criado!',
      `Canal: ${twitchChannel ?? '-'}`,
      `User: ${twitchUser ?? '-'}`,
      `Link: ${clipUrl}`,
    ].join('\n');

    await firstValueFrom(
      this.http.post(
        webhookUrl,
        { content },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  /**
   * Fala com a API externa que realmente cria o clip e retorna o link final.
   */
  async createClip(twitchChannel: string): Promise<string> {
    const baseUrl = this.config.get<string>('CLIP_API_BASE'); // ex: https://api.thefyrewire.com/twitch/clips/create
    const defaultChannelId = this.config.get<string>('DEFAULT_CHANNEL'); // ex: c6130e...

    const clipUrlApi = `${baseUrl}/${defaultChannelId}?channel=${encodeURIComponent(
      twitchChannel,
    )}`;

    this.logger.debug(`Chamando Clip API: ${clipUrlApi}`);

    const { data } = await firstValueFrom(
      this.http.get(clipUrlApi),
    );

    // Log pra debug (importante enquanto a gente está acertando o formato)
    this.logger.debug('Resposta da Clip API:', JSON.stringify(data));

    // Tentar achar o link do clip em formatos comuns:
    const clipUrl =
      data?.url ||
      data?.clip_url ||
      data?.clipUrl ||
      data?.link ||
      data?.clip?.url ||
      data?.data?.url;

    if (!clipUrl) {
      throw new Error('Clip API não retornou url do clip.');
    }

    return clipUrl;
  }

  /**
   * Fluxo completo: loga tentativa, cria clip, loga resultado e devolve msg pro chat.
   */
  async handleClipFlow(twitchChannel: string, twitchUser?: string) {
    // 1. logar tentativa
    await this.sendAttemptLog(twitchChannel, twitchUser);

    // 2. criar clip de fato
    const clipUrl = await this.createClip(twitchChannel);

    // 3. logar resultado com o link final
    await this.sendResultLog(clipUrl, twitchChannel, twitchUser);

    // 4. resposta que vai pro chat da Twitch via StreamElements
    return `Clip criado: ${clipUrl}`;
  }
}
