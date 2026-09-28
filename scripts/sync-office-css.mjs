// Compiles src/styles/main.scss and splices only the blocks listed in BLOCKS
// (cars-page heading and office rows, wallet sheets, wallet panel) into
// src/styles/main.css, leaving the rest of the committed CSS byte identical.
// The local dart-sass is newer than the one that generated the committed
// main.css and rewrites ~800 lines of Bootstrap rgb() custom properties, which
// buries the real change in review noise.
//
// Usage: node scripts/sync-office-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as sass from 'sass';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scssPath = path.join(root, 'src/styles/main.scss');
const cssPath = path.join(root, 'src/styles/main.css');

/** Each block runs from its `start` selector up to (not including) `end`. */
const BLOCKS = [
  { name: 'office-row', start: '.car-page {', end: '.filter_search {' },
  { name: 'wallet-sheets', start: '.wallet_topup_modal {', end: '.wallet_result_modal {' },
  { name: 'wallet-panel', start: '.account-panel {', end: '.account-panel .notifications_header {' },
];

function compile() {
  return sass.compile(scssPath, {
    loadPaths: [path.join(root, 'node_modules')],
    style: 'expanded',
    // bootstrap's @import and global color functions are deprecated upstream
    logger: sass.Logger.silent,
  }).css;
}

/** The compiled block, normalised to LF. */
function extractBlock(css, { start: startMarker, end: endMarker }) {
  const normalised = css.replace(/\r\n/g, '\n');
  const start = normalised.indexOf(startMarker);
  const end = normalised.indexOf(endMarker, start);

  if (start < 0 || end < 0) throw new Error(`could not locate ${startMarker} / ${endMarker}`);

  return normalised.slice(start, end).replace(/^\n+/, '').replace(/\n+$/, '');
}

/** Swaps an existing block for a new one, tolerating either line ending. */
function replaceBlock(file, oldBlock, newBlock, name) {
  const eol = file.includes('\r\n') ? '\r\n' : '\n';
  const from = oldBlock.split('\n').join(eol);
  const to = newBlock.split('\n').join(eol);

  const start = file.indexOf(from);

  if (start < 0) throw new Error(`existing ${name} block not found in main.css`);

  return file.slice(0, start) + to + file.slice(start + from.length);
}

const compiled = compile();
let next = readFileSync(cssPath, 'utf8');

for (const block of BLOCKS) {
  const fresh = extractBlock(compiled, block);
  next = replaceBlock(next, extractBlock(next, block), fresh, block.name);
  console.log(`synced ${block.name} css (${fresh.split('\n').length} lines)`);
}

writeFileSync(cssPath, next);
