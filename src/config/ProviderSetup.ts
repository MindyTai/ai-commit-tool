import inquirer from 'inquirer';
import { AIProvider, ProviderConfig } from './types';
import { ConfigValidator } from './ConfigValidator';

export class ProviderSetup {
  private validator: ConfigValidator;

  // Provider-specific model choices
  private readonly providerModels = {
    openai: [
      { name: 'GPT-5 Nano (faster, cheaper)', value: 'gpt-5-nano' },
      { name: 'Enter custom model', value: 'custom' }
    ],
    openrouter: [
      { name: 'GPT-5 Nano (OpenAI)', value: 'openai/gpt-5-nano' },
      { name: 'Enter custom model', value: 'custom' }
    ],
    ollama: [],
    custom: []
  };

  constructor() {
    this.validator = new ConfigValidator();
  }

  async setupProvider(provider: AIProvider): Promise<ProviderConfig> {
    switch (provider) {
      case 'openai':
        return this.setupOpenAI();
      case 'openrouter':
        return this.setupOpenRouter();
      case 'ollama':
        return this.setupOllama();
      case 'custom':
        return this.setupCustom();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async setupOpenAI(): Promise<ProviderConfig> {
    const { key } = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: 'Enter your OpenAI API key:',
      validate: (input: string) => this.validator.validateApiKey(input) || 'Please enter a valid API key'
    }]);

    const { modelChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'modelChoice',
      message: 'Choose OpenAI model:',
      choices: this.providerModels.openai,
      default: 'gpt-3.5-turbo'
    }]);

    return { apiKey: key, model: modelChoice };
  }

  private async setupOpenRouter(): Promise<ProviderConfig> {
    const { key } = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: 'Enter your OpenRouter API key:',
      validate: (input: string) => this.validator.validateApiKey(input) || 'Please enter a valid API key'
    }]);

    const { modelChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'modelChoice',
      message: 'Choose OpenRouter model:',
      choices: this.providerModels.openrouter,
      default: 'openai/gpt-4o-mini'
    }]);

    let model = modelChoice;
    if (modelChoice === 'custom') {
      const { customModel } = await inquirer.prompt([{
        type: 'input',
        name: 'customModel',
        message: 'Enter custom model name (e.g., provider/model-name):',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a model name'
      }]);
      model = customModel;
    }

    return { apiKey: key, model };
  }

  private async setupOllama(): Promise<ProviderConfig> {
    const { url, modelName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter Ollama API URL:',
        default: 'http://localhost:11434',
        validate: (input: string) => this.validator.validateUrl(input) || 'Please enter a valid URL'
      },
      {
        type: 'input',
        name: 'modelName',
        message: 'Enter model name (e.g., llama2, codellama):',
        default: 'llama2',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a model name'
      }
    ]);

    return { apiUrl: url, model: modelName };
  }

  private async setupCustom(): Promise<ProviderConfig> {
    const { url, key, modelName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter custom API endpoint URL:',
        validate: (input: string) => this.validator.validateUrl(input) || 'Please enter a valid URL'
      },
      {
        type: 'input',
        name: 'key',
        message: 'Enter API key (optional):'
      },
      {
        type: 'input',
        name: 'modelName',
        message: 'Enter model name:',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a model name'
      }
    ]);

    return {
      apiUrl: url,
      apiKey: key || undefined,
      model: modelName
    };
  }
}
