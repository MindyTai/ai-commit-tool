import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Config } from './types';

export class ConfigManager {
  private readonly configFile: string;
  private readonly defaultConfig: Config;

  constructor() {
    this.configFile = path.join(os.homedir(), '.ai-commit.json');
    this.defaultConfig = {
      commitStyle: 'conventional',
      aiProvider: 'openrouter',
      model: 'openai/gpt-4o-mini',
      maxTokens: 150,
      includeContext: true,
      autoCommit: false
    };
  }

  async load(): Promise<Config | null> {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      const config = JSON.parse(data);
      return this.mergeWithDefaults(config);
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        return null; // Config doesn't exist yet
      }
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(config: Config): Promise<void> {
    try {
      const configData = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configFile, configData, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.configFile);
      return true;
    } catch {
      return false;
    }
  }

  getDefaultConfig(): Config {
    return { ...this.defaultConfig };
  }

  private mergeWithDefaults(config: Partial<Config>): Config {
    return {
      ...this.defaultConfig,
      ...config
    };
  }

  private isFileNotFoundError(error: unknown): boolean {
    return error instanceof Error && 
           ('code' in error && (error as any).code === 'ENOENT');
  }
}
