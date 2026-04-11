const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateDiffPages() {
  const outputDir = path.join(__dirname, '..', 'manual', 'modules', 'ROOT', 'pages');

  // Get list of changed files
  const changedFiles = execSync('git diff --name-only v1..v2', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(file => file.startsWith('manual/') && file.endsWith('.adoc'));

  changedFiles.forEach(file => {
    const relativePath = path.relative('manual/modules/ROOT/pages', file);
    const outputPath = path.join(outputDir, relativePath.replace('.adoc', '-diff.adoc'));

    // Get diff
    const diff = execSync(`git diff v1..v2 -- "${file}"`, { encoding: 'utf8' });
    console.log(`Diff for ${file}:`, diff);

    // Convert to AsciiDoc format
    let formattedDiff = diff
      .split('\n')
      .filter(line => line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))
      .map(line => {
        if (line.startsWith('+')) {
          return `[green]#${line.substring(1)}#`;
        } else if (line.startsWith('-')) {
          return `[line-through red]#${line.substring(1)}#`;
        } else {
          return line.substring(1);
        }
      })
      .join('\n');

    // Create the diff page
    const pageContent = `= Diff: ${relativePath}

This page shows the differences between v1 and v2.

[source,diff]
----
${formattedDiff}
----

== Formatted View

${formattedDiff}
`;

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, pageContent);
    console.log(`Generated diff page: ${outputPath}`);
  });

  // Update nav.adoc to include diff pages
  const navPath = path.join(outputDir, '..', 'nav.adoc');
  let navContent = fs.readFileSync(navPath, 'utf8');
  navContent += '\n* Diff Pages\n** xref:categories-diff.adoc[Categories Diff]\n** xref:index-diff.adoc[Index Diff]\n';
  fs.writeFileSync(navPath, navContent);
}

generateDiffPages();
