import { Config } from './config';

// Constants
const CONVENTIONAL_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 
  'test', 'chore', 'perf', 'ci', 'build'
] as const;

const SUBJECT_MAX_LENGTH = 72;

const CONVENTIONAL_REGEX = new RegExp(`^(${CONVENTIONAL_TYPES.join('|')})(\\(.+\\))?: .+`);

// Type detection map
const TYPE_DETECTION_MAP: Record<string, string[]> = {
  feat: ['add', 'implement', 'create', 'introduce'],
  fix: ['fix', 'resolve', 'correct', 'repair', 'patch'],
  docs: ['doc', 'readme', 'comment', 'documentation'],
  refactor: ['refactor', 'restructure', 'reorganize', 'rewrite'],
  test: ['test', 'spec', 'testing'],
  style: ['style', 'format', 'lint', 'prettier'],
  perf: ['performance', 'optimize', 'speed', 'faster'],
  build: ['build', 'compile', 'bundle', 'webpack'],
  ci: ['ci', 'pipeline', 'workflow', 'github', 'actions']
};

type ConventionalType = typeof CONVENTIONAL_TYPES[number];

export function formatCommitMessage(rawMessage: string, config: Config): string {
  const formatter = new CommitMessageFormatter(config);
  return formatter.format(rawMessage);
}

export function validateCommitMessage(message: string, config: Config): { valid: boolean; errors: string[] } {
  const formatter = new CommitMessageFormatter(config);
  return formatter.validate(message);
}

class CommitMessageFormatter {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  format(rawMessage: string): string {
    const sanitizedMessage = this.sanitizeInput(rawMessage);
    const lines = this.parseLines(sanitizedMessage);
    
    if (lines.length === 0) {
      throw new Error('Generated message is empty');
    }
    
    const firstLine = lines[0];
    const originalBody = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
    
    // If the first line is too long, treat it as body content and create a summary subject
    let subject: string;
    let bodyContent = originalBody;
    
    if (firstLine.length > SUBJECT_MAX_LENGTH) {
      subject = this.createSummarySubject(firstLine);
      // Move the full original line to body
      const bodyParts = [firstLine];
      if (originalBody) {
        bodyParts.push(originalBody);
      }
      bodyContent = bodyParts.join('\n\n');
    } else {
      subject = this.formatSubjectLine(firstLine);
    }
    
    const body = bodyContent ? this.formatBody(bodyContent) : '';

    return body ? `${subject}\n\n${body}` : subject;
  }

  validate(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = message.split('\n');
    const subject = lines[0] || '';

    // Check subject line length
    if (subject.length > SUBJECT_MAX_LENGTH) {
      errors.push(`Subject line exceeds ${SUBJECT_MAX_LENGTH} characters`);
    }

    if (subject.length === 0) {
      errors.push('Subject line is empty');
    }

    // Check conventional commits format if required
    if (this.config.commitStyle === 'conventional') {
      if (!CONVENTIONAL_REGEX.test(subject)) {
        errors.push('Subject line does not follow Conventional Commits format');
      }

      // Check for proper capitalization
      const match = subject.match(/^[^:]+: (.)/);
      if (match && match[1] !== match[1].toLowerCase()) {
        errors.push('Description should start with lowercase letter');
      }
    }

    // Check for trailing period
    if (subject.endsWith('.')) {
      errors.push('Subject line should not end with a period');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private sanitizeInput(message: string): string {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid input: message must be a non-empty string');
    }

    let sanitized = message.trim();
    
    // Remove markdown formatting that might have been added by AI
    sanitized = sanitized.replace(/```[\s\S]*?```/g, '');
    sanitized = sanitized.replace(/`([^`]+)`/g, '$1');
    sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, '$1');
    sanitized = sanitized.replace(/\*(.*?)\*/g, '$1');
    
    return sanitized;
  }

  private parseLines(message: string): string[] {
    return message
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private formatSubjectLine(subject: string): string {
    // Remove trailing periods
    subject = subject.replace(/\.$/, '');
    
    // Apply conventional format if needed
    if (this.config.commitStyle === 'conventional') {
      subject = this.ensureConventionalFormat(subject);
    }

    return subject;
  }

  private createSummarySubject(longMessage: string): string {
    // Create a specific, contextual summary from the long message
    const detectedType = this.detectCommitType(longMessage);
    
    // Remove any existing conventional prefixes first
    let cleanedMessage = this.removeTypeFromSubject(longMessage, detectedType);
    
    // Extract meaningful phrases and context
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
    
    const formattedSummary = this.formatSubjectDescription(summary);
    
    return this.config.commitStyle === 'conventional' 
      ? `${detectedType}: ${formattedSummary}`
      : formattedSummary;
  }

  private ensureConventionalFormat(subject: string): string {
    // Check if already in conventional format
    if (CONVENTIONAL_REGEX.test(subject)) {
      return subject;
    }

    const detectedType = this.detectCommitType(subject);
    const cleanedSubject = this.removeTypeFromSubject(subject, detectedType);
    const formattedSubject = this.formatSubjectDescription(cleanedSubject);

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

  private formatSubjectDescription(subject: string): string {
    if (!subject) return 'update code';
    
    // Ensure starts with lowercase
    return subject.charAt(0).toLowerCase() + subject.slice(1);
  }

  private formatBody(body: string): string {
    if (!body.trim()) return '';
    
    const lines = body.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Format bullet points consistently and remove any conventional commit prefixes
    const formattedLines = lines.map(line => {
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

    return formattedLines.join('\n');
  }
}

// Export the formatter class for external use if needed
export { CommitMessageFormatter };
