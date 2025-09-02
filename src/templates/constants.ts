// Conventional commit constants and types
export const CONVENTIONAL_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 
  'test', 'chore', 'perf', 'ci', 'build'
] as const;

export const SUBJECT_MAX_LENGTH = 72;

export const CONVENTIONAL_REGEX = new RegExp(`^(${CONVENTIONAL_TYPES.join('|')})(\\(.+\\))?: .+`);

// Type detection mapping for commit type inference
export const TYPE_DETECTION_MAP: Record<string, string[]> = {
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

export type ConventionalType = typeof CONVENTIONAL_TYPES[number];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
