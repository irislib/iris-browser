import { nip19 } from 'nostr-tools';
import { nhashFromCidString } from './nhash.ts';

export type MutableTreeVisibility = 'public' | 'link-visible' | 'private';

export type SignedRootEvent = {
  id?: string | null;
  pubkey?: string | null;
  created_at?: number | null;
  kind?: number | null;
  tags?: string[][] | null;
  content?: string | null;
  sig?: string | null;
};

export type MutableTreeRoot = {
  hash: string;
  key?: string | null;
  cid?: string | null;
  nhash: string;
  visibility?: MutableTreeVisibility | null;
  source?: string | null;
  createdAt?: number | null;
  eventId?: string | null;
  encryptedKey?: string | null;
  selfEncryptedKey?: string | null;
  snapshotNhash?: string | null;
  event?: SignedRootEvent | null;
};

type MutableTreeRootCacheEntry = MutableTreeRoot & {
  npub: string;
  treeName: string;
  storedAt: number;
};

type MutableTreeRootCacheState = Record<string, MutableTreeRootCacheEntry>;

const STORAGE_KEY = 'iris:mutable-tree-roots:v1';
const MAX_CACHED_TREE_ROOTS = 128;
const HASH_HEX_PATTERN = /^[0-9a-f]{64}$/i;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function cacheKey(npub: string, treeName: string): string {
  return `${npub}/${treeName}`;
}

function normalizeHash(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !HASH_HEX_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

function normalizeOptionalHash(value?: string | null): string | null {
  const normalized = normalizeHash(value);
  return normalized || null;
}

function normalizeEventId(value?: string | null): string | null {
  return normalizeOptionalHash(value);
}

function decodeCid(value?: string | null): { hash: string; key: string | null } | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const [hash, key] = trimmed.split(':', 2);
  const normalizedHash = normalizeHash(hash);
  if (!normalizedHash) {
    return null;
  }

  return {
    hash: normalizedHash,
    key: normalizeOptionalHash(key),
  };
}

function normalizeVisibility(
  value?: string | null,
  encryptedKey?: string | null,
  selfEncryptedKey?: string | null,
): MutableTreeVisibility {
  if (value === 'link-visible' || encryptedKey) {
    return 'link-visible';
  }
  if (value === 'private' || selfEncryptedKey) {
    return 'private';
  }
  return 'public';
}

function buildCid(hash: string, key?: string | null): string {
  return key ? `${hash}:${key}` : hash;
}

function readCacheState(): MutableTreeRootCacheState {
  const target = storage();
  if (!target) {
    return {};
  }

  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed as MutableTreeRootCacheState;
  } catch {
    return {};
  }
}

function writeCacheState(state: MutableTreeRootCacheState): void {
  const target = storage();
  if (!target) {
    return;
  }

  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore cache write failures.
  }
}

function pruneCache(state: MutableTreeRootCacheState): MutableTreeRootCacheState {
  const entries = Object.entries(state)
    .sort(([, left], [, right]) => (right.storedAt ?? 0) - (left.storedAt ?? 0))
    .slice(0, MAX_CACHED_TREE_ROOTS);
  return Object.fromEntries(entries);
}

function tagValue(tags: string[][] | null | undefined, name: string): string | null {
  if (!Array.isArray(tags)) {
    return null;
  }
  for (const tag of tags) {
    if (!Array.isArray(tag) || tag[0] !== name || typeof tag[1] !== 'string') {
      continue;
    }
    return tag[1];
  }
  return null;
}

function normalizeSignedRootEvent(event?: SignedRootEvent | null): SignedRootEvent | null {
  if (!event || typeof event !== 'object') {
    return null;
  }
  return {
    id: normalizeEventId(event.id),
    pubkey: typeof event.pubkey === 'string' ? event.pubkey : null,
    created_at: typeof event.created_at === 'number' ? event.created_at : null,
    kind: typeof event.kind === 'number' ? event.kind : null,
    tags: Array.isArray(event.tags)
      ? event.tags.filter((tag) => Array.isArray(tag) && tag.every((value) => typeof value === 'string'))
      : null,
    content: typeof event.content === 'string' ? event.content : null,
    sig: typeof event.sig === 'string' ? event.sig : null,
  };
}

export function normalizeMutableTreeRoot(
  value: Partial<MutableTreeRoot> | null | undefined,
): MutableTreeRoot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const decodedCid = decodeCid(value.cid);
  const hash = normalizeHash(value.hash) ?? decodedCid?.hash ?? null;
  if (!hash) {
    return null;
  }

  const key = normalizeOptionalHash(value.key) ?? decodedCid?.key ?? null;
  const cid = buildCid(hash, key);
  const nhash = value.nhash?.trim() || nhashFromCidString(cid);
  if (!nhash) {
    return null;
  }

  const encryptedKey = normalizeOptionalHash(value.encryptedKey);
  const selfEncryptedKey = normalizeOptionalHash(value.selfEncryptedKey);

  return {
    hash,
    key,
    cid,
    nhash,
    visibility: normalizeVisibility(value.visibility, encryptedKey, selfEncryptedKey),
    source: value.source?.trim() || null,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : null,
    eventId: normalizeEventId(value.eventId),
    encryptedKey,
    selfEncryptedKey,
    snapshotNhash: value.snapshotNhash?.trim() || null,
    event: normalizeSignedRootEvent(value.event),
  };
}

export function mutableTreeRootsMatch(
  left: MutableTreeRoot | null | undefined,
  right: MutableTreeRoot | null | undefined,
): boolean {
  if (!left || !right) {
    return false;
  }
  return left.hash === right.hash && (left.key ?? null) === (right.key ?? null);
}

export function compareMutableTreeRootVersions(
  candidate: MutableTreeRoot,
  current: MutableTreeRoot,
): number {
  const candidateCreatedAt = candidate.createdAt ?? null;
  const currentCreatedAt = current.createdAt ?? null;

  if (candidateCreatedAt !== null && currentCreatedAt !== null && candidateCreatedAt !== currentCreatedAt) {
    return candidateCreatedAt - currentCreatedAt;
  }

  if (candidateCreatedAt !== null && currentCreatedAt === null) {
    return 1;
  }
  if (candidateCreatedAt === null && currentCreatedAt !== null) {
    return -1;
  }

  const candidateEventId = candidate.eventId ?? null;
  const currentEventId = current.eventId ?? null;
  if (candidateEventId && currentEventId && candidateEventId !== currentEventId) {
    return candidateEventId.localeCompare(currentEventId);
  }
  if (candidateEventId && !currentEventId) {
    return 1;
  }
  if (!candidateEventId && currentEventId) {
    return -1;
  }

  return 0;
}

export function readCachedMutableTreeRoot(
  npub: string,
  treeName: string,
): MutableTreeRoot | null {
  const cached = readCacheState()[cacheKey(npub, treeName)];
  if (!cached) {
    return null;
  }
  return normalizeMutableTreeRoot(cached);
}

export function writeCachedMutableTreeRoot(
  npub: string,
  treeName: string,
  root: MutableTreeRoot,
): void {
  const normalized = normalizeMutableTreeRoot(root);
  if (!normalized) {
    return;
  }

  const state = readCacheState();
  state[cacheKey(npub, treeName)] = {
    npub,
    treeName,
    storedAt: Date.now(),
    ...normalized,
  };
  writeCacheState(pruneCache(state));
}

export function clearCachedMutableTreeRoot(npub: string, treeName: string): void {
  const state = readCacheState();
  delete state[cacheKey(npub, treeName)];
  writeCacheState(state);
}

export function mutableTreeRootFromSignedEvent(event: SignedRootEvent): MutableTreeRoot | null {
  if (event.kind !== 30078) {
    return null;
  }

  const tags = event.tags ?? null;
  const hash = normalizeHash(tagValue(tags, 'hash') ?? event.content ?? null);
  if (!hash) {
    return null;
  }

  const encryptedKey = normalizeOptionalHash(tagValue(tags, 'encryptedKey'));
  const selfEncryptedKey = normalizeOptionalHash(tagValue(tags, 'selfEncryptedKey'));
  const visibility = normalizeVisibility(null, encryptedKey, selfEncryptedKey);
  const key = visibility === 'public' ? normalizeOptionalHash(tagValue(tags, 'key')) : null;
  const cid = buildCid(hash, key);
  const nhash = nhashFromCidString(cid);
  if (!nhash) {
    return null;
  }

  return {
    hash,
    key,
    cid,
    nhash,
    visibility,
    createdAt: typeof event.created_at === 'number' ? event.created_at : null,
    eventId: normalizeEventId(event.id),
    encryptedKey,
    selfEncryptedKey,
    event: normalizeSignedRootEvent(event),
  };
}

export function relayWebSocketUrlFromServerUrl(serverUrl: string): string | null {
  try {
    const parsed = new URL(serverUrl);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = '/ws';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function decodeAuthorPubkey(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== 'npub' || typeof decoded.data !== 'string') {
      return null;
    }
    return decoded.data;
  } catch {
    return null;
  }
}

export function subscribeMutableTreeRootEvents(config: {
  serverUrl: string;
  npub: string;
  treeName: string;
  onRoot: (root: MutableTreeRoot) => void | Promise<void>;
}): () => void {
  const relayUrl = relayWebSocketUrlFromServerUrl(config.serverUrl);
  const authorPubkey = decodeAuthorPubkey(config.npub);
  if (!relayUrl || !authorPubkey) {
    return () => {};
  }

  const subId = `iris-root-${Math.random().toString(36).slice(2)}`;
  let socket: WebSocket | null = null;
  let closed = false;

  try {
    socket = new WebSocket(relayUrl);
  } catch {
    return () => {};
  }

  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(['CLOSE', subId]));
      }
    } catch {
      // Ignore shutdown send failures.
    }
    try {
      socket?.close();
    } catch {
      // Ignore shutdown close failures.
    }
  };

  socket.addEventListener('open', () => {
    if (closed) {
      return;
    }

    const filter = {
      kinds: [30078],
      authors: [authorPubkey],
      '#d': [config.treeName],
      '#l': ['hashtree'],
      limit: 1,
    };
    socket?.send(JSON.stringify(['REQ', subId, filter]));
  });

  socket.addEventListener('message', (message) => {
    if (closed) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(String(message.data));
    } catch {
      return;
    }

    if (!Array.isArray(parsed) || parsed[0] !== 'EVENT' || parsed[1] !== subId) {
      return;
    }

    const root = mutableTreeRootFromSignedEvent((parsed[2] ?? null) as SignedRootEvent);
    if (!root) {
      return;
    }

    void config.onRoot(root);
  });

  socket.addEventListener('close', () => {
    closed = true;
  });

  return close;
}
