import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

// Constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const GIT_COMMANDS = {
  CHECK_REPO: 'git rev-parse --git-dir',
  STAGED_DIFF: 'git diff --staged',
  STAGED_FILES: 'git diff --staged --name-only',
  STATUS: 'git status --porcelain',
  LAST_COMMIT: 'git log -1 --pretty=%B',
  BRANCH_NAME: 'git branch --show-current',
  REMOTE_URL: 'git config --get remote.origin.url'
} as const;

// Git status codes mapping
const GIT_STATUS_CODES = {
  STAGED: /^[MADRC]/,
  UNSTAGED: /^.[MADRC]/,
  UNTRACKED: '??',
  RENAMED: /^R/,
  COPIED: /^C/
} as const;

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export async function checkGitRepository(): Promise<boolean> {
  try {
    await executeGitCommand(GIT_COMMANDS.CHECK_REPO);
    return true;
  } catch {
    return false;
  }
}

export async function getStagedChanges(): Promise<string> {
  try {
    const { stdout } = await executeGitCommand(GIT_COMMANDS.STAGED_DIFF);
    return stdout.trim();
  } catch (error) {
    throw createGitError('get staged changes', error);
  }
}

export async function getStagedFiles(): Promise<string[]> {
  try {
    const { stdout } = await executeGitCommand(GIT_COMMANDS.STAGED_FILES);
    return parseFileList(stdout);
  } catch (error) {
    throw createGitError('get staged files', error);
  }
}

export async function getGitStatus(): Promise<GitStatus> {
  try {
    const { stdout } = await executeGitCommand(GIT_COMMANDS.STATUS);
    return parseGitStatus(stdout);
  } catch (error) {
    throw createGitError('get git status', error);
  }
}

export async function commitChanges(message: string): Promise<void> {
  if (!message || !message.trim()) {
    throw new Error('Commit message cannot be empty');
  }

  // Create temporary file for commit message to avoid shell escaping issues
  const tempFile = join(tmpdir(), `commit-msg-${Date.now()}.txt`);
  
  try {
    writeFileSync(tempFile, message, 'utf-8');
    const { stdout, stderr } = await executeGitCommand(`git commit -F "${tempFile}"`);
    
    // Check if commit was successful
    if (stderr && stderr.includes('nothing to commit')) {
      throw new Error('No staged changes to commit');
    }
  } catch (error) {
    throw createGitError('commit changes', error);
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function getLastCommitMessage(): Promise<string> {
  try {
    const { stdout } = await executeGitCommand(GIT_COMMANDS.LAST_COMMIT);
    return stdout.trim();
  } catch (error) {
    throw createGitError('get last commit message', error);
  }
}

export async function getBranchName(): Promise<string> {
  try {
    const { stdout } = await executeGitCommand(GIT_COMMANDS.BRANCH_NAME);
    const branch = stdout.trim();
    return branch || 'HEAD'; // Fallback for detached HEAD
  } catch (error) {
    throw createGitError('get branch name', error);
  }
}

export async function getRepoInfo(): Promise<{ name: string; branch: string }> {
  try {
    const [repoUrl, branch] = await Promise.all([
      executeGitCommand(GIT_COMMANDS.REMOTE_URL),
      getBranchName()
    ]);
    
    const name = extractRepoName(repoUrl.stdout.trim());
    return { name, branch };
  } catch (error) {
    // Graceful fallback for repos without remote or other issues
    try {
      const branch = await getBranchName();
      return { name: 'local-repo', branch };
    } catch {
      return { name: 'unknown', branch: 'main' };
    }
  }
}

// Helper functions
async function executeGitCommand(command: string, options: any = {}): Promise<{ stdout: string; stderr: string }> {
  const defaultOptions = {
    timeout: DEFAULT_TIMEOUT,
    maxBuffer: 1024 * 1024, // 1MB buffer
    encoding: 'utf8' as const,
    ...options
  };
  
  const result = await execAsync(command, defaultOptions);
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString()
  };
}

function createGitError(operation: string, error: unknown): Error {
  if (error instanceof Error) {
    // Extract meaningful git error messages
    const message = error.message.toLowerCase();
    if (message.includes('not a git repository')) {
      return new Error('Not a git repository. Please run this command from within a git repository.');
    }
    if (message.includes('no such file or directory')) {
      return new Error('Git command not found. Please ensure Git is installed and in your PATH.');
    }
    return new Error(`Failed to ${operation}: ${error.message}`);
  }
  return new Error(`Failed to ${operation}: Unknown error`);
}

function parseFileList(stdout: string): string[] {
  if (!stdout.trim()) {
    return [];
  }
  return stdout.trim().split('\n').filter(line => line.length > 0);
}

function parseGitStatus(stdout: string): GitStatus {
  const lines = stdout.trim().split('\n').filter(line => line.length > 0);
  
  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];

  lines.forEach(line => {
    if (line.length < 3) return; // Invalid status line
    
    const statusCode = line.substring(0, 2);
    const filePath = line.substring(3);

    // Handle staged changes (first character)
    if (GIT_STATUS_CODES.STAGED.test(statusCode)) {
      staged.push(filePath);
    }
    
    // Handle unstaged changes (second character)
    if (GIT_STATUS_CODES.UNSTAGED.test(statusCode)) {
      unstaged.push(filePath);
    }
    
    // Handle untracked files
    if (statusCode === GIT_STATUS_CODES.UNTRACKED) {
      untracked.push(filePath);
    }
    
    // Handle renames and copies (special cases)
    if (GIT_STATUS_CODES.RENAMED.test(statusCode) || GIT_STATUS_CODES.COPIED.test(statusCode)) {
      // For renames/copies, the file path might contain ' -> '
      const [oldPath, newPath] = filePath.split(' -> ');
      if (newPath) {
        staged.push(newPath);
      } else {
        staged.push(oldPath);
      }
    }
  });

  return { staged, unstaged, untracked };
}

function extractRepoName(url: string): string {
  if (!url) return 'unknown';
  
  // Handle different URL formats
  const patterns = [
    /\/([^\/]+)\.git$/, // https://github.com/user/repo.git
    /\/([^\/]+)$/, // https://github.com/user/repo
    /:([^\/]+)\.git$/, // git@github.com:user/repo.git
    /:([^\/]+)$/ // git@github.com:user/repo
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return 'unknown';
}
