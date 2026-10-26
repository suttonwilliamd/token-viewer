# Changelog

## Unreleased

- Make the standalone educational GPT-2 / r50k-compatible vocabulary and modern-model/billing limitations explicit.
- Replace numeric clamping with a strict editable decimal-digit draft (0–50256). Keep the last successful result on invalid entry or decoder failure; slider updates clear errors.
- Replace encoding on every keystroke with an explicit Encode action, a 2048 UTF-16 code-unit bound, visible errors, stale-result labeling, total count and complete safe-text ID list. Empty input is an explicit valid zero-token result.
- Add programmatic labels, associated errors/help, status announcements, visible keyboard focus and responsive layout; preserve whitespace visualization and explain partial UTF-8 tokens.
- Add pure-boundary Node tests with real tokenizer fixtures and injected failures; add actual-build Chromium smoke/screenshots and a Node 22 Ubuntu/Windows workflow. Local Linux evidence does not establish Windows or independent UX acceptance.
- Refresh the existing-major lockfile, remove the unused duplicate unscoped encoder, and add development-only Playwright. Dependency audit remains **5 findings (1 critical, 3 high, 1 low)**; see README for scope/limitations. No broad framework migration, production hosting or deployment change.
- Correct PowerShell setup, repository URL, Node/runtime requirements and privacy documentation.

This is a local candidate, not a release announcement.
