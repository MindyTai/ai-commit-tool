import ora from 'ora';
import { Config } from '../config';
import { getStagedChanges, commitChanges, checkGitRepository } from '../gitUtils';
import { generateCommitMessage } from '../ai';
import { formatCommitMessage, validateCommitMessage } from '../templates';
import { UserInterface } from './UserInterface';
import { CommitOptions, CommitResult } from './types';

export class CommitWorkflow {
  private ui: UserInterface;

  constructor() {
    this.ui = new UserInterface();
  }

  async execute(options: CommitOptions, config: Config): Promise<CommitResult> {
    try {
      // Validate git repository
      await this.validateGitRepository();

      // Get staged changes
      const stagedChanges = await this.getStagedChangesWithValidation();

      // Generate or use provided commit message
      let commitMessage = await this.getCommitMessage(options, stagedChanges, config);

      // Display the proposed commit message
      this.ui.displayCommitMessage(commitMessage);

      // Handle user confirmation
      if (this.shouldConfirm(options)) {
        const userAction = await this.ui.promptUserAction(commitMessage);
        if (userAction.action === 'cancel') {
          this.ui.showWarning('Commit cancelled.');
          return { success: false, message: 'Cancelled by user' };
        }
        if (userAction.message) {
          commitMessage = userAction.message;
        }
      }

      // Validate and commit
      await this.validateAndCommit(commitMessage, config);

      return { success: true, message: 'Commit created successfully!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  private async validateGitRepository(): Promise<void> {
    const isGitRepo = await checkGitRepository();
    if (!isGitRepo) {
      throw new Error('Not a git repository. Please run this command from within a git repository.');
    }
  }

  private async getStagedChangesWithValidation(): Promise<string> {
    const spinner = ora('Checking staged changes...').start();
    try {
      const stagedChanges = await getStagedChanges();
      
      if (!stagedChanges.trim()) {
        spinner.fail('No staged changes found. Please stage some files first.');
        throw new Error('No staged changes found');
      }
      
      spinner.succeed('Staged changes found');
      return stagedChanges;
    } catch (error) {
      spinner.fail('Failed to get staged changes');
      throw error;
    }
  }

  private async getCommitMessage(options: CommitOptions, stagedChanges: string, config: Config): Promise<string> {
    if (options.message) {
      return options.message;
    }

    const aiSpinner = ora('Generating commit message...').start();
    try {
      const rawMessage = await generateCommitMessage(stagedChanges, config);
      const commitMessage = formatCommitMessage(rawMessage, config);
      aiSpinner.succeed('Commit message generated');
      return commitMessage;
    } catch (error) {
      aiSpinner.fail('Failed to generate commit message');
      throw error;
    }
  }

  private shouldConfirm(options: CommitOptions): boolean {
    return options.confirm !== false;
  }

  private async validateAndCommit(commitMessage: string, config: Config): Promise<void> {
    // Validate commit message format
    const validation = validateCommitMessage(commitMessage, config);
    if (!validation.valid) {
      const shouldProceed = await this.ui.confirmValidationWarnings(validation.errors);
      if (!shouldProceed) {
        throw new Error('Commit cancelled due to validation warnings');
      }
    }

    // Commit the changes
    const commitSpinner = ora('Creating commit...').start();
    try {
      await commitChanges(commitMessage);
      commitSpinner.succeed('Commit created successfully!');
      this.ui.showSuccess('🎉 Your changes have been committed!');
    } catch (error) {
      commitSpinner.fail('Failed to create commit');
      throw error;
    }
  }
}
