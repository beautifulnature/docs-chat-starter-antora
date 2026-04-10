# Antora Diff Generator

This script generates word-level diff pages comparing two git branches for AsciiDoc files in your Antora documentation.

## Overview

The `generate-antora-diff.js` script:
- Compares two git branches (e.g., `v1` and `v2`)
- Identifies changed `.adoc` files in the `modules/` directory
- Generates corresponding diff pages with:
  - **Red strikethrough text** for deleted content
  - **Green highlighted text** for newly added content
  - **Word-level detail** (not just line-level)
- Creates them in a special `modules/redacted/` module
- Generates an auto-updated `nav.adoc` for easy navigation

## Setup

### Prerequisites
- Node.js installed
- Git repository with `v1` and `v2` branches
- Antora project with `manual/` directory containing `modules/` folders

### Installation

The script is located at:
```
antora/scripts/generate-antora-diff.js
```

## Usage

### Basic Usage (v1 → v2)
```bash
cd antora
node scripts/generate-antora-diff.js
```

### Custom Branches
```bash
node scripts/generate-antora-diff.js main develop
```

### Custom Output Module
```bash
node scripts/generate-antora-diff.js v1 v2 modules diff-compare
```

### Full Options
```bash
node scripts/generate-antora-diff.js OLD_REF NEW_REF MODULES_DIR OUT_MODULE
```

**Parameters:**
- `OLD_REF` - Source branch/ref (default: `v1`)
- `NEW_REF` - Target branch/ref (default: `v2`)
- `MODULES_DIR` - Directory to scan for changes (default: `modules`)
- `OUT_MODULE` - Output module name (default: `redacted`)

## Output

### Generated Files

**Structure:**
```
manual/modules/redacted/pages/
  ├── foo-diff.adoc
  ├── bar-diff.adoc
  └── ...
manual/modules/redacted/nav.adoc
```

### Example Generated Page

Each diff page includes:
- Front matter with `page-role: diff-page`
- Metadata showing which file and branches were compared
- Legend explaining diff colors
- Styled HTML showing word-level changes:
  - `[-deleted text-]` → red strikethrough
  - `{+added text+}` → green with background

### Navigation Integration

After running the script, add the redacted module to your `manual/antora.yml`:

```yaml
# manual/antora.yml
nav:
  - modules/ROOT/nav.adoc
  - modules/redacted/nav.adoc  # ← Add this line
```

## Example Workflow

1. Ensure you're on the `main` branch:
   ```bash
   cd antora
   git checkout main
   ```

2. Run the diff generator to compare `v1` and `v2`:
   ```bash
   node scripts/generate-antora-diff.js v1 v2
   ```

3. Update `manual/antora.yml` to include the redacted module nav

4. Rebuild your Antora site:
   ```bash
   antora antora-playbook.yml
   ```

5. View the generated diffs under "Diff Pages" in your docs

## How It Works

1. **Initialize**: Script accepts two git refs (branches/tags)
2. **Scan**: Runs `git diff --name-only OLD_REF..NEW_REF -- modules/` to find changed `.adoc` files
3. **Read**: For each changed file, reads both versions from git history
4. **Diff**: Generates word-level diff using `git diff --word-diff=plain`
5. **Generate**: Creates styled AsciiDoc pages with embedded HTML
6. **Navigate**: Builds a nav file with xref entries to all diff pages

## Styling

The generated pages include inline CSS that styles:
- `.diff-del` - Red text with strikethrough for deletions
- `.diff-add` - Green text with background for additions
- `.diff-block` - Monospace container with borders
- `.diff-legend` - Legend showing the styling

## Notes

- Only `.adoc` files are compared
- The script preserves directory structure (e.g., `pages/`, `concepts/`)
- Only `pages/` directory changes generate nav entries
- Output files are suffixed with `-diff.adoc`
- Running the script multiple times regenerates all diff pages (safe to re-run)
- The script runs from your antora directory

## Troubleshooting

**"No changed .adoc files found"**
- Check that branches exist: `git branch -a`
- Verify files are in `modules/` directory
- Check branch names match: `git diff --name-only v1..v2 -- modules/`

**Script not found**
- Ensure you're in the `antora/` directory
- Check file exists: `ls scripts/generate-antora-diff.js`

**Git command errors**
- Verify the repository is initialized: `git status`
- Check you have two branches to compare: `git branch`
