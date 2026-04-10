#!/usr/bin/env node
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OLD_REF = process.argv[2] || 'v1';
const NEW_REF = process.argv[3] || 'v2';
const MODULES_DIR = process.argv[4] || 'modules';
const OUT_MODULE = process.argv[5] || 'redacted';

function runGit(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, ...opts });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fileExistsInRef(ref, file) {
  const res = spawnSync('git', ['cat-file', '-e', `${ref}:${file}`], { stdio: 'ignore' });
  return res.status === 0;
}

function readFileFromRef(ref, file) {
  try {
    return runGit(['show', `${ref}:${file}`]);
  } catch {
    return '';
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrapToken(token, kind) {
  const escaped = escapeHtml(token);
  if (kind === 'del') return `<span class="diff-del">${escaped}</span>`;
  if (kind === 'add') return `<span class="diff-add">${escaped}</span>`;
  return escaped;
}

function renderLine(line) {
  if (!line) return '';
  const parts = [];
  let i = 0;
  while (i < line.length) {
    if (line.startsWith('[-', i)) {
      const end = line.indexOf('-]', i + 2);
      if (end !== -1) {
        parts.push(wrapToken(line.slice(i + 2, end), 'del'));
        i = end + 2;
        continue;
      }
    }
    if (line.startsWith('{+', i)) {
      const end = line.indexOf('+}', i + 2);
      if (end !== -1) {
        parts.push(wrapToken(line.slice(i + 2, end), 'add'));
        i = end + 2;
        continue;
      }
    }
    let nextDel = line.indexOf('[-', i);
    let nextAdd = line.indexOf('{+', i);
    if (nextDel === -1) nextDel = line.length;
    if (nextAdd === -1) nextAdd = line.length;
    const next = Math.min(nextDel, nextAdd);
    parts.push(wrapToken(line.slice(i, next), 'ctx'));
    i = next;
  }
  return parts.join('');
}

function splitPreserveNewlines(text) {
  const matches = text.match(/.*(?:\n|$)/g) || [];
  if (matches.length && matches[matches.length - 1] === '') matches.pop();
  return matches;
}

function buildHtmlDiff(oldText, newText) {
  const wd = runGit([
    'diff', '--no-index', '--word-diff=plain', '--word-diff-regex=\\S+|\\s+', '--unified=999999', '--',
    '/dev/null', '/dev/null'
  ], { input: '' });
  return wd;
}

function wordDiff(oldText, newText) {
  const tmpBase = fs.mkdtempSync(path.join(require('os').tmpdir(), 'antora-redacted-'));
  const oldFile = path.join(tmpBase, 'old.txt');
  const newFile = path.join(tmpBase, 'new.txt');
  fs.writeFileSync(oldFile, oldText, 'utf8');
  fs.writeFileSync(newFile, newText, 'utf8');
  try {
    return runGit([
      'diff', '--no-index', '--word-diff=plain', '--word-diff-regex=\\S+|\\s+', '--unified=999999', '--', oldFile, newFile
    ]);
  } catch (e) {
    return e.stdout || '';
  } finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }
}

function extractBody(diffText) {
  return diffText
    .split('\n')
    .filter(line => !line.startsWith('diff --git ') && !line.startsWith('index ') && !line.startsWith('--- ') && !line.startsWith('+++ ') && !line.startsWith('@@ '))
    .join('\n');
}

function buildAdocPage(relFile, oldRef, newRef, oldText, newText) {
  const raw = extractBody(wordDiff(oldText, newText));
  const lines = splitPreserveNewlines(raw);
  const htmlLines = lines.map(renderLine).join('');
  const title = path.basename(relFile, path.extname(relFile)).replace(/[-_]/g, ' ');
  return `= Diff: ${title}\n:page-role: diff-page\n:page-pagination:\n\nThis page shows changes in *${relFile}* from *${oldRef}* to *${newRef}*.\n\n[.diff-legend]\n++++\n<div class="diff-legend"><span class="diff-del">Deleted</span> <span class="diff-add">Added</span></div>\n++++\n\n++++\n<style>\n.diff-block { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.6; border: 1px solid #d7d7d7; padding: 1rem; border-radius: 6px; background: #fcfcfc; }\n.diff-del { color: #b42318; text-decoration: line-through; background: #fef3f2; }\n.diff-add { color: #067647; background: #ecfdf3; font-weight: 600; }\n.diff-legend { margin: 0.5rem 0 1rem; display: flex; gap: 1rem; flex-wrap: wrap; }\n</style>\n<div class="diff-block">${htmlLines}</div>\n++++\n`;
}

function main() {
  const changed = runGit(['diff', '--name-only', `${OLD_REF}..${NEW_REF}`, '--', MODULES_DIR])
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(f => f.endsWith('.adoc'));

  if (!changed.length) {
    console.log('No changed .adoc files found.');
    return;
  }

  let navEntries = [];

  for (const file of changed) {
    const parts = file.split('/');
    const moduleIndex = parts.indexOf('modules');
    if (moduleIndex === -1 || parts.length < moduleIndex + 4) continue;
    const componentRoot = parts.slice(0, moduleIndex).join('/');
    const originalModule = parts[moduleIndex + 1];
    const family = parts[moduleIndex + 2];
    const remainder = parts.slice(moduleIndex + 3).join('/');
    const outDir = path.join(componentRoot, 'modules', OUT_MODULE, family, path.dirname(remainder));
    ensureDir(outDir);

    const outName = path.basename(remainder, '.adoc') + '-diff.adoc';
    const outPath = path.join(outDir, outName);

    const oldText = fileExistsInRef(OLD_REF, file) ? readFileFromRef(OLD_REF, file) : '';
    const newText = fileExistsInRef(NEW_REF, file) ? readFileFromRef(NEW_REF, file) : '';
    const adoc = buildAdocPage(file, OLD_REF, NEW_REF, oldText, newText);
    fs.writeFileSync(outPath, adoc, 'utf8');

    if (family === 'pages') {
      const navTarget = `xref:${outName}[${path.basename(remainder, '.adoc')}]`;
      navEntries.push(navTarget);
    }
  }

  const sampleChanged = changed[0];
  const compRoot = sampleChanged.split('/').slice(0, sampleChanged.split('/').indexOf('modules')).join('/');
  const navDir = path.join(compRoot, 'modules', OUT_MODULE);
  ensureDir(path.join(navDir, 'partials'));
  fs.writeFileSync(path.join(navDir, 'nav.adoc'), '* Diff Pages\n' + navEntries.sort().map(e => `** ${e}`).join('\n') + '\n', 'utf8');

  const antoraYml = path.join(compRoot, 'antora.yml');
  if (fs.existsSync(antoraYml)) {
    console.log(`Generated diff pages. Add modules/${OUT_MODULE}/nav.adoc to nav in ${antoraYml} if needed.`);
  }
  console.log(`Generated ${navEntries.length} diff page(s) under modules/${OUT_MODULE}/.`);
}

main();
