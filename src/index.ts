#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, setupConfig } from './config';
import { getStagedChanges, commitChanges, checkGitRepository } from './gitUtils';
import { generateCommitMessage } from './aiService';
import { formatCommitMessage, validateCommitMessage } from './templates';
import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

// Constants
const SEPARATOR_LENGTH = 50;

const program = new Command();

program
  .name('ai-commit')
  .description('AI-powered git commit message generator')
  .version(packageJson.version);

program
  .command('commit')
  .alias('c')
  .description('Generate and create a commit message for staged changes')
  .option('-m, --message <message>', 'Use a custom message instead of AI generation')
  .option('--no-confirm', 'Skip confirmation prompt (use with caution)')
  .action(async (options) => {
    try {
      await runCommit(options);
    } catch (error) {
      handleError(error, 'commit');
    }
  });

program
  .command('setup')
  .description('Configure AI commit settings')
  .action(async () => {
    try {
      await setupConfig();
      console.log(chalk.green('✅ Configuration saved successfully!'));
    } catch (error) {
      handleError(error, 'setup');
    }
  });

async function runCommit(options: { message?: string; confirm?: boolean }) {
  // Validate git repository
  await validateGitRepository();

  // Load configuration
  const config = await loadOrSetupConfig();

  // Get staged changes
  const stagedChanges = await getStagedChangesWithValidation();

  // Generate or use provided commit message
  let commitMessage = await getCommitMessage(options, stagedChanges, config);

  // Display the proposed commit message
  displayCommitMessage(commitMessage);

  // Handle user confirmation
  if (shouldConfirm(options)) {
    const confirmedMessage = await handleUserConfirmation(commitMessage);
    if (!confirmedMessage) return; // User cancelled
    commitMessage = confirmedMessage;
  }

  // Validate and commit
  await validateAndCommit(commitMessage, config);
}

async function validateGitRepository(): Promise<void> {
  const isGitRepo = await checkGitRepository();
  if (!isGitRepo) {
    throw new Error('Not a git repository. Please run this command from within a git repository.');
  }
}

async function loadOrSetupConfig() {
  let config = await loadConfig();
  if (!config) {
    console.log(chalk.yellow('⚙️ First time setup required...'));
    config = await setupConfig();
  }
  return config;
}

async function getStagedChangesWithValidation(): Promise<string> {
  const spinner = ora('Checking staged changes...').start();
  try {
    const stagedChanges = await getStagedChanges();
    
    if (!stagedChanges.trim()) {
      spinner.fail('No staged changes found. Please stage some files first.');
      process.exit(1);
    }
    
    spinner.succeed('Staged changes found');
    return stagedChanges;
  } catch (error) {
    spinner.fail('Failed to get staged changes');
    throw error;
  }
}

async function getCommitMessage(options: { message?: string }, stagedChanges: string, config: any): Promise<string> {
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

function displayCommitMessage(commitMessage: string): void {
  console.log('\n' + chalk.cyan('📝 Proposed commit message:'));
  console.log(chalk.white('─'.repeat(SEPARATOR_LENGTH)));
  console.log(commitMessage);
  console.log(chalk.white('─'.repeat(SEPARATOR_LENGTH)));
}

function shouldConfirm(options: { confirm?: boolean }): boolean {
  return options.confirm !== false;
}

async function handleUserConfirmation(commitMessage: string): Promise<string | null> {
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

  switch (action) {
    case 'cancel':
      console.log(chalk.yellow('Commit cancelled.'));
      return null;
    
    case 'edit':
      return await editCommitMessage(commitMessage);
    
    default:
      return commitMessage;
  }
}

async function editCommitMessage(defaultMessage: string): Promise<string> {
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

async function validateAndCommit(commitMessage: string, config: any): Promise<void> {
  // Validate commit message format
  const validation = validateCommitMessage(commitMessage, config);
  if (!validation.valid) {
    console.log(chalk.yellow('⚠️ Commit message validation warnings:'));
    validation.errors.forEach(error => {
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
    
    if (!proceed) {
      console.log(chalk.yellow('Commit cancelled.'));
      return;
    }
  }

  // Commit the changes
  const commitSpinner = ora('Creating commit...').start();
  try {
    await commitChanges(commitMessage);
    commitSpinner.succeed('Commit created successfully!');
    console.log(chalk.green('🎉 Your changes have been committed!'));
  } catch (error) {
    commitSpinner.fail('Failed to create commit');
    throw error;
  }
}

function handleError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(chalk.red(`Error in ${context}:`), errorMessage);
  
  if (error instanceof Error && error.stack) {
    console.error(chalk.gray('Stack trace:'), error.stack);
  }
  
  process.exit(1);
}

// Parse command line arguments
program.parse();

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}
