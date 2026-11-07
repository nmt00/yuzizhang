'use strict';

const fs = require('node:fs');
const path = require('node:path');

const nativeDir = path.resolve(__dirname, '..');
const source = path.resolve(nativeDir, '..');
const target = path.join(nativeDir, 'www');
const excluded = new Set(['tests', 'serve.py', '.preview', 'node_modules', 'native', '.github']);

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('找不到 index.html，请确认 native 位于玉子账前端目录内。');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.readdirSync(source, { withFileTypes: true }).forEach(function (entry) {
  if (excluded.has(entry.name)) return;
  fs.cpSync(path.join(source, entry.name), path.join(target, entry.name), { recursive: true });
});
console.log('Copied web assets to native/www');
