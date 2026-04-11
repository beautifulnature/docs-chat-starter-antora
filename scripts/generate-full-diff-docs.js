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

function generateFullDiffDocs() {
  const v1Files = getAdocFiles('v1');
  const v2Files = getAdocFiles('v2');
  const allFiles = new Set([...v1Files, ...v2Files]);
  const outputDir = path.join(__dirname, '..', 'manual', 'modules', 'ROOT', 'pages');

  allFiles.forEach(file => {
    const fileName = path.basename(file);
    const v1Content = getFileContent('v1', file);
    const v2Content = getFileContent('v2', file);
    const outputPath = path.join(outputDir, fileName);

    if (v1Content && v2Content) {
      // Both exist: generate diff
      const diff = execSync(`git diff --no-index --word-diff=plain <(echo "${v1Content.replace(/"/g, '\\"')}") <(echo "${v2Content.replace(/"/g, '\\"')}")`, { encoding: 'utf8', shell: '/bin/bash' });
      let formattedDiff = diff
        .replace(/\[-([^\]]+)\]/g, '[line-through red]#$1#')
        .replace(/\{\+([^\}]+)\}/g, '[green]#$1#');
      fs.writeFileSync(outputPath, formattedDiff);
      console.log(`Generated diff for: ${fileName}`);
    } else if (v2Content) {
      // Only in v2: copy as-is
      fs.writeFileSync(outputPath, v2Content);
      console.log(`Copied v2 only: ${fileName}`);
    } else if (v1Content) {
      // Only in v1: mark as deleted
      fs.writeFileSync(outputPath, `// [line-through red]#This page was deleted in v2.#\n`);
      console.log(`Marked deleted: ${fileName}`);
    }
  });
}

generateFullDiffDocs();
