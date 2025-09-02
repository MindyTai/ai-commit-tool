import { ModelTokenConfig } from './types';

/**
 * Centralized model configurations for all AI providers
 * This ensures consistent model support across OpenAI, OpenRouter, Ollama, and Custom providers
 */
export const COMMON_MODEL_CONFIGS: { [modelName: string]: ModelTokenConfig } = {
  // OpenAI GPT Models - GPT-5 and GPT-4 Series
  'gpt-5': { maxTokensField: 'max_completion_tokens', supportsSystemRole: true },
  'gpt-5-nano': { maxTokensField: 'max_completion_tokens', supportsSystemRole: true },
  'gpt-4o': { maxTokensField: 'max_completion_tokens', supportsSystemRole: true },
  'gpt-4o-mini': { maxTokensField: 'max_completion_tokens', supportsSystemRole: true },
  'gpt-4.1-nano': { maxTokensField: 'max_completion_tokens', supportsSystemRole: true },

  // Anthropic Claude Models - Sonnet 3 and 4 Series
  'claude-4-sonnet': { maxTokensField: 'max_tokens', supportsSystemRole: true },
  'claude-3.5-sonnet-20241022': { maxTokensField: 'max_tokens', supportsSystemRole: true },
  'claude-3-sonnet-20240229': { maxTokensField: 'max_tokens', supportsSystemRole: true },

  // Custom/Generic fallback
  'custom': { maxTokensField: 'max_tokens', supportsSystemRole: true },
  'default': { maxTokensField: 'max_tokens', supportsSystemRole: true }
};

/**
 * Provider-specific model prefixes for OpenRouter
 */
export const OPENROUTER_MODEL_PREFIXES = {
  'openai/gpt-5': 'gpt-5',
  'openai/gpt-5-nano': 'gpt-5-nano',
  'openai/gpt-4o': 'gpt-4o',
  'openai/gpt-4o-mini': 'gpt-4o-mini',
  'openai/gpt-4.1-nano': 'gpt-4.1-nano',
  'anthropic/claude-4-sonnet': 'claude-4-sonnet',
  'anthropic/claude-3.5-sonnet': 'claude-3.5-sonnet-20241022',
  'anthropic/claude-3-sonnet': 'claude-3-sonnet-20240229'
};

/**
 * Get model configuration with provider-specific handling
 */
export function getModelConfig(modelName: string, provider: 'openai' | 'openrouter' | 'ollama' | 'custom'): ModelTokenConfig {
  let configKey = modelName;

  // Handle OpenRouter prefixed models
  if (provider === 'openrouter' && modelName in OPENROUTER_MODEL_PREFIXES) {
    configKey = OPENROUTER_MODEL_PREFIXES[modelName as keyof typeof OPENROUTER_MODEL_PREFIXES];
  }

  // Try exact match first
  if (configKey in COMMON_MODEL_CONFIGS) {
    return COMMON_MODEL_CONFIGS[configKey];
  }

  // Fall back to pattern matching
  const patternConfig = getModelConfigByPattern(modelName);
  if (patternConfig) {
    return patternConfig;
  }

  // Final fallback
  return COMMON_MODEL_CONFIGS['default'];
}

/**
 * Pattern matching for custom/unknown models
 */
function getModelConfigByPattern(modelName: string): ModelTokenConfig | null {
  const lowerModel = modelName.toLowerCase();
  
  // Check for OpenAI GPT-4 and GPT-5 variants
  if (lowerModel.includes('gpt-4') || lowerModel.includes('gpt-5')) {
    return { maxTokensField: 'max_completion_tokens', supportsSystemRole: true };
  }
  
    return { maxTokensField: 'max_tokens', supportsSystemRole: true };
 
}
