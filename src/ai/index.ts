import { Config } from '../config';
import { AIServiceFactory } from './AIServiceFactory';

// Re-export types for backward compatibility
export * from './types';

// Main AI service function - maintains backward compatibility
export async function generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
  const provider = AIServiceFactory.createProvider(config);
  return provider.generateCommitMessage(stagedChanges, config);
}

// Export factory for advanced usage
export { AIServiceFactory } from './AIServiceFactory';
export { PromptBuilder } from './PromptBuilder';

// Export providers for direct usage if needed
export { OpenAIProvider } from './providers/OpenAIProvider';
export { OpenRouterProvider } from './providers/OpenRouterProvider';
export { OllamaProvider } from './providers/OllamaProvider';
export { CustomProvider } from './providers/CustomProvider';
