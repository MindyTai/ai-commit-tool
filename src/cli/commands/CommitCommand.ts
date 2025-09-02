import { Command } from 'commander';
import { loadConfig, setupConfig } from '../../config';
import { CommitWorkflow } from '../CommitWorkflow';
import { CommitOptions } from '../types';

export class CommitCommand {
  private workflow: CommitWorkflow;

  constructor() {
    this.workflow = new CommitWorkflow();
  }

  register(program: Command): void {
    program
      .command('commit')
      .alias('c')
      .description('Generate and create a commit message for staged changes')
      .option('-m, --message <message>', 'Use a custom message instead of AI generation')
      .option('--no-confirm', 'Skip confirmation prompt (use with caution)')
      .action(async (options: CommitOptions) => {
        try {
          await this.execute(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async execute(options: CommitOptions): Promise<void> {
    // Load configuration
    const config = await this.loadOrSetupConfig();

    // Execute commit workflow
    const result = await this.workflow.execute(options, config);

    if (!result.success) {
      if (result.error) {
        throw new Error(result.error);
      }
      // Graceful exit for user cancellation
      process.exit(0);
    }
  }

  private async loadOrSetupConfig() {
    let config = await loadConfig();
    if (!config) {
      console.log('⚙️ First time setup required...');
      config = await setupConfig();
    }
    return config;
  }

  private handleError(error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in commit: ${errorMessage}`);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}
