import { Config } from '../config/types';
import { CommitMessageProcessor } from './CommitMessageProcessor';
import { ValidationResult } from './constants';

/**
 * Formats a commit message according to the specified configuration
 */
export function formatCommitMessage(rawMessage: string, config: Config): string {
  const processor = new CommitMessageProcessor(config);
  return processor.format(rawMessage);
}

/**
 * Validates a commit message according to the specified configuration
 */
export function validateCommitMessage(message: string, config: Config): ValidationResult {
  const processor = new CommitMessageProcessor(config);
  return processor.validate(message);
}

// Re-export other useful types and classes
export { CommitMessageProcessor } from './CommitMessageProcessor';
export { ValidationResult } from './constants';
