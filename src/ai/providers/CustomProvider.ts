import { Config } from '../../config';
import { BaseProvider } from './BaseProvider';

export class CustomProvider extends BaseProvider {
  protected getProviderType(): 'custom' {
    return 'custom';
  }

  async generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
    if (!config.apiUrl) {
      throw new Error('Custom API URL is required');
    }

    const prompt = await this.buildPrompt(stagedChanges, config);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(config)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          ...this.getTokenLimitOptions(config),
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fullMessage = data.choices?.[0]?.message?.content || data.response;
      
      if (!fullMessage) {
        throw new Error('No response from custom API');
      }

      // Only return the first line of the commit message
      const firstLine = fullMessage.split('\n')[0].trim();
      return firstLine;
    } catch (error) {
      throw this.createError('generate commit message', error);
    }
  }

  protected getProviderName(): string {
    return 'Custom API';
  }
}
