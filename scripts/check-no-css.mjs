// Fails when compiled CSS is committed again (docs/08-styles-and-scss.md, step 7).
// Styles are SCSS compiled by Next, so no tracked `.css` belongs under `src/`, and no
// `.css.map` belongs anywhere. Checks the git index (tracked and staged files), not the
// disk: an editor Sass watcher's output is git-ignored and does not fail the check.
import { execFileSync } from 'node:child_process';

let tracked;
try {
  // git pathspecs match `*` across directories, so `src/*.css` covers every depth
  tracked = execFileSync('git', ['ls-files', '-z', '--', 'src/*.css', '*.css.map'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch {
  console.log('check:css skipped: not a git checkout.');
  process.exit(0);
}

const files = tracked.split('\0').filter(Boolean);
if (files.length > 0) {
  console.error(
    'Compiled CSS is tracked by git; styles must stay SCSS (docs/08-styles-and-scss.md):'
  );
  for (const file of files) console.error(`  ${file}`);
  console.error('Remove them with `git rm --cached <file>`.');
  process.exit(1);
}
console.log('check:css: no compiled CSS is tracked.');
