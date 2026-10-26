# Token Viewer

A standalone, local educational explorer for the **GPT-2 / r50k-compatible byte-pair vocabulary**. Built with Astro and React, using `@nem035/gpt-3-encoder` 1.1.7. Its package name is historical: this is **not** a current GPT-4/5/6 tokenizer, model API, billing tool, or pricing estimator.

## What it does

- Explore IDs **0–50256 inclusive** with a labeled input or keyboard-operable slider. IDs accept decimal digits only (leading zeros OK), not fractions, signs, exponents, whitespace, or empty input. Invalid drafts remain editable and preserve the last successful decoded result. Decoder errors are visible rather than crashes.
- Visualize spaces (`·`), tabs (`→`), and newlines (`⏎`). A token can contain only part of a UTF-8 character: the replacement character `�` does **not** necessarily indicate failure. For example, IDs `[47249, 222]` jointly decode to `😀`, but `47249` alone displays a replacement character.
- Encode text only with the explicit **Encode** button. Maximum **2048 UTF-16 code units**, measured by JavaScript string length (an emoji like `😀` uses two). Oversize drafts are rejected, never truncated. Empty input explicitly succeeds with **0 tokens**, distinct from an error or no result yet.
- Show the total count and **complete** token-ID list as safe text. When the draft changes, the previous result is marked stale; a failed attempt cannot silently replace it with an empty success.

The tokenizer's installed source uses GPT-2's byte-to-Unicode mapping, BPE merge vocabulary and UTF-8 `TextEncoder` / `TextDecoder`. The installed dictionary has all 50257 contiguous IDs; `0` is `!`, and `50256` decodes to `<|endoftext|>`. Literal special-token strings in text follow the package's ordinary regex/BPE encoding, not a modern chat protocol. Lone UTF-16 surrogates are normalized by `TextEncoder`; do not use this toy for lossless binary conversion.

## Privacy and runtime

This builds to static files in `dist/`; there is no application server runtime or model API. Browser JavaScript and bundled vocabulary are required. User text is not sent to a network service, stored in browser storage, or used for analytics. Drafts/results and the upstream tokenizer's BPE cache live in page memory until reload/close. Site assets still require their initial download. No text is inserted as HTML.

This is deliberately modest: no batch processing, file import, modern-model selection, price tables, hosting configuration, or deployment automation. The full vocabulary produces a relatively large browser bundle (~1.28 MB minified / 590 KB gzip in the measured Linux build); the build emits a chunk-size warning. The 2048-unit limit bounds individual requests, not a performance or memory guarantee for indefinite page use. Encoding remains synchronous.

## Windows-first setup (PowerShell)

Use **Node.js 22 LTS, at least 22.12.0**, and npm. Modern browsers must support Unicode property escapes and TextEncoder/TextDecoder. Node 14 is not supported by the current Astro toolchain.

```powershell
git clone https://github.com/suttonwilliamd/token-viewer.git
Set-Location token-viewer
$env:ASTRO_TELEMETRY_DISABLED = "1"
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:4321`. Stop with Ctrl+C. For a production-output local preview, use `npm run preview -- --host 127.0.0.1`. Equivalent commands work in an Ubuntu shell (`export ASTRO_TELEMETRY_DISABLED=1` instead of the PowerShell assignment). Keep development/preview servers loopback-only; they are not a production hosting recommendation.

## Tests and browser evidence

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`node:test` covers strict IDs, decoder/encoder error injection, real known token fixtures, emoji/multibyte text, empty input, maximum/oversize inputs, and stale state. The browser test opens only a short-lived loopback fixture serving the actual build, exercises real controls and keyboard focus, verifies the complete maximum-size ID list and 320px width, checks no page errors/external requests/storage, and writes four screenshots plus `results.json` to `artifacts/browser-smoke/`. It closes its browser/server on exit. Test only synthetic data: screenshots contain the test text. Playwright's browser download needs public network access; Linux may need preinstalled browser system dependencies.

The GitHub workflow declares **Node 22 on Ubuntu and Windows**, running tests, build and actual Chromium smoke with uploaded screenshots. **Workflow presence is not evidence of Windows execution.** Local implementation verification was Linux Node 22.23.4 and headless Chromium only. Native Windows, physical mobile devices, screen readers and independent rendered UX acceptance remain unverified.

## Dependency audit — not clean

`package-lock.json` is committed; use `npm ci`. The unused unscoped `gpt-3-encoder` dependency was removed after source usage inspection. Existing major versions were retained while refreshing their compatible lock entries (Astro 5.18.2, React 19.3.1; no framework migration). Playwright is a development-only browser-test dependency.

Measured `npm audit` on 2026-10-26 reported **5 affected packages: 1 critical, 3 high, 1 low**, down from baseline 21 (1 critical, 17 high, 1 moderate, 2 low). These are not suppressed or represented as fixed:

- **Astro (critical aggregate):** includes AVIF image-optimization RCE, reflected/stored XSS and SSRF advisory paths. This app is static-only, has no image optimization inputs, server islands, dynamic slots, view transitions, user-controlled build data, or SSR routes. That narrows this app's exposure, not the upstream advisory's validity.
- **sharp (high):** native image-library advisories; no application image processing is used.
- **zod / zod-to-ts (high):** oversized collection validation/resource exhaustion in tooling dependencies; no app validation uses Zod.
- **esbuild (low):** Windows development-server arbitrary file read advisory; do not expose a dev server to untrusted users.

The registry recommends a major Astro upgrade (7.4.2) to address these dependency chains; that is outside this bounded no-migration change. Do not run `npm audit fix --force` blindly. The workflow runs `npm audit` with visible output as an explicitly **non-gating advisory-report step**; functional tests/build/browser steps remain gating. A green functional workflow must not be called a clean security audit. Re-run `npm audit` for current advisory details before any publication/hosting decision.
