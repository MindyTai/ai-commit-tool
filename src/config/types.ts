export interface Config {
  commitStyle: 'conventional' | 'freeform';
  aiProvider: 'openai' | 'ollama' | 'openrouter' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  model: string;
  maxTokens: number;
  includeContext: boolean;
  autoCommit: boolean;
}

export type AIProvider = Config['aiProvider'];

export interface ProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  model: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
