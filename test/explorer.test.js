import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { encode, decode } from '@nem035/gpt-3-encoder';
import { parseTokenId, lookupToken, createEncodingState, editEncoding, encodeDraft, encodingIsStale, visualize } from '../src/lib/explorer.js';

for (const [draft, expected] of [['0', 0], ['50256', 50256], ['00001', 1], ['000', 0]]) {
  test(`accept ID ${draft}`, () => assert.equal(parseTokenId(draft), expected));
}
for (const draft of ['', ' ', 'NaN', 'Infinity', '1.5', '.0', '1e2', '-1', '+1', '50257', '1_000', '0x10', '１２', '1\n', ' 1', '1 ', '9'.repeat(400)]) {
  test(`reject ID ${JSON.stringify(draft)}`, () => {
    const previous = { draft: '0', id: 0, token: '!' };
    let calls = 0;
    const state = lookupToken(draft, previous, () => { calls++; });
    assert.equal(calls, 0);
    assert.equal(state.id, 0);
    assert.equal(state.token, '!');
    assert.equal(state.draft, draft);
    assert.ok(state.error);
  });
}

test('installed vocabulary is contiguous GPT-2-sized with known endpoints', () => {
  const require = createRequire(import.meta.url);
  const vocab = require('@nem035/gpt-3-encoder/encoder.json');
  assert.deepEqual(Object.values(vocab).sort((a, b) => a - b), Array.from({ length: 50257 }, (_, i) => i));
  assert.equal(decode([0]), '!');
  assert.equal(decode([50256]), '<|endoftext|>');
});

test('lookup recovers after cleared draft / decoder exception; valid slider value clears error', () => {
  const initial = lookupToken('0', {}, decode);
  const cleared = lookupToken('', initial, () => assert.fail('must not decode'));
  assert.equal(cleared.draft, '');
  const failed = lookupToken('50256', cleared, () => { throw new Error('secret input'); });
  assert.equal(failed.token, '!');
  assert.equal(failed.id, 0);
  assert.ok(!failed.error.includes('secret input'));
  const recovered = lookupToken('50256', failed, decode);
  assert.equal(recovered.error, null);
  assert.equal(recovered.id, 50256);
  assert.equal(recovered.token, '<|endoftext|>');
});

test('invalid decoder return is honest failure', () => {
  assert.ok(lookupToken('0', { id: 1, token: 'prior' }, () => undefined).error);
});

const fixtures = [
  ['', []], ['hello', [31373]], ['Hello, world!', [15496, 11, 995, 0]],
  ['😀', [47249, 222]], ['你好', [19526, 254, 25001, 121]],
  [' café', [40304]], [' \t\n', [220, 197, 198]],
];
for (const [text, ids] of fixtures) {
  test(`real tokenizer fixture ${JSON.stringify(text)}`, () => {
    const result = encodeDraft(editEncoding(createEncodingState(), text), encode);
    assert.equal(result.error, null);
    assert.deepEqual(result.result.ids, ids);
    assert.equal(decode(ids), text);
    assert.equal(result.result.text, text);
    assert.equal(encodingIsStale(result), false);
  });
}

test('partial UTF-8 replacement is successful decoding, not an exception', () => {
  assert.equal(decode([47249]), '�');
  assert.equal(decode([47249, 222]), '😀');
  assert.equal(lookupToken('47249', {}, decode).error, null);
});

test('2048-unit bound uses UTF-16; real boundary emoji round trip; oversize never calls encoder', () => {
  for (const text of ['a'.repeat(2048), '😀'.repeat(1024)]) {
    const state = encodeDraft(editEncoding(createEncodingState(), text), encode);
    assert.equal(state.error, null);
    assert.equal(decode(state.result.ids), text);
  }
  let calls = 0;
  for (const text of ['a'.repeat(2049), '😀'.repeat(1024) + 'x']) {
    const state = encodeDraft(editEncoding(createEncodingState(), text), () => { calls++; });
    assert.match(state.error, /Shorten/);
    assert.equal(state.draft, text);
    assert.equal(state.result, null);
  }
  assert.equal(calls, 0);
});

test('edits never encode; stale result persists through error then explicit empty success', () => {
  const initial = createEncodingState();
  assert.equal(initial.result, null);
  const first = encodeDraft(editEncoding(initial, 'hello'), encode);
  const edited = editEncoding(first, 'new text');
  assert.equal(edited.result, first.result);
  assert.equal(encodingIsStale(edited), true);
  const failed = encodeDraft(edited, () => { throw new Error('private text'); });
  assert.equal(failed.result, first.result);
  assert.match(failed.error, /Encoding failed/);
  assert.ok(!failed.error.includes('private text'));
  assert.equal(encodingIsStale(failed), true);
  const reverted = editEncoding(failed, 'hello');
  assert.equal(encodingIsStale(reverted), false);
  assert.equal(reverted.error, null);
  const empty = encodeDraft(editEncoding(failed, ''), encode);
  assert.deepEqual(empty.result.ids, []);
  assert.equal(empty.error, null);
});

test('bad encoder output is not a successful empty result', () => {
  for (const ids of [undefined, [NaN], [1.5], [-1], [50257], ['0']]) {
    const state = encodeDraft(editEncoding(createEncodingState(), 'hello'), () => ids);
    assert.ok(state.error);
    assert.equal(state.result, null);
  }
});

test('whitespace visualization preserves lines', () => {
  assert.equal(visualize('a b\tc\n'), 'a·b→c⏎\n');
});
