# Token Viewer

A standalone, local educational explorer for the **GPT-2 / r50k-compatible byte-pair vocabulary**. Built with React and Vite (static HTML entry; no framework server), using `@nem035/gpt-3-encoder` 1.1.7. Its package name is historical: this is **not** a current GPT-4/5/6 tokenizer, model API, billing tool, or pricing estimator.

## What it does

- Explore IDs **0–50256 inclusive** with a labeled input or keyboard-operable slider. IDs accept decimal digits only (leading zeros OK), not fractions, signs, exponents, whitespace, or empty input. Invalid drafts remain editable and preserve the last successful decoded result. Decoder errors are visible rather than crashes.
- Visualize spaces (`·`), tabs (`→`), and newlines (`⏎`). A token can contain only part of a UTF-8 character: the replacement character `�` does **not** necessarily indicate failure. For example, IDs `[47249, 222]` jointly decode to `😀`, but `47249` alone displays a replacement character.
- Encode text only with the explicit **Encode** button. Maximum **2048 UTF-16 code units**, measured by JavaScript string length (an emoji like `😀` uses two). Oversize drafts are rejected, never truncated. Empty input explicitly succeeds with **0 tokens**, distinct from an error or no result yet.
- Show the total count and **complete** token-ID list as safe text. When the draft changes, the previous result is marked stale; a failed attempt cannot silently replace it with an empty success.

The tokenizer's installed source uses GPT-2's byte-to-Unicode mapping, BPE merge vocabulary and UTF-8 `TextEncoder` / `TextDecoder`. The installed dictionary has all 50257 contiguous IDs; `0` is `!`, and `50256` decodes to `<|endoftext|>`. Literal special-token strings in text follow the package's ordinary regex/BPE encoding, not a modern chat protocol. Lone UTF-16 surrogates are normalized by `TextEncoder`; do not use this toy for lossless binary conversion.

## Privacy and runtime

This builds to static files in `dist/`; there is no application server runtime or model API. Browser JavaScript and bundled vocabulary are required. The retired Astro shell previously pre-rendered the controls; the static React entry now shows a loading message and a no-JavaScript explanation until client rendering. There is no prehydrated application HTML. If scripts fail to load, the loading guidance remains rather than interactive controls. User text is not sent to a network service, stored in browser storage, or used for analytics. Drafts/results and the upstream tokenizer's BPE cache live in page memory until reload/close. Site assets still require their initial download. No text is inserted as HTML.

This is deliberately modest: no batch processing, file import, modern-model selection, price tables, hosting configuration, or deployment automation. The full vocabulary produces a relatively large browser bundle (~1.48 MB minified / 626 KB gzip in the measured Vite Linux build); the build emits a chunk-size warning. The 2048-unit limit bounds individual requests, not a performance or memory guarantee for indefinite page use. Encoding remains synchronous.

## Windows-first setup (PowerShell)

Use **Node.js 22 LTS, at least 22.12.0**, and npm. Modern browsers must support Unicode property escapes and TextEncoder/TextDecoder. Vite 8.3.5 declares Node `^20.19.0 || >=22.12.0`; this project requires Node 22.12.0 or newer. Node 14 is unsupported.

```powershell
git clone https://github.com/suttonwilliamd/token-viewer.git
Set-Location token-viewer
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:4321`. Stop with Ctrl+C. For a production-output local preview, use `npm run preview -- --host 127.0.0.1`. Equivalent npm commands work in an Ubuntu shell. Keep development/preview servers loopback-only; they are not a production hosting recommendation.

## Tests and browser evidence

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`node:test` covers strict IDs, decoder/encoder error injection, real known token fixtures, emoji/multibyte text, empty input, maximum/oversize inputs, and stale state. The browser test opens only a short-lived loopback fixture serving the actual build, exercises real controls, sequential Tab/Shift+Tab focus order and native Encode activation with Enter/Space, verifies the complete maximum-size ID list and 320px width, checks no page errors/external requests/storage, and writes four screenshots plus `results.json` to `artifacts/browser-smoke/`. It closes its browser/server on exit. Test only synthetic data: screenshots contain the test text. Playwright's browser download needs public network access; Linux may need preinstalled browser system dependencies.

The GitHub workflow declares **Node 22 on Ubuntu and Windows**, running tests, build and actual Chromium smoke with uploaded screenshots. **Workflow presence is not evidence of Windows execution.** This static-build change was verified locally on Linux Node 22.23.2 and headless Chromium only. Earlier Astro integration passed hosted Ubuntu/Windows checks, but that does not qualify this changed toolchain. Exact-head hosted Ubuntu/Windows CI, physical mobile devices, screen readers and independent rendered UX acceptance remain separate gates.

## Static tooling and dependency audit

`package-lock.json` is committed; use `npm ci`. The unnecessary Astro React integration, image/content/schema tooling, Astro configuration and editor integration have been retired. Vite **8.3.5** builds the single React entry to `dist/index.html`; React and React DOM remain **19.3.1**, and the tokenizer is pinned exactly to **1.1.7**. Playwright **1.64.1** is development-only. No forced transitive overrides or `npm audit fix --force` are used.

Measured full `npm audit` (including development dependencies) on **2026-10-26** reports **0 vulnerabilities** after clean lock regeneration, versus the prior Astro integration's 5 affected packages. Production-only audit also reports 0. This is a point-in-time registry result, not a claim of absence of all supply-chain or future vulnerabilities. The workflow now gates on visible full `npm audit` output as well as functional tests/build/browser checks. Re-run the audit before publication/hosting decisions. No hosting, deployment, publication or release is included.
