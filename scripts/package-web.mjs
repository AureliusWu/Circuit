import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

// ZIP metadata is fixed; an unchanged dist produces identical bytes on every run.
const project = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(process.argv[2] ?? join(project, 'dist'));
const output = resolve(process.argv[3] ?? join(project, 'artifacts'));
const { version } = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version)) throw new Error('Invalid package version');
for (const required of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  if (!existsSync(join(dist, required))) throw new Error(`Build the production PWA first: missing ${required}`);
}

const crcTable = Array.from({ length: 256 }, (_, initial) => {
  let value = initial;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = (data) => {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in a release: ${path}`);
      return entry.isDirectory() ? files(path) : entry.isFile() ? [path] : [];
    });
}
const entries = files(dist).map((path) => [relative(dist, path).split('\\').join('/'), readFileSync(path)]);
entries.push(['README.txt', Buffer.from(`Circuit / 回路 v${version}\n\nServe these files with an HTTP server. For example:\n  python3 -m http.server 8080\nThen open http://localhost:8080 .\n\nPWA installation requires localhost or HTTPS. Offline play is available after the first successful online load.\nProgress is stored in the browser; export saves from the in-game menu before clearing site data.\n`, 'utf8')]);
entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
if (entries.length > 65535) throw new Error('ZIP64 is required for this many files');
const local = [];
const central = [];
let offset = 0;
for (const [name, contents] of entries) {
  const filename = Buffer.from(name, 'utf8');
  const compressed = deflateRawSync(contents, { level: 9 });
  if (filename.length > 65535 || contents.length > 0xffffffff || compressed.length > 0xffffffff) throw new Error('ZIP64 limit exceeded');
  const checksum = crc32(contents);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6); // UTF-8 filenames
  header.writeUInt16LE(8, 8); // DEFLATE
  header.writeUInt16LE(33, 12); // 1980-01-01
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(contents.length, 22);
  header.writeUInt16LE(filename.length, 26);
  local.push(header, filename, compressed);
  const directory = Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50, 0);
  directory.writeUInt16LE(0x0314, 4); // Unix, ZIP 2.0
  header.copy(directory, 6, 4, 30);
  directory.writeUInt32LE((0o100644 * 65536) >>> 0, 38);
  directory.writeUInt32LE(offset, 42);
  central.push(directory, filename);
  offset += header.length + filename.length + compressed.length;
}
const directory = Buffer.concat(central);
if (offset + directory.length > 0xffffffff) throw new Error('ZIP64 limit exceeded');
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...local, directory, end]);
const filename = `circuit-web-${version}.zip`;
const sha256 = createHash('sha256').update(archive).digest('hex');
mkdirSync(output, { recursive: true });
writeFileSync(join(output, filename), archive);
writeFileSync(join(output, `${filename}.sha256`), `${sha256}  ${filename}\n`);
console.log(JSON.stringify({ archive: join(output, filename), sha256, files: entries.length, bytes: archive.length }));
