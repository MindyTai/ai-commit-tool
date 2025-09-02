import OpenAI from 'openai';
import { Config } from '../../config';
import { BaseProvider } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  protected getProviderType(): 'openai' {
    return 'openai';
  }

  async generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const openai = new OpenAI({
      apiKey: config.apiKey,
    });

    const prompt = await this.buildPrompt(stagedChanges, config);

    try {
      const response = await openai.chat.completions.create({
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
      });

      const message = response.choices[0]?.message?.content;
      if (!message) {
        throw new Error('No response from OpenAI');
      }

      return message.trim();
    } catch (error) {
      throw this.createError('generate commit message', error);
    }
  }

  protected getProviderName(): string {
    return 'OpenAI';
  }
}
