import { Config } from '../config';

export interface AIProvider {
  generateCommitMessage(stagedChanges: string, config: Config): Promise<string>;
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
