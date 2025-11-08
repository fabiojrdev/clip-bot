## Variáveis de ambiente relevantes

| Variável | Descrição |
| --- | --- |
| `CLIP_API_BASE` | Base da API externa que cria o clip (ex.: `https://api.thefyrewire.com/twitch/clips/create`). |
| `DEFAULT_CHANNEL` | Channel ID padrão que será usado na criação do clip. |
| `DISCORD_WEBHOOK_FEEDBACK` | Webhook que recebe o log imediato informando que uma tentativa de clip começou. |
| `DISCORD_WEBHOOK_CLIP` | Webhook padrão para o resultado final do endpoint `/clip`. |
| `DISCORD_WEBHOOK_CLIP_HIGHLIGHT` | Webhook específico usado quando o endpoint `/clip/highlight` for chamado. |
| `DISCORD_WEBHOOK_CLIP_PINADAS` | Webhook específico do endpoint `/clip/pinadas`. |
| `DISCORD_WEBHOOK_CLIP_RAGE` | Webhook específico do endpoint `/clip/rage`. |
| `DISCORD_WEBHOOK_CLIP_PROFIT` | Webhook específico do endpoint `/clip/profit`. |

> Se algum webhook específico não estiver configurado, o serviço apenas registra um aviso e segue sem enviar o resultado para aquele canal.
