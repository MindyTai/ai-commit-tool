import { Config } from '../config';
import { getRepoInfo } from '../gitUtils';
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
- Be SPECIFIC and descriptive - avoid generic words like "update", "change", "modify", "configuration".
- Git summary max 1 line and body max 3 lines
- Use natural language without prefixes.
- Focus on EXACTLY what functionality/component was modified and WHY.
- Describe the complete scope and purpose of changes.
- Keep the subject line under 50 characters but be descriptive.
- Examples: 
  * "Add Dependabot for automated security updates and dependency management"
  * "Implement OAuth authentication with Google and GitHub providers"
  * "Fix memory leak in image processing pipeline"`;
    }

    return `You are a helpful assistant that writes git commit messages.
- Always write in imperative tense.
- Be SPECIFIC and descriptive - avoid generic words like "update", "change", "modify", "configuration".
- Focus on EXACTLY what functionality/component was modified, not vague descriptions.
- Describe the complete scope and purpose of changes.
- Git summary max 1 line and body max 3 lines
- Use conventional commit style with these prefixes:
  * feat: new features, functionality, or ANY new files
  * fix: bug fixes
  * refactor: code restructuring without changing functionality (renaming, reorganizing, improving structure)
  * build: infrastructure-related changes (build system, CI/CD, deployment configs, tooling setup)
  * chore: technical maintenance tasks on existing files (dependency updates, version bumps, existing config modifications)
  * docs: documentation changes
  * test: adding or modifying tests
  * style: formatting, whitespace, code style changes
- Examples of GOOD commits:
  * "feat(auth): add OAuth integration with Google and GitHub providers"
  * "build(ci): add GitHub Actions workflow for automated testing"
  * "chore(deps): update dependencies to latest versions"
  * "refactor(template): restructure message formatting into modular architecture"
- Examples of BAD commits to avoid:
  * "feat: update configuration" (too vague)
  * "chore: change settings" (not specific)
  * "refactor: modify code" (doesn't explain what was refactored)`;
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

- Replace silent failure with ValueError when token is missing.
- Previously returned False for missing tokens, which could be
confused with invalid tokens. Now raises clear error message
to help with debugging authentication issues.

Generate a commit message with a concise but SPECIFIC subject line and detailed body describing:
- EXACTLY what functionality/component was added, modified, or restructured
- The complete scope and purpose of changes (show the whole picture)
- Why the changes were necessary
- Any important implementation details or considerations
- Be specific about file types, systems, or features involved
- Avoid generic words like "update", "change", "modify", "configuration"
- IMPORTANT: Use "feat:" prefix for ANY new files
- Use "chore:" only for modifications to existing files (dependency updates, version bumps)

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
Output: feat(user): add get_username method for clean property access

- Add new method to retrieve the username from User class.
- This provides a clean interface for accessing the user's name
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

Output: fix(auth): replace silent failure with explicit error for missing tokens

- Replace silent failure with explicit error when token is missing.
- Previously the function returned False for missing tokens, which
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

Output: refactor(config): rename methods for clarity and explicit purpose

- Rename setup_provider to setup_ai_provider and get_config to
get_provider_config to better reflect their specific purposes.
- This improves code readability and makes the API more explicit.

Generate a commit message with a concise but SPECIFIC subject line and detailed body describing:
- EXACTLY what functionality/component was added, modified, or restructured
- The complete scope and purpose of changes (show the whole picture)
- Why the changes were necessary
- Any important implementation details or considerations
- Be specific about file types, systems, or features involved
- Avoid generic words like "update", "change", "modify", "configuration"
- IMPORTANT: Use "feat:" prefix for ANY new files
- Use "chore:" only for modifications to existing files (dependency updates, version bumps)

Now your turn:`;
  }
}
