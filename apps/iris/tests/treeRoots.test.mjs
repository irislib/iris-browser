import test from 'node:test';
import assert from 'node:assert/strict';

const {
  compareMutableTreeRootVersions,
  mutableTreeRootFromSignedEvent,
  normalizeMutableTreeRoot,
  readCachedMutableTreeRoot,
  relayWebSocketUrlFromServerUrl,
  writeCachedMutableTreeRoot,
} = await import('../src/lib/treeRoots.ts');

class MemoryStorage {
  map = new Map();

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

test('parses public root events into immutable tree roots', () => {
  const hash = '11'.repeat(32);
  const key = '22'.repeat(32);
  const root = mutableTreeRootFromSignedEvent({
    id: 'aa'.repeat(32),
    pubkey: 'bb'.repeat(32),
    created_at: 123,
    kind: 30078,
    content: '',
    tags: [
      ['d', 'docs'],
      ['l', 'hashtree'],
      ['hash', hash],
      ['key', key],
    ],
  });

  assert.equal(root?.hash, hash);
  assert.equal(root?.key, key);
  assert.equal(root?.visibility, 'public');
  assert.match(root?.nhash ?? '', /^nhash1/);
});

test('normalizes resolver payloads that only include cid strings', () => {
  const hash = '33'.repeat(32);
  const normalized = normalizeMutableTreeRoot({
    cid: hash,
    source: 'cache',
  });

  assert.equal(normalized?.hash, hash);
  assert.equal(normalized?.cid, hash);
  assert.equal(normalized?.source, 'cache');
  assert.match(normalized?.nhash ?? '', /^nhash1/);
});

test('compares newer root events by timestamp and event id', () => {
  const older = normalizeMutableTreeRoot({
    hash: '44'.repeat(32),
    createdAt: 10,
    eventId: '11'.repeat(32),
  });
  const newer = normalizeMutableTreeRoot({
    hash: '55'.repeat(32),
    createdAt: 11,
    eventId: '00'.repeat(32),
  });
  const tieBreaker = normalizeMutableTreeRoot({
    hash: '66'.repeat(32),
    createdAt: 11,
    eventId: 'ff'.repeat(32),
  });

  assert.ok(older && newer && tieBreaker);
  assert.equal(compareMutableTreeRootVersions(newer, older), 1);
  assert.ok(compareMutableTreeRootVersions(tieBreaker, newer) > 0);
});

test('persists cached mutable roots in localStorage', () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage();

  try {
    const hash = '77'.repeat(32);
    writeCachedMutableTreeRoot('npub1example', 'docs', {
      hash,
      source: 'relay',
      createdAt: 42,
      eventId: '88'.repeat(32),
      nhash: normalizeMutableTreeRoot({ hash })?.nhash ?? '',
    });

    const cached = readCachedMutableTreeRoot('npub1example', 'docs');
    assert.equal(cached?.hash, hash);
    assert.equal(cached?.source, 'relay');
    assert.equal(cached?.createdAt, 42);
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test('derives local relay websocket urls from the embedded daemon url', () => {
  assert.equal(
    relayWebSocketUrlFromServerUrl('http://127.0.0.1:21417'),
    'ws://127.0.0.1:21417/ws',
  );
  assert.equal(
    relayWebSocketUrlFromServerUrl('https://browser.iris.to'),
    'wss://browser.iris.to/ws',
  );
});
