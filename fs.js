import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm';
import localforage from 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/+esm';

const BIT_DB_NAME = 'browserfs-bit-storage';
const BIT_STORE_NAME = 'bitfields';

const bitDBPromise = openDB(BIT_DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(BIT_STORE_NAME)) {
      db.createObjectStore(BIT_STORE_NAME);
    }
  },
});

const BIT_KEY_PREFIX = '__bit__';

function makeBitKey(dir, fileName) {
  return `${BIT_KEY_PREFIX}:${dir}/${fileName}`;
}

function ensureIntegerBitIndex(bitIndex) {
  if (!Number.isInteger(bitIndex) || bitIndex < 0) {
    throw new TypeError('bitIndex must be a non-negative integer');
  }
}

function normaliseBitValue(value) {
  return Boolean(value);
}

function toUint8Array(payload) {
  if (!payload) return null;
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength));
  }
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  return null;
}

// Track "directories" as localForage instances
const directories = {};

// Create a new "directory"
function os_mkdir(title) {
  const instance = localforage.createInstance({ name: title });
  directories[title] = instance;
  return instance;
}

// Write a file to a directory
async function writeFile(dir, fileName, content) {
  const folder = directories[dir];
  if (!folder) throw new Error(`Directory "${dir}" does not exist`);
  await folder.setItem(fileName, content);
  console.log(`File "${fileName}" written to "${dir}"`);
}

// Read a file from a directory
async function readFile(dir, fileName) {
  const folder = directories[dir];
  if (!folder) throw new Error(`Directory "${dir}" does not exist`);
  const content = await folder.getItem(fileName);
  if (content === null) throw new Error(`File "${fileName}" not found in "${dir}"`);
  return content;
}

// Delete a file from a directory
async function fs_unlink(dir, fileName, { blocked } = {}) {
  try {
    const folder = directories[dir];
    if (!folder) throw new Error(`Directory "${dir}" does not exist`);
    await folder.removeItem(fileName);
    console.log(`Deleted "${fileName}" from "${dir}"`);
  } catch (err) {
    if (typeof blocked === 'function') blocked(fileName);
    else console.error(`Failed to delete "${fileName}":`, err);
  }
}

async function getBitfield(key, minBits = 0) {
  const db = await bitDBPromise;
  const stored = await db.get(BIT_STORE_NAME, key);
  let bitfield;
  if (!stored) {
    bitfield = new Uint8Array(Math.ceil(minBits / 8));
  } else {
    bitfield = toUint8Array(stored);
  }

  if (!bitfield) {
    throw new TypeError('Stored bitfield is not a supported binary type');
  }

  const requiredBytes = Math.ceil(minBits / 8);
  if (requiredBytes > bitfield.length) {
    const expanded = new Uint8Array(requiredBytes);
    expanded.set(bitfield);
    bitfield = expanded;
  }

  return bitfield;
}

async function persistBitfield(key, bitfield) {
  const db = await bitDBPromise;
  await db.put(BIT_STORE_NAME, bitfield, key);
}

async function storageSetBit(dir, fileName, bitIndex, value) {
  ensureIntegerBitIndex(bitIndex);
  const bitValue = normaliseBitValue(value);
  const key = makeBitKey(dir, fileName);
  const totalBits = bitIndex + 1;
  const bitfield = await getBitfield(key, totalBits);

  const byteIndex = Math.floor(bitIndex / 8);
  const mask = 1 << (bitIndex % 8);

  if (bitValue) {
    bitfield[byteIndex] |= mask;
  } else {
    bitfield[byteIndex] &= ~mask;
  }

  await persistBitfield(key, bitfield);
  return bitValue;
}

async function storageGetBit(dir, fileName, bitIndex) {
  ensureIntegerBitIndex(bitIndex);
  const key = makeBitKey(dir, fileName);
  const db = await bitDBPromise;
  const stored = await db.get(BIT_STORE_NAME, key);
  if (!stored) return false;

  const bitfield = toUint8Array(stored);
  if (!bitfield) {
    throw new TypeError('Stored bitfield is not a supported binary type');
  }

  const byteIndex = Math.floor(bitIndex / 8);
  if (byteIndex >= bitfield.length) return false;
  const mask = 1 << (bitIndex % 8);
  return (bitfield[byteIndex] & mask) !== 0;
}

async function storageClearBits(dir, fileName) {
  const key = makeBitKey(dir, fileName);
  const db = await bitDBPromise;
  await db.delete(BIT_STORE_NAME, key);
}

export {
  os_mkdir,
  writeFile,
  readFile,
  fs_unlink,
  storageSetBit,
  storageGetBit,
  storageClearBits,
};
