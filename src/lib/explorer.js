export const MIN_TOKEN = 0;
export const MAX_TOKEN = 50256;
export const MAX_TEXT_UNITS = 2048;

export function parseTokenId(draft) {
  if (typeof draft !== 'string' || !/^[0-9]+$/.test(draft)) return null;
  const id = Number(draft);
  return Number.isFinite(id) && Number.isInteger(id) && id >= MIN_TOKEN && id <= MAX_TOKEN ? id : null;
}

// Invalid drafts and decoder failures retain the last successful ID and text.
export function lookupToken(draft, previous, decode) {
  const id = parseTokenId(draft);
  if (id === null) return { ...previous, draft, error: 'Enter decimal digits only: a token ID from 0 to 50256. Empty values are not valid.' };
  try {
    const token = decode([id]);
    if (typeof token !== 'string') throw new TypeError('Invalid decoder result');
    return { draft, id, token, error: null };
  } catch {
    return { ...previous, draft, error: 'Could not decode this token. The last successful result is unchanged. Try another ID.' };
  }
}

export function createEncodingState() {
  return { draft: '', result: null, error: null };
}

export function editEncoding(state, draft) {
  return { ...state, draft, error: null };
}

export function encodingIsStale(state) {
  return state.result !== null && state.result.text !== state.draft;
}

// No call on invalid input; never truncate or turn exceptions into a zero count.
export function encodeDraft(state, encode) {
  if (state.draft.length > MAX_TEXT_UNITS) return {
    ...state, error: `Text exceeds 2048 UTF-16 code units (${state.draft.length} entered). Shorten it, then press Encode. Nothing was truncated.`,
  };
  try {
    const ids = encode(state.draft);
    if (!Array.isArray(ids) || !ids.every(id => Number.isInteger(id) && id >= MIN_TOKEN && id <= MAX_TOKEN)) {
      throw new TypeError('Invalid encoder result');
    }
    return { ...state, result: { text: state.draft, ids: [...ids] }, error: null };
  } catch {
    return { ...state, error: 'Encoding failed. No new token count is available. Edit the text or try Encode again.' };
  }
}

export function visualize(text) {
  return text.replace(/ /g, '·').replace(/\t/g, '→').replace(/\n/g, '⏎\n');
}
