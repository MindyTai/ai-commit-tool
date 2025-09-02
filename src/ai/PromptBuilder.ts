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
      return `You write git commit messages by analyzing the diff. Look at what files were deleted and what files were added.

CRITICAL: NEVER use these generic words in the title: "update", "change", "modify", "improve", "implement"

TITLE RULES:
- If you see a file deleted and multiple new files added → "Refactor [component] into [new structure]"
- If you see new classes/modules added → "Add [specific feature/component]"
- If you see files moved/renamed → "Restructure [component] organization"
- If you see bug fixes → "Fix [specific issue]"
- Use imperative tense and be specific about WHAT changed

BODY RULES:
- List the key files that were deleted/added/modified
- Explain the architectural change or new functionality
- Keep it factual and specific

EXAMPLES:
- "Refactor template system into modular architecture" (when templates.ts → multiple template files)
- "Add OAuth authentication with Google provider" (when auth files are added)
- "Extract database queries into repository pattern" (when moving DB code)`;
    }

    return `You are a helpful assistant that writes git commit messages.
- Always write in imperative tense.
- Be specific and descriptive about what changed.
- Use conventional commit style with these prefixes:
  * feat: new features or functionality
  * fix: bug fixes
  * refactor: code restructuring without changing functionality (renaming, reorganizing, improving structure)
  * chore: maintenance tasks, dependencies, build changes
  * docs: documentation changes
  * test: adding or modifying tests
  * style: formatting, whitespace, code style changes
- Avoid generic words like "update", "change", "modify" - be specific about what was updated.
- Pay special attention to refactoring: if code is being reorganized, renamed, or restructured without adding new features, use "refactor" prefix.
- Example: "feat: add user authentication system" or "refactor: restructure template system into modular architecture"`;
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
diff --git a/templates.ts b/templates.ts
index 1234567..0000000 100644
--- a/templates.ts
+++ /dev/null
@@ -1,100 +0,0 @@
-// Large monolithic template file
-export function formatMessage() { }
-export function validateMessage() { }
+++ b/src/templates/CommitMessageProcessor.ts
@@ -0,0 +1,20 @@
+export class CommitMessageProcessor {
+  format() { }
+}
+++ b/src/templates/formatters/ConventionalFormatter.ts
+++ b/src/templates/validators/BaseValidator.ts

Output: Refactor template system into modular architecture

Deleted monolithic src/templates.ts and created specialized classes:
- CommitMessageProcessor.ts for orchestrating message processing
- MessageSanitizer.ts for cleaning AI responses
- Formatters (BaseFormatter, ConventionalFormatter, FreeformFormatter)
- Validators (BaseValidator, ConventionalValidator, FreeformValidator)
- Factory classes for creating appropriate formatters and validators

This modular approach improves maintainability and follows single
responsibility principle with dedicated classes for each concern.

Generate a commit message with a descriptive title summarizing the main change and a body describing the specific files changed.

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
