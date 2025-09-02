import inquirer from 'inquirer';
import { AIProvider, ProviderConfig } from './types';
import { ConfigValidator } from './ConfigValidator';
import { COMMON_MODEL_CONFIGS, OPENROUTER_MODEL_PREFIXES } from '../ai/ModelConfigurations';

export class ProviderSetup {
  private validator: ConfigValidator;

  // Generate provider-specific model choices from centralized configurations
  private getProviderModels() {
    return {
      openai: this.getOpenAIModels(),
      openrouter: this.getOpenRouterModels(),
      ollama: this.getOllamaModels(),
      custom: [{ name: 'Enter custom model', value: 'custom' }]
    };
  }

  private getOpenAIModels() {
    const openaiModels = Object.keys(COMMON_MODEL_CONFIGS)
      .filter(model => {
        // Include GPT-4 and GPT-5 series only
        return model.startsWith('gpt-4') || model.startsWith('gpt-5');
      })
      .map(model => ({
        name: model,
        value: model
      }));
    
    return [
      ...openaiModels,
      { name: 'Enter custom model', value: 'custom' }
    ];
  }

  private getOpenRouterModels() {
    const openrouterModels = Object.keys(OPENROUTER_MODEL_PREFIXES)
      .map(model => ({
        name: model,
        value: model
      }));
    
    return [
      ...openrouterModels,
      { name: 'Enter custom model', value: 'custom' }
    ];
  }

  private getOllamaModels() {
    
    return [
      { name: 'Enter custom model', value: 'custom' }
    ];
  }

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
      choices: this.getProviderModels().openai,
      default: 'gpt-5-nano'
    }]);

    let model = modelChoice;
    if (modelChoice === 'custom') {
      const { customModel } = await inquirer.prompt([{
        type: 'input',
        name: 'customModel',
        message: 'Enter custom model name (e.g., gpt-4-custom):',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a model name'
      }]);
      model = customModel;
    }

    return { apiKey: key, model };
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
      choices: this.getProviderModels().openrouter,
      default: 'openai/gpt-5-nano'
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
    const { url } = await inquirer.prompt([{
      type: 'input',
      name: 'url',
      message: 'Enter Ollama API URL:',
      default: 'http://localhost:11434',
      validate: (input: string) => this.validator.validateUrl(input) || 'Please enter a valid URL'
    }]);

    const { modelChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'modelChoice',
      message: 'Choose Ollama model:',
      choices: this.getProviderModels().ollama,
      default: 'llama3.1'
    }]);

    let model = modelChoice;
    if (modelChoice === 'custom') {
      const { customModel } = await inquirer.prompt([{
        type: 'input',
        name: 'customModel',
        message: 'Enter custom model name (e.g., llama2, codellama):',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a model name'
      }]);
      model = customModel;
    }

    return { apiUrl: url, model };
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
