import { Config } from '../../config';
import { SUBJECT_MAX_LENGTH } from '../constants';

/**
 * Base formatter with common formatting logic
 */
export abstract class BaseFormatter {
  protected config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  abstract formatSubject(subject: string): string;
  abstract createSummarySubject(longMessage: string): string;

  /**
   * Formats the complete commit message
   */
  format(subject: string, body?: string): string {
    const formattedSubject = subject.length > SUBJECT_MAX_LENGTH 
      ? this.createSummarySubject(subject)
      : this.formatSubject(subject);

    const formattedBody = body ? this.formatBody(body) : '';

    return formattedBody ? `${formattedSubject}\n\n${formattedBody}` : formattedSubject;
  }

  protected formatBody(body: string): string {
    if (!body.trim()) return '';
    
    const lines = body.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return this.processBodyLines(lines).join('\n');
  }

  protected abstract processBodyLines(lines: string[]): string[];

  protected removeTrailingPeriod(text: string): string {
    return text.replace(/\.$/, '');
  }

  protected capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  protected lowercaseFirst(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
}
