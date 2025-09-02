import { Config, ValidationResult } from './types';

export class ConfigValidator {
  private readonly requiredFields: (keyof Config)[] = [
    'commitStyle',
    'aiProvider',
    'model',
    'maxTokens',
    'includeContext',
    'autoCommit'
  ];

  private readonly validCommitStyles = ['conventional', 'freeform'] as const;
  private readonly validProviders = ['openai', 'ollama', 'openrouter', 'custom'] as const;

  validate(config: Partial<Config>): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    this.validateRequiredFields(config, errors);
    
    // Validate field values
    this.validateCommitStyle(config.commitStyle, errors);
    this.validateAIProvider(config.aiProvider, errors);
    this.validateModel(config.model, errors);
    this.validateMaxTokens(config.maxTokens, errors);
    this.validateProviderSpecificFields(config, errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.trim().length > 0;
  }

  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private validateRequiredFields(config: Partial<Config>, errors: string[]): void {
    for (const field of this.requiredFields) {
      if (config[field] === undefined || config[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  private validateCommitStyle(commitStyle: unknown, errors: string[]): void {
    if (commitStyle && !this.validCommitStyles.includes(commitStyle as any)) {
      errors.push(`Invalid commit style: ${commitStyle}. Must be one of: ${this.validCommitStyles.join(', ')}`);
    }
  }

  private validateAIProvider(aiProvider: unknown, errors: string[]): void {
    if (aiProvider && !this.validProviders.includes(aiProvider as any)) {
      errors.push(`Invalid AI provider: ${aiProvider}. Must be one of: ${this.validProviders.join(', ')}`);
    }
  }

  private validateModel(model: unknown, errors: string[]): void {
    if (model && (typeof model !== 'string' || model.trim().length === 0)) {
      errors.push('Model must be a non-empty string');
    }
  }

  private validateMaxTokens(maxTokens: unknown, errors: string[]): void {
    if (maxTokens !== undefined) {
      if (typeof maxTokens !== 'number' || maxTokens <= 0 || maxTokens > 4000) {
        errors.push('Max tokens must be a positive number between 1 and 4000');
      }
    }
  }

  private validateProviderSpecificFields(config: Partial<Config>, errors: string[]): void {
    const { aiProvider, apiKey, apiUrl } = config;

    switch (aiProvider) {
      case 'openai':
      case 'openrouter':
        if (!apiKey || !this.validateApiKey(apiKey)) {
          errors.push(`${aiProvider} requires a valid API key`);
        }
        break;
      
      case 'ollama':
        if (!apiUrl || !this.validateUrl(apiUrl)) {
          errors.push('Ollama requires a valid API URL');
        }
        break;
      
      case 'custom':
        if (!apiUrl || !this.validateUrl(apiUrl)) {
          errors.push('Custom provider requires a valid API URL');
        }
        break;
    }
  }
}
