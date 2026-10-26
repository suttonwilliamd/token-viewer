# Changelog

## Unreleased

- Retire the unused Astro shell/integration and image/content/schema dependency chains in favor of a minimal Vite 8.3.5 static React entry. Preserve the application, CSS, state library and exact tokenizer 1.1.7; keep React 19.3.1. HTML retains language/meta/title/viewport/noscript and adds loading guidance, but no longer pre-renders the application controls.
- Regenerate the lock from the new manifest: full and production npm audits measured 0 vulnerabilities on 2026-10-26. Gate CI on the visible full audit; retain real Node 22 Ubuntu/Windows checks (new toolchain not yet hosted-qualified).
- Add sequential Tab/Shift+Tab and native Encode Enter/Space browser coverage without removing existing fixtures/assertions. No deployment or publication.
- Make the standalone educational GPT-2 / r50k-compatible vocabulary and modern-model/billing limitations explicit.
- Replace numeric clamping with a strict editable decimal-digit draft (0–50256). Keep the last successful result on invalid entry or decoder failure; slider updates clear errors.
- Replace encoding on every keystroke with an explicit Encode action, a 2048 UTF-16 code-unit bound, visible errors, stale-result labeling, total count and complete safe-text ID list. Empty input is an explicit valid zero-token result.
- Add programmatic labels, associated errors/help, status announcements, visible keyboard focus and responsive layout; preserve whitespace visualization and explain partial UTF-8 tokens.
- Add pure-boundary Node tests with real tokenizer fixtures and injected failures; add actual-build Chromium smoke/screenshots and a Node 22 Ubuntu/Windows workflow. Local Linux evidence does not establish Windows or independent UX acceptance.
- Earlier educational-app work refreshed the existing-major lockfile, removed the unused duplicate unscoped encoder, and added development-only Playwright. Its 5 advisory findings motivated the static tooling retirement above.
- Correct PowerShell setup, repository URL, Node/runtime requirements and privacy documentation.

This is a local candidate, not a release announcement.
