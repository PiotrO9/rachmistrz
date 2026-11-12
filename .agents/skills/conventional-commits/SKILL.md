---
name: conventional-commits
description: Write and review English Git commit messages using Conventional Commits. Use when preparing, proposing, or creating a commit, including a squash commit message.
---

# Conventional Commits in English

Write commit subjects, optional bodies, and explanatory footers in English. Preserve code identifiers and issue references as written.

Use this structure:

```text
type(scope): short description

Optional body explaining the reason and relevant consequences.

Optional footers.
```

- Use a lowercase type. Choose `feat` for new functionality, `fix` for a bug fix, `docs` for documentation, `refactor` for restructuring without changing behavior, `test` for tests, `perf` for performance, `build` for build tooling or dependencies, `ci` for CI configuration, `style` for formatting-only changes, and `chore` for other maintenance. A visual feature or UI bug is not a `style` commit merely because it changes CSS.
- Scope is optional. When useful, use a short lowercase area such as `training`, `settings`, `persistence`, or `pwa`. Do not invent a scope just to fill the template.
- Write a concise subject in the imperative: `add`, `fix`, `remove`, `preserve`. Do not end it with a period. Prefer about 72 characters or fewer, without sacrificing clarity. This length and imperative wording are local preferences, not requirements of the Conventional Commits specification.
- Describe the actual change. Avoid vague subjects such as `update files`, `changes`, or `fix stuff`.
- Use a body only when the reason, behavior, or tradeoff needs explanation. Separate it from the subject with a blank line.
- For a genuinely incompatible change, append `!` after the type or scope and explain the incompatibility and migration in a `BREAKING CHANGE:` footer. A large diff alone does not make a change breaking.
- For a revert, use `revert: ...` and identify the reverted commit in the body when known.

Before proposing a message, inspect the relevant diff. Before creating a commit, inspect the staged diff so the message describes exactly what will be committed. Choose the type based on the main purpose; tests and documentation supporting a feature do not turn it into a `chore`.

Examples:

```text
feat(training): add optional powers and roots
fix(persistence): preserve progress during migration
refactor(training): separate effects from state transitions
docs(faq): explain adaptive difficulty
chore(skills): add English commit message conventions
```

This skill governs commit messages. It does not authorize creating commits, staging unrelated changes, pushing, or rewriting existing history. Do not rename previous commits merely to enforce the convention.
