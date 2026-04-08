import test from 'node:test';
import assert from 'node:assert/strict';

const {
  hasMeaningfulMediaSummary,
  hasMeaningfulChildDiagnosticsSnapshot,
} = await import('../src/lib/diagnostics.ts');

test('zero-only child media summary does not count as rendered content', () => {
  assert.equal(
    hasMeaningfulMediaSummary('thumbs=0/0 visible=0 videos=0/0 app=0 smoke=0 worker=0 base=0 relays=0 sw=0 coi=0'),
    false,
  );
  assert.equal(
    hasMeaningfulChildDiagnosticsSnapshot({
      title: '',
      bodyText: '',
      mediaSummary: 'thumbs=0/0 visible=0 videos=0/0 app=0 smoke=0 worker=0 base=0 relays=0 sw=0 coi=0',
      error: '',
    }),
    false,
  );
});

test('non-zero diagnostics still count as rendered content', () => {
  assert.equal(hasMeaningfulMediaSummary('thumbs=1/3 visible=1 videos=0/0 app=0'), true);
  assert.equal(
    hasMeaningfulChildDiagnosticsSnapshot({
      title: '',
      bodyText: '',
      mediaSummary: 'thumbs=0/0 visible=0 videos=0/0 app=2',
      error: '',
    }),
    true,
  );
  assert.equal(
    hasMeaningfulChildDiagnosticsSnapshot({
      title: '',
      bodyText: 'Loaded page body',
      mediaSummary: 'thumbs=0/0 visible=0 videos=0/0 app=0',
      error: '',
    }),
    true,
  );
});
