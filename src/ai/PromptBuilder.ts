import { Config } from '../config';
import { getStagedFiles, getRepoInfo } from '../gitUtils';
import { PromptContext } from './types';

export class PromptBuilder {
  async buildPrompt(stagedChanges: string, config: Config): Promise<string> {
    const context: PromptContext = {
      stagedChanges,
      config
    };

    if (config.includeContext) {
      try {
        context.repoInfo = await getRepoInfo();
      } catch {
        // Ignore repo info errors, continue without context
      }
    }

    const fewShotExamples = this.getFewShotExamples(config.commitStyle);
    return `${fewShotExamples}\n${stagedChanges}`;
  }

  getSystemPrompt(commitStyle: 'conventional' | 'freeform'): string {
    if (commitStyle === 'freeform') {
      return `You are a helpful assistant that writes git commit messages.
- Write in imperative tense (e.g., "add feature" not "added feature").
- Be concise but descriptive.
- Use natural language without prefixes.
- Focus on what the change does and why it's important.
- Keep the subject line under 72 characters.
- Example: "Add user authentication system" or "Fix memory leak in data processing"`;
    }

    return `You are a helpful assistant that writes git commit messages.
- Always write in imperative tense.
- Be concise (max 1 line).
- Use conventional commit style with these prefixes:
  * feat: new features or functionality
  * fix: bug fixes
  * refactor: code restructuring without changing functionality (renaming, reorganizing, improving structure)
  * chore: maintenance tasks, dependencies, build changes
  * docs: documentation changes
  * test: adding or modifying tests
  * style: formatting, whitespace, code style changes
- Pay special attention to refactoring: if code is being reorganized, renamed, or restructured without adding new features, use "refactor" prefix.`;
  }

  private getFewShotExamples(commitStyle: 'conventional' | 'freeform' = 'conventional'): string {
    if (commitStyle === 'freeform') {
      return `Example:
diff --git a/user.py b/user.py
index 1234567..abcdefg 100644
--- a/user.py
+++ b/user.py
@@ -10,6 +10,9 @@ class User:
     def __init__(self, name):
         self.name = name

+    def get_username(self):
+        return self.name
+
Output: Add get_username method to User class

Provides a clean interface for accessing the user's name
property without direct attribute access.

Example:
diff --git a/auth.py b/auth.py
index 2345678..bcdefgh 100644
--- a/auth.py
+++ b/auth.py
@@ -15,7 +15,10 @@ def authenticate(token):
     if not token:
-        return False
+        raise ValueError("Token is required")
     
     return verify_token(token)

Output: Handle missing authentication token with explicit error

Replace silent failure with ValueError when token is missing.
Previously returned False for missing tokens, which could be
confused with invalid tokens. Now raises clear error message
to help with debugging authentication issues.

Generate a natural language commit message describing what the change does and why it's important.

Now your turn:`;
    }

    return `Example:
diff --git a/user.py b/user.py
index 1234567..abcdefg 100644
--- a/user.py
+++ b/user.py
@@ -10,6 +10,9 @@ class User:
     def __init__(self, name):
         self.name = name

+    def get_username(self):
+        return self.name
+
Output: feat(user): add get_username method

Add new method to retrieve the username from User class.
This provides a clean interface for accessing the user's name
property without direct attribute access.

Example:
diff --git a/auth.py b/auth.py
index 2345678..bcdefgh 100644
--- a/auth.py
+++ b/auth.py
@@ -15,7 +15,10 @@ def authenticate(token):
     if not token:
-        return False
+        raise ValueError("Token is required")
     
     return verify_token(token)

Output: fix(auth): handle missing token

Replace silent failure with explicit error when token is missing.
Previously the function returned False for missing tokens, which
could be confused with invalid tokens. Now raises ValueError with
clear message to help with debugging authentication issues.

Example:
diff --git a/config.py b/config.py
index 3456789..cdefghi 100644
--- a/config.py
+++ b/config.py
@@ -20,8 +20,8 @@ class ConfigManager:
-    def setup_provider(self):
+    def setup_ai_provider(self):
         # Setup logic here
         pass
     
-    def get_config(self):
+    def get_provider_config(self):
         return self.config

Output: refactor(config): rename methods for clarity

rename setup_provider to setup_ai_provider and get_config to
get_provider_config to better reflect their specific purposes.
This improves code readability and makes the API more explicit.

Generate a commit message with a concise subject line and detailed body describing:
- What specific changes were made
- Why the changes were necessary
- Any important implementation details or considerations
- Use "refactor" prefix when code is being reorganized, renamed, or restructured without adding new functionality

Now your turn:`;
  }
}
