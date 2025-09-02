import { Config } from '../../config';
import { AIProvider, AIResponse } from '../types';
import { PromptBuilder } from '../PromptBuilder';

export abstract class BaseProvider implements AIProvider {
  protected promptBuilder: PromptBuilder;

  constructor() {
    this.promptBuilder = new PromptBuilder();
  }

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
}
