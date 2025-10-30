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
   * Webhook de FEEDBACK IMEDIATO:
   * "tentativa de clip foi iniciada", só pra confirmar que a API rodou.
   */
  async sendAttemptLog(twitchChannel?: string, twitchUser?: string) {
    const webhookUrl = this.config.get<string>('DISCORD_WEBHOOK_FEEDBACK');
    if (!webhookUrl) {
      this.logger.warn(
        'DISCORD_WEBHOOK_FEEDBACK não configurado, pulando tentativa inicial.',
      );
      return;
    }

    // Mensagem que você quer ver no canal de feedback
    const fullMsg = [
      '🚀 Tentativa de clip foi iniciada!',
      `Canal: ${twitchChannel ?? '-'}`,
      `User: ${twitchUser ?? '-'}`,
      `Horário: ${new Date().toISOString()}`,
    ].join('\n');

    await firstValueFrom(
      this.http.post(
        webhookUrl,
        { content: fullMsg },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  /**
   * Webhook de RESULTADO FINAL:
   * "clip criado" + link final do clip.
   */
  async sendResultLog(
    clipUrl: string | null,
    twitchChannel?: string,
    twitchUser?: string,
  ) {
    const webhookUrl = this.config.get<string>(
      'DISCORD_WEBHOOK_CLIP',
    );
    if (!webhookUrl) {
      this.logger.warn(
        'DISCORD_WEBHOOK_CLIP não configurado, pulando resultado.',
      );
      return;
    }

    const contentLines: string[] = [
      '🎬 Resultado do Clip',
      `Canal: ${twitchChannel ?? '-'}`,
      `User: ${twitchUser ?? '-'}`,
      '@everyone',
    ];

    if (clipUrl) {
      contentLines.push(`Link do clip: ${clipUrl}`);
    } else {
      contentLines.push(
        '❌ Falha ao capturar link do clip (a API externa não retornou URL)',
      );
    }

    const content = contentLines.join('\n');

    await firstValueFrom(
      this.http.post(
        webhookUrl,
        { content },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  /**
   * Fala com a API externa que realmente cria o clip e tenta extrair o link final.
   */
  async createClip(twitchChannel: string): Promise<string | null> {
    const baseUrl = this.config.get<string>('CLIP_API_BASE'); // ex: https://api.thefyrewire.com/twitch/clips/create
    const defaultChannelId = this.config.get<string>('DEFAULT_CHANNEL'); // ex: c6130e...

    const clipUrlApi = `${baseUrl}/${defaultChannelId}?channel=${encodeURIComponent(
      twitchChannel,
    )}`;

    this.logger.debug(`Chamando Clip API: ${clipUrlApi}`);

    const { data } = await firstValueFrom(this.http.get(clipUrlApi));

    // Log cru pra você debugar no console do servidor
    this.logger.debug('Resposta da Clip API: ' + JSON.stringify(data));

    // Se a resposta for uma string diretamente, usa ela
    if (typeof data === 'string') {
      return data;
    }

    // Tentativas de chaves comuns em objetos
    const clipUrl =
      data?.url ||
      data?.clip_url ||
      data?.clipUrl ||
      data?.link ||
      data?.clip?.url ||
      data?.data?.url ||
      data?.data?.link;

    if (!clipUrl || typeof clipUrl !== 'string') {
      this.logger.error(
        'Clip API não retornou uma url string reconhecida.',
      );
      return null;
    }

    return clipUrl;
  }

  /**
   * Fluxo completo:
   * 1. manda feedback imediato (webhook 1)
   * 2. tenta criar clip
   * 3. manda resultado final com link (webhook 2)
   *
   * Observação: NÃO retorna nada pro chat. O controller cuida da resposta.
   */
  async processClipRequest(twitchChannel: string, twitchUser?: string) {
    // 1. Feedback imediato
    try {
      await this.sendAttemptLog(twitchChannel, twitchUser);
    } catch (err: any) {
      this.logger.error(
        'Erro ao enviar webhook de tentativa inicial:',
        err?.stack || err,
      );
    }

    // 2. Criar clip
    let clipUrl: string | null = null;
    try {
      clipUrl = await this.createClip(twitchChannel);
    } catch (err: any) {
      this.logger.error('Erro ao criar clip:', err?.stack || err);
    }

    // 3. Mandar resultado pro webhook de clipes
    try {
      await this.sendResultLog(clipUrl, twitchChannel, twitchUser);
    } catch (err: any) {
      this.logger.error(
        'Erro ao enviar webhook de resultado do clip:',
        err?.stack || err,
      );
    }
  }
}
