import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export async function checkGitRepository(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

export async function getStagedChanges(): Promise<string> {
  try {
    // Check if we're in a git repository
    const isGitRepo = await checkGitRepository();
    if (!isGitRepo) {
      throw new Error('Not a git repository. Please run this command from within a git repository.');
    }

    // Get staged changes
    const { stdout } = await execAsync('git diff --staged');
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get staged changes: ${error.message}`);
    }
    throw new Error('Failed to get staged changes: Unknown error');
  }
}

export async function getStagedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git diff --staged --name-only');
    return stdout.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get staged files: ${error.message}`);
    }
    throw new Error('Failed to get staged files: Unknown error');
  }
}

export async function getGitStatus(): Promise<GitStatus> {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);
    
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    lines.forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      }
      if (status[1] !== ' ' && status[1] !== '?') {
        unstaged.push(file);
      }
      if (status === '??') {
        untracked.push(file);
      }
    });

    return { staged, unstaged, untracked };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get git status: ${error.message}`);
    }
    throw new Error('Failed to get git status: Unknown error');
  }
}

export async function commitChanges(message: string): Promise<void> {
  try {
    // Escape the commit message to handle special characters
    const escapedMessage = message.replace(/"/g, '\\"');
    await execAsync(`git commit -m "${escapedMessage}"`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
    throw new Error('Failed to commit changes: Unknown error');
  }
}

export async function getLastCommitMessage(): Promise<string> {
  try {
    const { stdout } = await execAsync('git log -1 --pretty=%B');
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get last commit message: ${error.message}`);
    }
    throw new Error('Failed to get last commit message: Unknown error');
  }
}

export async function getBranchName(): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current');
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get branch name: ${error.message}`);
    }
    throw new Error('Failed to get branch name: Unknown error');
  }
}

export async function getRepoInfo(): Promise<{ name: string; branch: string }> {
  try {
    const [repoUrl, branch] = await Promise.all([
      execAsync('git config --get remote.origin.url'),
      getBranchName()
    ]);
    
    // Extract repo name from URL
    const urlMatch = repoUrl.stdout.match(/\/([^\/]+)\.git$/);
    const name = urlMatch ? urlMatch[1] : 'unknown';
    
    return { name, branch };
  } catch (error) {
    return { name: 'unknown', branch: 'main' };
  }
}
