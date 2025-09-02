export interface CommitOptions {
  message?: string;
  confirm?: boolean;
}

export interface CommitResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UserAction {
  action: 'commit' | 'edit' | 'cancel';
  message?: string;
}
