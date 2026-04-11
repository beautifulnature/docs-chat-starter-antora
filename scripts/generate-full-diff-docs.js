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

// Helper to extract only the diff (additions and deletions) as a minimal diff-only AsciiDoc
function getDiffOnlyAdoc(v1Content, v2Content) {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(v1Content, v2Content);
  dmp.diff_cleanupSemantic(diffs);
  let result = '';
  for (const [op, data] of diffs) {
    if (op === DiffMatchPatch.DIFF_INSERT) {
      const match = data.match(/^(\s*)(.*?)(\s*)$/s);
      if (match) {
        const [, leading, core, trailing] = match;
        result += leading + '[green]#' + core + '#' + trailing;
      } else {
        result += '[green]#' + data + '#';
      }
    } else if (op === DiffMatchPatch.DIFF_DELETE) {
      const match = data.match(/^(\s*)(.*?)(\s*)$/s);
      if (match) {
        const [, leading, core, trailing] = match;
        result += leading + '[line-through.red]#' + core + '#' + trailing;
      } else {
        result += '[line-through.red]#' + data + '#';
      }
    }
    // Do not include unchanged text
  }
  return result.trim() ? result : null;
}

function getUnifiedDiff(v1Content, v2Content) {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(v1Content, v2Content);
  dmp.diff_cleanupSemantic(diffs);
  let result = '';
  for (const [op, data] of diffs) {
    if (op === DiffMatchPatch.DIFF_INSERT) {
      // Remove leading/trailing spaces inside the role markup, but preserve them outside
      const match = data.match(/^(\s*)(.*?)(\s*)$/s);
      if (match) {
        const [, leading, core, trailing] = match;
        result += leading + '[green]#' + core + '#' + trailing;
      } else {
        result += '[green]#' + data + '#';
      }
    } else if (op === DiffMatchPatch.DIFF_DELETE) {
      const match = data.match(/^(\s*)(.*?)(\s*)$/s);
      if (match) {
        const [, leading, core, trailing] = match;
        result += leading + '[line-through.red]#' + core + '#' + trailing;
      } else {
        result += '[line-through.red]#' + data + '#';
      }
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

  // For nav-redacted.adoc
  const redactedNavEntries = [];
  const redactedDir = path.join(outputDir, 'redacted');
  fs.mkdirSync(redactedDir, { recursive: true });

  allFiles.forEach(file => {
    const fileName = path.basename(file);
    const v1Content = getFileContent('v1', file) || '';
    const v2Content = getFileContent('v2', file) || '';
    const outputPath = path.join(outputDir, fileName);

    // Ensure output directory exists before writing
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    if (v2Content) {
      // Use v2 as base, apply diff markup for changes
      const unified = getUnifiedDiff(v1Content, v2Content);
      fs.writeFileSync(outputPath, unified);
      // Only generate redacted page if there is a diff
      if (v1Content !== v2Content) {
        const redactedPath = path.join(redactedDir, fileName);
        // Only include the file with leveloffset, do not append the diff content
        const includeLine = `include::../${fileName}[leveloffset=+1]\n`;
        fs.writeFileSync(redactedPath, includeLine);
        redactedNavEntries.push(`** xref:redacted/${fileName}[${fileName.replace('.adoc','')}]`);
        console.log(`Generated redacted full diff for: ${fileName}`);
      }
      console.log(`Generated v2-diff for: ${fileName}`);
    } else if (v1Content) {
      // Only in v1: mark as deleted
      fs.writeFileSync(outputPath, `// [line-through red]#This page was deleted in v2.#\n`);
      // Only generate redacted page if there was content in v1 (i.e., deleted)
      const redactedPath = path.join(redactedDir, fileName);
      const includeLine = `include::../${fileName}[leveloffset=+1]\n`;
      fs.writeFileSync(redactedPath, includeLine);
      redactedNavEntries.push(`** xref:redacted/${fileName}[${fileName.replace('.adoc','')}]`);
      console.log(`Marked deleted: ${fileName}`);
    }
  });

  // Write nav-redacted.adoc with a heading and all pages grouped
  const navPath = path.join(outputDir, '..', 'nav-redacted.adoc');
  const navHeader = '// This file is auto-generated. Do not edit manually.\n// Redacted Diff Navigation\n\n* Redacted Diff Pages\n';
  fs.writeFileSync(navPath, navHeader + redactedNavEntries.join('\n') + '\n');
  console.log('Updated nav-redacted.adoc with redacted diff entries.');
}

generateFullDiffDocs();
