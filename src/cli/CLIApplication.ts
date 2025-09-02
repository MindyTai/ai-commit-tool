import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CommitCommand } from './commands/CommitCommand';
import { SetupCommand } from './commands/SetupCommand';

export class CLIApplication {
  private program: Command;
  private commitCommand: CommitCommand;
  private setupCommand: SetupCommand;

  constructor() {
    this.program = new Command();
    this.commitCommand = new CommitCommand();
    this.setupCommand = new SetupCommand();
    this.initialize();
  }

  private initialize(): void {
    // Get version from package.json
    const packageJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));

    this.program
      .name('ai-commit')
      .description('AI-powered git commit message generator')
      .version(packageJson.version);

    // Register commands
    this.commitCommand.register(this.program);
    this.setupCommand.register(this.program);
  }

  run(argv?: string[]): void {
    // Parse command line arguments
    this.program.parse(argv);

    // Show help if no command provided
    if (!argv && process.argv.length === 2) {
      this.program.help();
    }
  }
}
