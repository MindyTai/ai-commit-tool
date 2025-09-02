import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';

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

type AIProvider = Config['aiProvider'];

interface ProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  model: string;
}

const CONFIG_FILE = path.join(os.homedir(), '.ai-commit.json');

const DEFAULT_CONFIG: Config = {
  commitStyle: 'conventional',
  aiProvider: 'openrouter',
  model: 'openai/gpt-4o-mini',
  maxTokens: 150,
  includeContext: true,
  autoCommit: false
};

// Provider-specific model choices
const PROVIDER_MODELS = {
  openai: [
    { name: 'GPT-3.5 Turbo (faster, cheaper)', value: 'gpt-3.5-turbo' },
    { name: 'GPT-4 (more accurate, slower)', value: 'gpt-4' },
    { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' }
  ],
  openrouter: [
    { name: 'GPT-4o Mini (OpenAI)', value: 'openai/gpt-4o-mini' },
    { name: 'GPT-3.5 Turbo (OpenAI)', value: 'openai/gpt-3.5-turbo' },
    { name: 'GPT-4 (OpenAI)', value: 'openai/gpt-4' },
    { name: 'Claude 3 Haiku (Anthropic)', value: 'anthropic/claude-3-haiku-20240307' },
    { name: 'Claude 3.5 Sonnet (Anthropic)', value: 'anthropic/claude-3.5-sonnet' },
    { name: 'Llama 3.1 8B (Meta)', value: 'meta-llama/llama-3.1-8b-instruct:free' },
    { name: 'Llama 3.1 70B (Meta)', value: 'meta-llama/llama-3.1-70b-instruct' },
    { name: 'Gemini Pro (Google)', value: 'google/gemini-pro' },
    { name: 'Enter custom model', value: 'custom' }
  ]
} as const;

// Input validation helpers
const validators = {
  required: (input: string) => input.trim() ? true : 'This field is required',
  url: (input: string) => {
    try {
      new URL(input);
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  },
  openaiKey: (input: string) => {
    if (!input.trim()) return 'API key is required';
    if (!input.startsWith('sk-')) return 'OpenAI API key should start with "sk-"';
    return true;
  },
  tokenRange: (input: number) => 
    input > 0 && input <= 1000 ? true : 'Please enter a number between 1 and 1000'
};

export async function loadConfig(): Promise<Config | null> {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    // Config file doesn't exist or is invalid
    return null;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Provider-specific setup functions
async function setupOpenAI(): Promise<ProviderConfig> {
  const { key } = await inquirer.prompt([{
    type: 'password',
    name: 'key',
    message: 'Enter your OpenAI API key:',
    validate: validators.openaiKey
  }]);

  const { modelChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'modelChoice',
    message: 'Choose OpenAI model:',
    choices: PROVIDER_MODELS.openai,
    default: 'gpt-3.5-turbo'
  }]);

  return { apiKey: key, model: modelChoice };
}

async function setupOpenRouter(): Promise<ProviderConfig> {
  const { key } = await inquirer.prompt([{
    type: 'password',
    name: 'key',
    message: 'Enter your OpenRouter API key:',
    validate: validators.required
  }]);

  const { modelChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'modelChoice',
    message: 'Choose OpenRouter model:',
    choices: PROVIDER_MODELS.openrouter,
    default: 'openai/gpt-4o-mini'
  }]);

  let model = modelChoice;
  if (modelChoice === 'custom') {
    const { customModel } = await inquirer.prompt([{
      type: 'input',
      name: 'customModel',
      message: 'Enter custom model name (e.g., provider/model-name):',
      validate: validators.required
    }]);
    model = customModel;
  }

  return { apiKey: key, model };
}

async function setupOllama(): Promise<ProviderConfig> {
  const { url, modelName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter Ollama API URL:',
      default: 'http://localhost:11434',
      validate: validators.url
    },
    {
      type: 'input',
      name: 'modelName',
      message: 'Enter model name (e.g., llama2, codellama):',
      default: 'llama2',
      validate: validators.required
    }
  ]);

  return { apiUrl: url, model: modelName };
}

async function setupCustom(): Promise<ProviderConfig> {
  const { url, key, modelName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter custom API endpoint URL:',
      validate: validators.url
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
      validate: validators.required
    }
  ]);

  return {
    apiUrl: url,
    apiKey: key || undefined,
    model: modelName
  };
}

const PROVIDER_SETUP: Record<AIProvider, () => Promise<ProviderConfig>> = {
  openai: setupOpenAI,
  openrouter: setupOpenRouter,
  ollama: setupOllama,
  custom: setupCustom
};

export async function setupConfig(): Promise<Config> {
  console.log(chalk.cyan('🚀 Welcome to AI Commit Setup!\n'));

  // Basic configuration
  const basicAnswers = await inquirer.prompt<{
    commitStyle: 'conventional' | 'freeform';
    aiProvider: 'openai' | 'ollama' | 'openrouter' | 'custom';
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
  const providerConfig = await PROVIDER_SETUP[basicAnswers.aiProvider]();

  // Advanced options
  const advancedAnswers = await inquirer.prompt([
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Maximum tokens for commit message:',
      default: 150,
      validate: validators.tokenRange
    },
    {
      type: 'confirm',
      name: 'includeContext',
      message: 'Include file context in AI prompt?',
      default: true
    },
    {
      type: 'confirm',
      name: 'autoCommit',
      message: 'Auto-commit without confirmation (not recommended)?',
      default: false
    }
  ]);

  const config: Config = {
    ...basicAnswers,
    ...providerConfig,
    ...advancedAnswers
  };

  await saveConfig(config);
  console.log(chalk.green('\n✅ Configuration saved successfully!'));
  return config;
}

export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const currentConfig = await loadConfig() || DEFAULT_CONFIG;
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}
