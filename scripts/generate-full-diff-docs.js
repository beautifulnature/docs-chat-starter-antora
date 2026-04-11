const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to get all .adoc files in a branch
function getAdocFiles(branch) {
  const files = execSync(`git ls-tree -r --name-only ${branch} -- manual/modules/ROOT/pages/`, { encoding: 'utf8' })
    .split('\n')
    .filter(f => f.endsWith('.adoc'));
  return new Set(files);
}

// Helper to get file content from a branch
function getFileContent(branch, file) {
  try {
    return execSync(`git show ${branch}:${file}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

// Use diff-match-patch for inline markup on v2 base
const DiffMatchPatch = require('diff-match-patch');

function getUnifiedDiff(v1Content, v2Content) {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(v1Content, v2Content);
  dmp.diff_cleanupSemantic(diffs);
  let result = '';
  for (const [op, data] of diffs) {
    if (op === DiffMatchPatch.DIFF_INSERT) {
      result += `[green]#${data}#`;
    } else if (op === DiffMatchPatch.DIFF_DELETE) {
      // Do not show deletions in v2 base, but you can optionally show as strike-through at the right place
      // result += `[line-through red]#${data}#`;
      // For true v2 base, skip
    } else {
      result += data;
    }
  }
  return result;
}

function generateFullDiffDocs() {
  const v1Files = getAdocFiles('v1');
  const v2Files = getAdocFiles('v2');
  const allFiles = new Set([...v1Files, ...v2Files]);
  const outputDir = path.join(__dirname, '..', 'manual', 'modules', 'ROOT', 'pages');

  allFiles.forEach(file => {
    const fileName = path.basename(file);
    const v1Content = getFileContent('v1', file) || '';
    const v2Content = getFileContent('v2', file) || '';
    const outputPath = path.join(outputDir, fileName);

    if (v2Content) {
      // Use v2 as base, apply diff markup for changes
      const unified = getUnifiedDiff(v1Content, v2Content);
      fs.writeFileSync(outputPath, unified);
      console.log(`Generated v2-diff for: ${fileName}`);
    } else if (v1Content) {
      // Only in v1: mark as deleted
      fs.writeFileSync(outputPath, `// [line-through red]#This page was deleted in v2.#\n`);
      console.log(`Marked deleted: ${fileName}`);
    }
  });
}

generateFullDiffDocs();
