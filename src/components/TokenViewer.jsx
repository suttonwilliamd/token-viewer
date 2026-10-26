import React, { useState } from 'react';
import { decode, encode } from '@nem035/gpt-3-encoder';
import { MAX_TOKEN, MAX_TEXT_UNITS, lookupToken, createEncodingState, editEncoding, encodeDraft, encodingIsStale, visualize } from '../lib/explorer.js';
import './TokenViewer.css';

export default function TokenViewer() {
  const [lookup, setLookup] = useState(() => lookupToken('0', { id: 0, token: null }, decode));
  const [encoding, setEncoding] = useState(createEncodingState);
  const stale = encodingIsStale(encoding);
  const resultLabel = encoding.error ? 'Previous result — latest Encode failed.' : stale ? 'Stale result — text changed. Press Encode to update.' : 'Current result.';
  const updateToken = draft => setLookup(previous => lookupToken(draft, previous, decode));

  return (
    <main className="explorer">
      <header>
        <p className="eyebrow">A local vocabulary playground</p>
        <h1>Token Viewer</h1>
        <p>Explore the <strong>GPT-2 / r50k-compatible vocabulary</strong> with byte-pair encoding (BPE).</p>
        <p className="notice">This is NOT a current GPT-4/5/6 tokenizer, billing tool, or pricing estimator. Counts apply only to this educational vocabulary.</p>
      </header>

      <section aria-labelledby="lookup-heading">
        <h2 id="lookup-heading">1. Explore one token</h2>
        <p id="token-help">Enter decimal digits from 0 to 50256. Leading zeros are OK. Invalid entries keep the last successful result.</p>
        <label htmlFor="token-id">Token ID</label>
        <input id="token-id" type="text" inputMode="numeric" autoComplete="off" spellCheck={false}
          value={lookup.draft} onChange={event => updateToken(event.target.value)}
          aria-invalid={Boolean(lookup.error)} aria-describedby="token-help token-error" />
        <p id="token-error" className="error" role="alert">{lookup.error}</p>
        <label htmlFor="token-slider">Token ID slider (0–50256)</label>
        <input id="token-slider" type="range" min="0" max={MAX_TOKEN} step="1" value={lookup.id}
          onChange={event => updateToken(event.target.value)} aria-describedby="slider-help" />
        <p id="slider-help" className="hint">Use arrow keys for one ID at a time; Home / End for the limits.</p>
        <div role="status" aria-live="polite">
          <p>Last successful token: <strong>{lookup.token === null ? 'none' : lookup.id}</strong></p>
          <pre className="token-output" aria-label="Decoded token">{lookup.token === null ? 'No decoded result yet.' : visualize(lookup.token) || '(empty decoded text)'}</pre>
        </div>
        <p className="hint">Individual tokens can contain only part of a UTF-8 character. A displayed replacement character (�) need not mean the decoder failed. Joining tokens can complete the character.</p>
        <p className="legend">Whitespace key: <code>·</code> space · <code>→</code> tab · <code>⏎</code> newline. These marks visualize whitespace, not literal token text.</p>
      </section>

      <section aria-labelledby="encode-heading">
        <h2 id="encode-heading">2. Encode a short text</h2>
        <label htmlFor="encode-text">Text to encode (maximum 2048 UTF-16 code units)</label>
        <p id="encode-help" className="hint">Encoding runs only when you press Encode. Most emoji use two UTF-16 code units. Empty text is valid and produces 0 tokens. Oversize text is rejected, never truncated.</p>
        <textarea id="encode-text" rows="5" value={encoding.draft}
          onChange={event => setEncoding(previous => editEncoding(previous, event.target.value))}
          aria-invalid={Boolean(encoding.error)} aria-describedby="encode-help text-length encode-error"
          autoComplete="off" spellCheck={false} />
        <p id="text-length" className={encoding.draft.length > MAX_TEXT_UNITS ? 'error' : 'hint'}>{encoding.draft.length} / {MAX_TEXT_UNITS} UTF-16 code units</p>
        <button type="button" onClick={() => setEncoding(previous => encodeDraft(previous, encode))}>Encode</button>
        <p id="encode-error" className="error" role="alert">{encoding.error}</p>
        <div role="status" aria-live="polite" aria-atomic="true" className="result-summary">
          <p>{encoding.result ? resultLabel : 'No encoding result yet. Press Encode to begin.'}</p>
          {encoding.result && <p><strong>Total token count: {encoding.result.ids.length}</strong>{encoding.result.text === '' && ' (empty input)'}</p>}
        </div>
        {encoding.result && <>
          <h3>Complete token-ID list{stale || encoding.error ? ' (previous result)' : ''}</h3>
          <pre className="ids" aria-label="Complete token-ID list">[{encoding.result.ids.join(', ')}]</pre>
        </>}
      </section>
      <footer>No text is sent over the network, saved to storage, or used for analytics. Text stays in this page’s memory until you close or reload it. The tokenizer is bundled locally; no model API is called.</footer>
    </main>
  );
}
