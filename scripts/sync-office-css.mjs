// Compiles src/styles/main.scss and splices only the cars-page heading and
// office-row styles into src/styles/main.css, leaving the rest of the
// committed CSS byte identical. The local dart-sass is newer than the one
// that generated the committed main.css and rewrites ~800 lines of Bootstrap
// rgb() custom properties, which buries the real change in review noise.
//
// Usage: node scripts/sync-office-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as sass from 'sass';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scssPath = path.join(root, 'src/styles/main.scss');
const cssPath = path.join(root, 'src/styles/main.css');

const START = '.car-page {';
const END = '.filter_search {';

function compile() {
  return sass.compile(scssPath, {
    loadPaths: [path.join(root, 'node_modules')],
    style: 'expanded',
    // bootstrap's @import and global color functions are deprecated upstream
    logger: sass.Logger.silent,
  }).css;
}

/** The compiled office-row block, normalised to LF. */
function extractBlock(css) {
  const normalised = css.replace(/\r\n/g, '\n');
  const start = normalised.indexOf(START);
  const end = normalised.indexOf(END, start);

  if (start < 0 || end < 0) throw new Error(`could not locate ${START} / ${END}`);

  return normalised.slice(start, end).replace(/^\n+/, '').replace(/\n+$/, '');
}

/** Swaps an existing block for a new one, tolerating either line ending. */
function replaceBlock(file, oldBlock, newBlock) {
  const eol = file.includes('\r\n') ? '\r\n' : '\n';
  const from = oldBlock.split('\n').join(eol);
  const to = newBlock.split('\n').join(eol);

  const start = file.indexOf(from);

  if (start < 0) throw new Error('existing office-row block not found in main.css');

  return file.slice(0, start) + to + file.slice(start + from.length);
}

const block = extractBlock(compile());
const current = readFileSync(cssPath, 'utf8');
const next = replaceBlock(current, extractBlock(current), block);

writeFileSync(cssPath, next);
console.log(`synced office-row css (${block.split('\n').length} lines)`);
