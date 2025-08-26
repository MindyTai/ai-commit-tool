import { Config } from './config';

export function formatCommitMessage(rawMessage: string, config: Config): string {
  // Clean up the raw message
  let message = rawMessage.trim();
  
  // Remove any markdown formatting that might have been added by AI
  message = message.replace(/```[\s\S]*?```/g, '');
  message = message.replace(/`([^`]+)`/g, '$1');
  message = message.replace(/\*\*(.*?)\*\*/g, '$1');
  message = message.replace(/\*(.*?)\*/g, '$1');
  
  // Split into lines and process
  const lines = message.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('Generated message is empty');
  }

  let subject = lines[0];
  let body = lines.slice(1).join('\n').trim();

  // Format subject line
  subject = formatSubjectLine(subject, config);

  // Format body if present
  if (body) {
    body = formatBody(body);
  }

  return body ? `${subject}\n\n${body}` : subject;
}

function formatSubjectLine(subject: string, config: Config): string {
  // Remove any trailing periods
  subject = subject.replace(/\.$/, '');
  
  // Ensure it's not too long
  if (subject.length > 72) {
    subject = subject.substring(0, 69) + '...';
  }

  // For conventional commits, ensure proper format
  if (config.commitStyle === 'conventional') {
    subject = ensureConventionalFormat(subject);
  }

  return subject;
}

function ensureConventionalFormat(subject: string): string {
  const conventionalTypes = [
    'feat', 'fix', 'docs', 'style', 'refactor', 
    'test', 'chore', 'perf', 'ci', 'build'
  ];

  // Check if it already has a conventional format
  const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .+/;
  
  if (conventionalRegex.test(subject)) {
    return subject;
  }

  // Try to detect the type from the content
  const lowerSubject = subject.toLowerCase();
  let detectedType = 'chore'; // default

  if (lowerSubject.includes('add') || lowerSubject.includes('implement') || lowerSubject.includes('create')) {
    detectedType = 'feat';
  } else if (lowerSubject.includes('fix') || lowerSubject.includes('resolve') || lowerSubject.includes('correct')) {
    detectedType = 'fix';
  } else if (lowerSubject.includes('doc') || lowerSubject.includes('readme') || lowerSubject.includes('comment')) {
    detectedType = 'docs';
  } else if (lowerSubject.includes('refactor') || lowerSubject.includes('restructure') || lowerSubject.includes('reorganize')) {
    detectedType = 'refactor';
  } else if (lowerSubject.includes('test') || lowerSubject.includes('spec')) {
    detectedType = 'test';
  } else if (lowerSubject.includes('style') || lowerSubject.includes('format') || lowerSubject.includes('lint')) {
    detectedType = 'style';
  } else if (lowerSubject.includes('performance') || lowerSubject.includes('optimize') || lowerSubject.includes('speed')) {
    detectedType = 'perf';
  } else if (lowerSubject.includes('build') || lowerSubject.includes('compile') || lowerSubject.includes('bundle')) {
    detectedType = 'build';
  } else if (lowerSubject.includes('ci') || lowerSubject.includes('pipeline') || lowerSubject.includes('workflow')) {
    detectedType = 'ci';
  }

  // Remove the detected type word from the beginning if it exists
  const typeWord = detectedType === 'feat' ? 'add|implement|create' : detectedType;
  const regex = new RegExp(`^(${typeWord})\\s+`, 'i');
  subject = subject.replace(regex, '');

  // Ensure the subject starts with lowercase (conventional commits style)
  subject = subject.charAt(0).toLowerCase() + subject.slice(1);

  return `${detectedType}: ${subject}`;
}

function formatBody(body: string): string {
  const lines = body.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Format bullet points consistently
  const formattedLines = lines.map(line => {
    // Convert various bullet formats to standard dash format
    line = line.replace(/^[•*+]\s*/, '- ');
    line = line.replace(/^\d+\.\s*/, '- ');
    
    // Ensure bullet points start with dash
    if (line.length > 0 && !line.startsWith('-') && !line.startsWith(' ')) {
      line = `- ${line}`;
    }
    
    return line;
  });

  return formattedLines.join('\n');
}

export function validateCommitMessage(message: string, config: Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = message.split('\n');
  const subject = lines[0];

  // Check subject line length
  if (subject.length > 72) {
    errors.push('Subject line exceeds 72 characters');
  }

  if (subject.length === 0) {
    errors.push('Subject line is empty');
  }

  // Check conventional commits format if required
  if (config.commitStyle === 'conventional') {
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .+/;
    if (!conventionalRegex.test(subject)) {
      errors.push('Subject line does not follow Conventional Commits format');
    }
  }

  // Check for proper capitalization
  if (config.commitStyle === 'conventional') {
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

export function getCommitTemplates(style: 'conventional' | 'freeform') {
  if (style === 'conventional') {
    return {
      feat: 'feat: add new feature',
      fix: 'fix: resolve issue with',
      docs: 'docs: update documentation for',
      style: 'style: format code and fix linting issues',
      refactor: 'refactor: restructure code without changing functionality',
      test: 'test: add tests for',
      chore: 'chore: update dependencies and build configuration',
      perf: 'perf: optimize performance of',
      ci: 'ci: update build pipeline and workflows',
      build: 'build: update build system and dependencies'
    };
  } else {
    return {
      feature: 'Add new functionality to',
      bugfix: 'Fix issue where',
      improvement: 'Improve performance and usability of',
      documentation: 'Update documentation to explain',
      maintenance: 'Update dependencies and configuration',
      cleanup: 'Clean up code and remove unused'
    };
  }
}
