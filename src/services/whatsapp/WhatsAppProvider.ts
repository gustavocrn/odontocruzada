import {
  WhatsAppSendTextOptions,
  WhatsAppSendTemplateOptions,
  WhatsAppSendResult
} from './types';

/**
 * Cliente isolado para a WhatsApp Business Platform / Meta Cloud API (Graph API).
 */
export class WhatsAppProvider {
  /**
   * Obtém a versão da Graph API configurada nas variáveis de ambiente.
   * EXIGE que META_GRAPH_API_VERSION esteja definida. Lança erro explícito se ausente (fail-fast).
   */
  private get apiVersion(): string {
    const version = process.env.META_GRAPH_API_VERSION;
    if (!version || !version.trim()) {
      throw new Error(
        'CONFIGURAÇÃO INVÁLIDA: A variável de ambiente META_GRAPH_API_VERSION é OBRIGATÓRIA e não está definida no servidor (.env.local).'
      );
    }
    return version.trim();
  }

  private get phoneNumberId(): string {
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
    if (!phoneId || !phoneId.trim()) {
      throw new Error(
        'CONFIGURAÇÃO INVÁLIDA: A variável de ambiente META_WA_PHONE_NUMBER_ID é OBRIGATÓRIA no servidor (.env.local).'
      );
    }
    return phoneId.trim();
  }

  private get accessToken(): string {
    const token = process.env.META_WA_ACCESS_TOKEN;
    if (!token || !token.trim()) {
      throw new Error(
        'CONFIGURAÇÃO INVÁLIDA: A variável de ambiente META_WA_ACCESS_TOKEN é OBRIGATÓRIA no servidor (.env.local).'
      );
    }
    return token.trim();
  }

  /**
   * Sanitiza a resposta de erro recebida da Meta, extraindo apenas código e mensagem operacional sem vazar tokens/headers.
   */
  private sanitizeMetaError(errData: any): { errorCode: string; errorMessage: string } {
    const code = errData?.error?.code || errData?.code || 'META_API_ERROR';
    const message = errData?.error?.message || errData?.message || 'Falha na comunicação com a Graph API da Meta.';
    return {
      errorCode: String(code),
      errorMessage: String(message).substring(0, 200) // limita tamanho por segurança
    };
  }

  /**
   * Envia mensagem de texto livre dentro da janela de 24 horas.
   */
  async sendText(options: WhatsAppSendTextOptions): Promise<WhatsAppSendResult> {
    const version = this.apiVersion;
    const phoneId = this.phoneNumberId;
    const token = this.accessToken;

    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: options.to,
          type: 'text',
          text: {
            preview_url: false,
            body: options.text
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const sanitized = this.sanitizeMetaError(data);
        return {
          success: false,
          errorCode: sanitized.errorCode,
          errorMessage: sanitized.errorMessage
        };
      }

      const messageId = data.messages?.[0]?.id;
      return {
        success: true,
        messageId
      };
    } catch (err: any) {
      const isTimeout = err?.code === 'AMBIGUOUS_TIMEOUT' || err?.message?.toLowerCase().includes('timeout') || err?.message?.includes('ETIMEDOUT');
      return {
        success: false,
        errorCode: isTimeout ? 'AMBIGUOUS_TIMEOUT' : 'NETWORK_ERROR',
        errorMessage: err?.message || 'Erro de conexão de rede ao enviar mensagem via Meta API.'
      };
    }
  }

  /**
   * Envia Modelo de Mensagem (Template) pré-aprovado pela Meta fora da janela de 24 horas.
   */
  async sendTemplate(options: WhatsAppSendTemplateOptions): Promise<WhatsAppSendResult> {
    const version = this.apiVersion;
    const phoneId = this.phoneNumberId;
    const token = this.accessToken;

    try {
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: options.to,
          type: 'template',
          template: {
            name: options.templateName,
            language: { code: options.languageCode },
            components: options.components || []
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const sanitized = this.sanitizeMetaError(data);
        return {
          success: false,
          errorCode: sanitized.errorCode,
          errorMessage: sanitized.errorMessage
        };
      }

      const messageId = data.messages?.[0]?.id;
      return {
        success: true,
        messageId
      };
    } catch (err: any) {
      const isTimeout = err?.code === 'AMBIGUOUS_TIMEOUT' || err?.message?.toLowerCase().includes('timeout') || err?.message?.includes('ETIMEDOUT');
      return {
        success: false,
        errorCode: isTimeout ? 'AMBIGUOUS_TIMEOUT' : 'NETWORK_ERROR',
        errorMessage: err?.message || 'Erro de conexão ao enviar template via Meta API.'
      };
    }
  }

  /**
   * Marca uma mensagem inbound como lida no aplicativo do cliente.
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtém os metadados de download de mídia na Meta pelo media_id.
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      const sanitized = this.sanitizeMetaError(data);
      throw new Error(`Falha ao obter URL de mídia da Meta [${sanitized.errorCode}]: ${sanitized.errorMessage}`);
    }

    const data = await response.json();
    return data.url;
  }
}
