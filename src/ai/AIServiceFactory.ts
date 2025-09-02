import { Config } from '../config';
import { AIProvider } from './types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { CustomProvider } from './providers/CustomProvider';

export class AIServiceFactory {
  private static providers = new Map<string, AIProvider>();

  static createProvider(config: Config): AIProvider {
    const cacheKey = `${config.aiProvider}-${config.model}`;
    
    // Return cached provider if available
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    let provider: AIProvider;

    switch (config.aiProvider) {
      case 'openai':
        provider = new OpenAIProvider();
        break;
      case 'openrouter':
        provider = new OpenRouterProvider();
        break;
      case 'ollama':
        provider = new OllamaProvider();
        break;
      case 'custom':
        provider = new CustomProvider();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
    }

    // Cache the provider
    this.providers.set(cacheKey, provider);
    return provider;
  }

  static clearCache(): void {
    this.providers.clear();
  }
}
