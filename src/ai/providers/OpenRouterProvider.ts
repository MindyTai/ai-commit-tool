import { Config } from '../../config';
import { BaseProvider } from './BaseProvider';

export class OpenRouterProvider extends BaseProvider {
  async generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    const prompt = await this.buildPrompt(stagedChanges, config);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/ai-commit-tools',
          'X-Title': 'AI Commit Tools'
        },
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
          max_tokens: config.maxTokens,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const message = data.choices?.[0]?.message?.content;
      if (!message) {
        throw new Error(`No response from OpenRouter. Response: ${JSON.stringify(data)}`);
      }

      return message.trim();
    } catch (error) {
      throw this.createError('generate commit message', error);
    }
  }

  protected getProviderName(): string {
    return 'OpenRouter';
  }
}
