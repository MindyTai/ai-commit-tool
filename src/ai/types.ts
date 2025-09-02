import { Config } from '../config';

export interface AIProvider {
  generateCommitMessage(stagedChanges: string, config: Config): Promise<string>;
}

export interface ModelTokenConfig {
  maxTokensField: 'max_tokens' | 'max_completion_tokens';
  supportsSystemRole: boolean;
}

export interface ProviderModelConfig {
  [modelName: string]: ModelTokenConfig;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface PromptContext {
  stagedChanges: string;
  config: Config;
  repoInfo?: {
    name: string;
    branch: string;
  };
}

export interface TokenLimitOptions {
  max_tokens?: number;
  max_completion_tokens?: number;
}
