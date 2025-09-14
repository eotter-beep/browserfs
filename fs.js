import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm';
import localforage from 'https://cdn.jsdelivr.net/npm/localforage@1.10.0/+esm';

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
