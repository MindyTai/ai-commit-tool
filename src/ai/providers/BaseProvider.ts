import { Config } from '../../config';
import { AIProvider, AIResponse, ModelTokenConfig, TokenLimitOptions } from '../types';
import { PromptBuilder } from '../PromptBuilder';
import { getModelConfig } from '../ModelConfigurations';

export abstract class BaseProvider implements AIProvider {
  protected promptBuilder: PromptBuilder;

  constructor() {
    this.promptBuilder = new PromptBuilder();
  }

  protected abstract getProviderType(): 'openai' | 'openrouter' | 'ollama' | 'custom';

  abstract generateCommitMessage(stagedChanges: string, config: Config): Promise<string>;

  protected createError(operation: string, error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`${this.getProviderName()} API error: ${error.message}`);
    }
    return new Error(`${this.getProviderName()} API error: Unknown error`);
  }

  protected abstract getProviderName(): string;

  protected async buildPrompt(stagedChanges: string, config: Config): Promise<string> {
    return this.promptBuilder.buildPrompt(stagedChanges, config);
  }

  protected getSystemPrompt(config: Config): string {
    return this.promptBuilder.getSystemPrompt(config.commitStyle);
  }

  protected getTokenLimitOptions(config: Config): TokenLimitOptions {
    const modelConfig = getModelConfig(config.model, this.getProviderType());

    if (modelConfig.maxTokensField === 'max_completion_tokens') {
      return { max_completion_tokens: config.maxTokens };
    } else {
      return { max_tokens: config.maxTokens };
    }
  }

}
