#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, setupConfig } from './config';
import { getStagedChanges, commitChanges } from './gitUtils';
import { generateCommitMessage } from './aiService';
import { formatCommitMessage } from './templates';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('ai-commit')
  .description('AI-powered git commit message generator')
  .version('1.0.0');

program
  .command('commit')
  .alias('c')
  .description('Generate and create a commit message for staged changes')
  .option('-m, --message <message>', 'Use a custom message instead of AI generation')
  .option('--no-confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      await runCommit(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
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
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

async function runCommit(options: { message?: string; confirm?: boolean }) {
  // Load configuration
  let config = await loadConfig();
  if (!config) {
    console.log(chalk.yellow('⚙️ First time setup required...'));
    config = await setupConfig();
  }

  // Get staged changes
  const spinner = ora('Checking staged changes...').start();
  const stagedChanges = await getStagedChanges();
  
  if (!stagedChanges.trim()) {
    spinner.fail('No staged changes found. Please stage some files first.');
    return;
  }
  
  spinner.succeed('Staged changes found');

  let commitMessage: string;

  if (options.message) {
    // Use provided message
    commitMessage = options.message;
  } else {
    // Generate AI commit message
    const aiSpinner = ora('Generating commit message...').start();
    try {
      const rawMessage = await generateCommitMessage(stagedChanges, config);
      commitMessage = formatCommitMessage(rawMessage, config);
      aiSpinner.succeed('Commit message generated');
    } catch (error) {
      aiSpinner.fail('Failed to generate commit message');
      throw error;
    }
  }

  // Display the proposed commit message
  console.log('\n' + chalk.cyan('📝 Proposed commit message:'));
  console.log(chalk.white('─'.repeat(50)));
  console.log(commitMessage);
  console.log(chalk.white('─'.repeat(50)));

  // Confirm with user (unless --no-confirm)
  if (options.confirm !== false) {
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

    if (action === 'cancel') {
      console.log(chalk.yellow('Commit cancelled.'));
      return;
    }

    if (action === 'edit') {
      const { editedMessage } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'editedMessage',
          message: 'Edit your commit message:',
          default: commitMessage
        }
      ]);
      commitMessage = editedMessage;
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

// Default to commit command if no command specified
if (process.argv.length === 2) {
  process.argv.push('commit');
}

program.parse();
