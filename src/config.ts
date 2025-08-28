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

const CONFIG_FILE = path.join(os.homedir(), '.ai-commit.json');

const DEFAULT_CONFIG: Config = {
  commitStyle: 'conventional',
  aiProvider: 'openrouter',
  model: 'openai/gpt-4o-mini',
  maxTokens: 150,
  includeContext: true,
  autoCommit: false
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

export async function setupConfig(): Promise<Config> {
  console.log(chalk.cyan('🚀 Welcome to AI Commit Setup!\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'commitStyle',
      message: 'Choose your preferred commit message style:',
      choices: [
        {
          name: 'Conventional Commits (feat:, fix:, docs:, etc.)',
          value: 'conventional'
        },
        {
          name: 'Freeform (natural language)',
          value: 'freeform'
        }
      ],
      default: 'conventional'
    },
    {
      type: 'list',
      name: 'aiProvider',
      message: 'Choose your AI provider:',
      choices: [
        {
          name: 'OpenAI (GPT-3.5/GPT-4)',
          value: 'openai'
        },
        {
          name: 'Ollama (Local models)',
          value: 'ollama'
        },
        {
          name: 'OpenRouter (Multiple AI models)',
          value: 'openrouter'
        },
        {
          name: 'Custom API endpoint',
          value: 'custom'
        }
      ],
      default: 'openai'
    }
  ]);

  let apiKey: string | undefined;
  let apiUrl: string | undefined;
  let model: string;

  if (answers.aiProvider === 'openai') {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your OpenAI API key:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'API key is required';
          }
          if (!input.startsWith('sk-')) {
            return 'OpenAI API key should start with "sk-"';
          }
          return true;
        }
      }
    ]);
    apiKey = key;

    const { modelChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'modelChoice',
        message: 'Choose OpenAI model:',
        choices: [
          { name: 'GPT-3.5 Turbo (faster, cheaper)', value: 'gpt-3.5-turbo' },
          { name: 'GPT-4 (more accurate, slower)', value: 'gpt-4' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' }
        ],
        default: 'gpt-3.5-turbo'
      }
    ]);
    model = modelChoice;

  } else if (answers.aiProvider === 'openrouter') {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your OpenRouter API key:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'API key is required';
          }
          return true;
        }
      }
    ]);
    apiKey = key;

    const { modelChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'modelChoice',
        message: 'Choose OpenRouter model:',
        choices: [
          { name: 'GPT-5 Mini (OpenAI)', value: 'openai/gpt-5-mini' },
          { name: 'GPT-4o Mini (OpenAI)', value: 'openai/gpt-4o-mini' },
          { name: 'GPT-3.5 Turbo (OpenAI)', value: 'openai/gpt-3.5-turbo' },
          { name: 'GPT-4 (OpenAI)', value: 'openai/gpt-4' },
          { name: 'Claude 3 Haiku (Anthropic)', value: 'anthropic/claude-3-haiku-20240307' },
          { name: 'Claude 3.5 Sonnet (Anthropic)', value: 'anthropic/claude-3.5-sonnet' },
          { name: 'Llama 3.1 8B (Meta)', value: 'meta-llama/llama-3.1-8b-instruct:free' },
          { name: 'Llama 3.1 70B (Meta)', value: 'meta-llama/llama-3.1-70b-instruct' },
          { name: 'Gemini Pro (Google)', value: 'google/gemini-pro' },
          { name: 'Enter custom model', value: 'custom' }
        ],
        default: 'openai/gpt-4o-mini'
      }
    ]);

    if (modelChoice === 'custom') {
      const { customModel } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customModel',
          message: 'Enter custom model name (e.g., provider/model-name):',
          validate: (input: string) => input.trim() ? true : 'Model name is required'
        }
      ]);
      model = customModel;
    } else {
      model = modelChoice;
    }

  } else if (answers.aiProvider === 'ollama') {
    const { url, modelName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter Ollama API URL:',
        default: 'http://localhost:11434',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'modelName',
        message: 'Enter model name (e.g., llama2, codellama):',
        default: 'llama2',
        validate: (input: string) => input.trim() ? true : 'Model name is required'
      }
    ]);
    apiUrl = url;
    model = modelName;

  } else {
    const { url, key, modelName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter custom API endpoint URL:',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'key',
        message: 'Enter API key (optional):',
      },
      {
        type: 'input',
        name: 'modelName',
        message: 'Enter model name:',
        validate: (input: string) => input.trim() ? true : 'Model name is required'
      }
    ]);
    apiUrl = url;
    apiKey = key || undefined;
    model = modelName;
  }

  const { maxTokens, includeContext, autoCommit } = await inquirer.prompt([
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Maximum tokens for commit message:',
      default: 150,
      validate: (input: number) => input > 0 && input <= 1000 ? true : 'Please enter a number between 1 and 1000'
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
    commitStyle: answers.commitStyle,
    aiProvider: answers.aiProvider,
    apiKey,
    apiUrl,
    model,
    maxTokens,
    includeContext,
    autoCommit
  };

  await saveConfig(config);
  return config;
}

export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const currentConfig = await loadConfig() || DEFAULT_CONFIG;
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}
