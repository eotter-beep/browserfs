BRFS

Formerly known as BrowserFS, BRFS is a lightweight Node-style filesystem for browsers using localForage and idb. The new name avoids confusion with other projects that share the BrowserFS name.
Simulate directories, read/write files, and delete them—all with familiar fs-style functions.

Features

Create `directories` using `os_mkdir`

`Write and read files (writeFile / readFile)`

Delete files safely with `fs_unlink`

Fully async, works in modern browsers

Installation

Include via ES modules:
```html
<script type="module">
  import { os_mkdir, writeFile, readFile, fs_unlink } from './brfs.js';
</script>
```

Or via a bundler using npm:
```
npm install localforage idb
```
Usage
Create a directory
```js
const myDir = os_mkdir('Documents');
```
Write a file
```js
await writeFile('Documents', 'hello.txt', 'Hello BRFS!');
```
Read a file
```js
const content = await readFile('Documents', 'hello.txt');
console.log(content); // "Hello BRFS!"
```
Delete a file
```js
await fs_unlink('Documents', 'hello.txt', {
  blocked(fileName) {
    console.warn(`Could not delete file ${fileName} – blocked!`);
  }
});
```

Store and retrieve bits efficiently
```js
await storageSetBit('Documents', 'feature-flags', 3, true);
const isEnabled = await storageGetBit('Documents', 'feature-flags', 3);

// Reset a bitfield entirely
await storageClearBits('Documents', 'feature-flags');
```
Notes

Each directory is a separate `localForage` instance under the hood.

`fs_unlink` supports an optional `blocked()` callback, mostly for handling `IndexedDB` transaction issues.

All functions are `async`, so remember to await them.

License

MIT
