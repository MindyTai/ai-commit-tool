import inquirer from 'inquirer';
import chalk from 'chalk';
import { UserAction } from './types';

export class UserInterface {
  private readonly separatorLength = 50;

  displayCommitMessage(commitMessage: string): void {
    console.log('\n' + chalk.cyan('📝 Proposed commit message:'));
    console.log(chalk.white('─'.repeat(this.separatorLength)));
    console.log(commitMessage);
    console.log(chalk.white('─'.repeat(this.separatorLength)));
  }

  async promptUserAction(commitMessage: string): Promise<UserAction> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '✅ Accept and commit', value: 'commit' },
          { name: '✏️ Edit message', value: 'edit' },
          { name: '❌ Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'edit') {
      const editedMessage = await this.editCommitMessage(commitMessage);
      return { action: 'commit', message: editedMessage };
    }

    return { action };
  }

  async editCommitMessage(defaultMessage: string): Promise<string> {
    const { editedMessage } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'editedMessage',
        message: 'Edit your commit message:',
        default: defaultMessage,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            return 'Commit message cannot be empty';
          }
          if (trimmed.length < 3) {
            return 'Commit message must be at least 3 characters long';
          }
          return true;
        }
      }
    ]);
    return editedMessage.trim();
  }

  async confirmValidationWarnings(errors: string[]): Promise<boolean> {
    console.log(chalk.yellow('⚠️ Commit message validation warnings:'));
    errors.forEach(error => {
      console.log(chalk.yellow(`  • ${error}`));
    });
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue with commit despite validation warnings?',
        default: true
      }
    ]);
    
    return proceed;
  }

  showSuccess(message: string): void {
    console.log(chalk.green(message));
  }

  showError(message: string): void {
    console.error(chalk.red(message));
  }

  showWarning(message: string): void {
    console.log(chalk.yellow(message));
  }

  showInfo(message: string): void {
    console.log(chalk.cyan(message));
  }
}
