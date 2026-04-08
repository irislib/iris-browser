import { utils } from 'nostr-tools';
import { encodeBytes } from 'nostr-tools/nip19';

const HASH_HEX_PATTERN = /^[0-9a-f]{64}$/i;

function tlvRecord(type: number, bytes: Uint8Array): Uint8Array {
  const record = new Uint8Array(bytes.length + 2);
  record[0] = type;
  record[1] = bytes.length;
  record.set(bytes, 2);
  return record;
}

export function nhashFromCidString(cid?: string | null): string | null {
  const trimmed = cid?.trim();
  if (!trimmed) {
    return null;
  }

  const [hashHex, keyHex] = trimmed.split(':', 2);
  if (!HASH_HEX_PATTERN.test(hashHex)) {
    return null;
  }

  const records = [tlvRecord(0, utils.hexToBytes(hashHex))];
  if (keyHex) {
    if (!HASH_HEX_PATTERN.test(keyHex)) {
      return null;
    }
    records.push(tlvRecord(5, utils.hexToBytes(keyHex)));
  }

  const tlvBytes = new Uint8Array(records.reduce((sum, record) => sum + record.length, 0));
  let offset = 0;
  for (const record of records) {
    tlvBytes.set(record, offset);
    offset += record.length;
  }
  return encodeBytes('nhash', tlvBytes);
}
