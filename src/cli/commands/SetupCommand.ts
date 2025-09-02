import { Command } from 'commander';
import chalk from 'chalk';
import { setupConfig } from '../../config/index';

export class SetupCommand {
  register(program: Command): void {
    program
      .command('setup')
      .description('Configure AI commit settings')
      .action(async () => {
        try {
          await this.execute();
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async execute(): Promise<void> {
    await setupConfig();
    console.log(chalk.green('✅ Configuration saved successfully!'));
  }

  private handleError(error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red(`Error in setup: ${errorMessage}`));
    
    if (error instanceof Error && error.stack) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    
    process.exit(1);
  }
}
