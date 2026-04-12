import test from 'node:test';
import assert from 'node:assert/strict';

const {
  bookmarkDisplayName,
  distributedOwner,
  normalizeBookmark,
  suggestedApps,
} = await import('../src/lib/apps.ts');

test('hashtree.cc suggestion points directly to the distributed site tree', () => {
  const suggestion = suggestedApps.find((bookmark) => bookmark.name === 'hashtree.cc');

  assert.deepEqual(suggestion, {
    url: `htree://${distributedOwner}/hashtree-cc-site/index.html`,
    sourceUrl: `htree://${distributedOwner}/hashtree-cc-site/index.html`,
    name: 'hashtree.cc',
    icon: '/hashtree-cc-favicon.svg',
    addedAt: 0,
  });
});

test('normalizeBookmark rewrites legacy hashtree.cc https links to the distributed site tree', () => {
  assert.deepEqual(
    normalizeBookmark({
      url: 'https://hashtree.cc',
      name: 'hashtree.cc',
      icon: '/hashtree-cc-favicon.svg',
      addedAt: 0,
    }),
    {
      url: `htree://${distributedOwner}/hashtree-cc-site/index.html`,
      name: 'hashtree.cc',
      icon: '/hashtree-cc-favicon.svg',
      addedAt: 0,
      sourceAppId: undefined,
      sourceUrl: undefined,
      sourceManifestUrl: undefined,
    },
  );
});

test('normalizeBookmark rewrites legacy hashtree-cc tree bookmarks to hashtree-cc-site', () => {
  const bookmark = normalizeBookmark({
    url: `htree://${distributedOwner}/hashtree-cc/index.html`,
    sourceUrl: `htree://${distributedOwner}/hashtree-cc/index.html`,
    name: 'hashtree.cc',
    addedAt: 0,
  });

  assert.equal(bookmark.url, `htree://${distributedOwner}/hashtree-cc-site/index.html`);
  assert.equal(bookmark.sourceUrl, `htree://${distributedOwner}/hashtree-cc-site/index.html`);
  assert.equal(bookmarkDisplayName(bookmark), 'hashtree.cc');
});
