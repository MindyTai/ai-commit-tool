import { BaseFormatter } from './BaseFormatter';
import { ConventionalType, TYPE_DETECTION_MAP, CONVENTIONAL_REGEX } from '../constants';

/**
 * Formats messages according to conventional commit standards
 */
export class ConventionalFormatter extends BaseFormatter {
  formatSubject(subject: string): string {
    subject = this.removeTrailingPeriod(subject);
    
    if (CONVENTIONAL_REGEX.test(subject)) {
      return subject;
    }

    return this.ensureConventionalFormat(subject);
  }

  createSummarySubject(longMessage: string): string {
    const detectedType = this.detectCommitType(longMessage);
    const cleanedMessage = this.removeTypeFromSubject(longMessage, detectedType);
    
    const summary = this.extractSummary(cleanedMessage);
    const formattedSummary = this.lowercaseFirst(summary);
    
    return `${detectedType}: ${formattedSummary}`;
  }

  protected processBodyLines(lines: string[]): string[] {
    return lines.map(line => {
      // Remove conventional commit prefixes from body content
      line = line.replace(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]*\))?\s*:\s*/i, '');
      
      // Convert various bullet formats to standard dash format
      line = line.replace(/^[•*+]\s*/, '- ');
      line = line.replace(/^\d+\.\s*/, '- ');
      
      // Ensure bullet points start with dash if they look like list items
      if (line.length > 0 && !line.startsWith('-') && !line.startsWith(' ') && 
          (line.includes('add') || line.includes('fix') || line.includes('update'))) {
        line = `- ${line}`;
      }
      
      return line;
    });
  }

  private ensureConventionalFormat(subject: string): string {
    const detectedType = this.detectCommitType(subject);
    const cleanedSubject = this.removeTypeFromSubject(subject, detectedType);
    const formattedSubject = this.lowercaseFirst(cleanedSubject || 'update code');

    return `${detectedType}: ${formattedSubject}`;
  }

  private detectCommitType(subject: string): ConventionalType {
    const lowerSubject = subject.toLowerCase();
    
    for (const [type, keywords] of Object.entries(TYPE_DETECTION_MAP)) {
      if (keywords.some(keyword => lowerSubject.includes(keyword))) {
        return type as ConventionalType;
      }
    }
    
    return 'feat'; // default fallback
  }

  private removeTypeFromSubject(subject: string, detectedType: string): string {
    // Remove conventional commit prefixes first (most specific)
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]*\))?\s*:\s*/i;
    let cleaned = subject.replace(conventionalRegex, '');
    
    // Then remove keyword patterns
    const keywords = TYPE_DETECTION_MAP[detectedType] || [];
    if (keywords.length > 0) {
      const keywordPattern = keywords.join('|');
      const regex = new RegExp(`^(${keywordPattern})\\s+`, 'i');
      cleaned = cleaned.replace(regex, '');
    }
    
    return cleaned;
  }

  private extractSummary(cleanedMessage: string): string {
    const words = cleanedMessage.toLowerCase().split(/\s+/);
    
    // Look for specific technical terms and context
    const technicalTerms = ['git', 'commit', 'body', 'subject', 'template', 'format', 'validation', 'config', 'api', 'service', 'utils'];
    const actionWords = ['add', 'remove', 'update', 'fix', 'improve', 'refactor', 'implement', 'create', 'delete', 'enhance'];
    
    // Find the main action
    const action = words.find(word => actionWords.includes(word)) || 'update';
    
    // Find specific context - prioritize technical terms
    const context = technicalTerms.find(term => words.includes(term)) ||
                   words.find(word => word.length > 4 && 
                             !['from', 'with', 'that', 'this', 'when', 'where', 'they', 'have', 'been'].includes(word)) ||
                   'functionality';
    
    // Create more specific summary based on detected patterns
    let summary = `${action} ${context}`;
    
    // Add more specificity if we can detect it
    if (words.includes('git') && words.includes('commit')) {
      summary = `${action} git commit ${words.includes('body') ? 'body' : words.includes('subject') ? 'subject' : 'handling'}`;
    } else if (words.includes('template') || words.includes('format')) {
      summary = `${action} ${context} ${words.includes('format') ? 'formatting' : 'template'}`;
    }
    
    return summary;
  }
}
