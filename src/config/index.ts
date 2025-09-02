import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from './ConfigManager';
import { ConfigValidator } from './ConfigValidator';
import { ProviderSetup } from './ProviderSetup';
import { Config, AIProvider } from './types';

// Re-export types for backward compatibility
export * from './types';

// Main configuration service
export class ConfigService {
  private manager: ConfigManager;
  private validator: ConfigValidator;
  private providerSetup: ProviderSetup;

  constructor() {
    this.manager = new ConfigManager();
    this.validator = new ConfigValidator();
    this.providerSetup = new ProviderSetup();
  }

  async load(): Promise<Config | null> {
    return this.manager.load();
  }

  async save(config: Config): Promise<void> {
    const validation = this.validator.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    return this.manager.save(config);
  }

  async setup(): Promise<Config> {
    console.log(chalk.cyan('🚀 Welcome to AI Commit Setup!\n'));

    // Basic configuration
    const basicAnswers = await inquirer.prompt<{
      commitStyle: 'conventional' | 'freeform';
      aiProvider: AIProvider;
    }>([
      {
        type: 'list',
        name: 'commitStyle',
        message: 'Choose your preferred commit message style:',
        choices: [
          { name: 'Conventional Commits (feat:, fix:, docs:, etc.)', value: 'conventional' },
          { name: 'Freeform (natural language)', value: 'freeform' }
        ],
        default: 'conventional'
      },
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Choose your AI provider:',
        choices: [
          { name: 'OpenAI (GPT-3.5/GPT-4)', value: 'openai' },
          { name: 'Ollama (Local models)', value: 'ollama' },
          { name: 'OpenRouter (Multiple AI models)', value: 'openrouter' },
          { name: 'Custom API endpoint', value: 'custom' }
        ],
        default: 'openai'
      }
    ]);

    // Provider-specific setup
    const providerConfig = await this.providerSetup.setupProvider(basicAnswers.aiProvider);

    // Advanced options
    const advancedAnswers = await inquirer.prompt([
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Maximum tokens for commit message:',
        default: 150,
        validate: (input: number) => input > 0 && input <= 4000 || 'Must be between 1 and 4000'
      },
      {
        type: 'confirm',
        name: 'includeContext',
        message: 'Include repository context in AI prompts?',
        default: true
      },
      {
        type: 'confirm',
        name: 'autoCommit',
        message: 'Enable auto-commit mode (skip confirmation)?',
        default: false
      }
    ]);

    const config: Config = {
      ...basicAnswers,
      ...providerConfig,
      ...advancedAnswers
    };

    await this.save(config);
    return config;
  }

  getDefaultConfig(): Config {
    return this.manager.getDefaultConfig();
  }
}

// Create singleton instance
const configService = new ConfigService();

// Export convenience functions for backward compatibility
export async function loadConfig(): Promise<Config | null> {
  return configService.load();
}

export async function setupConfig(): Promise<Config> {
  return configService.setup();
}

