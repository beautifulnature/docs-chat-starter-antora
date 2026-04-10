# Antora Branch Migration Complete ✓

## Overview
The documentation has been successfully migrated from separate `manual-1.0/` and `manual-2.0/` directories to using git branches `v1` and `v2` with a unified `manual/` directory.

## Branch Structure

### Main Branch (main)
- **Purpose**: Configuration and build orchestration
- **Key Files**: `antora-playbook.yml`
- **Status**: All build scripts updated to use branch-based sources

### v1 Branch (v1)
- **Version**: 1.0
- **Content**: `/manual/` directory (copied from `manual-1.0/`)
- **Antora Config**: `manual/antora.yml` with `version: 1.0`
- **Last Commit**: `Initial manual v1 (version 1.0)`

### v2 Branch (v2)
- **Version**: 2.0
- **Content**: `/manual/` directory (copied from `manual-2.0/`)
- **Antora Config**: `manual/antora.yml` with `version: 2.0`
- **Last Commit**: `Setup manual directory with version 2.0 for v2 branch`

## Antora Playbook Configuration

The `antora-playbook.yml` has been updated to source from branches:

```yaml
content:
  sources:
    - url: .
      branches: [v1, v2]
      start_path: manual
```

This configuration tells Antora to:
- Look for content in the local repository (url: .)
- Use `v1` and `v2` branches
- Within each branch, look for the `manual/` directory as the documentation root

## Generated Site Structure

When Antora builds, the output site will have:

```
site/
├── manual/
│   ├── 1.0/        (from v1 branch)
│   │   ├── index.html
│   │   ├── pages/
│   │   └── ...
│   ├── 2.0/        (from v2 branch)
│   │   ├── index.html
│   │   ├── pages/
│   │   └── ...
│   └── index.html (version selector)
└── ...
```

## File Locations

| Item | Location |
|------|----------|
| Build Config | `antora/antora-playbook.yml` |
| Scripts | `antora/scripts/` |
| Diff Generator | `antora/scripts/generate-antora-diff.js` |
| UI Bundle | `antora/ui/ui-bundle.zip` |
| Supplemental UI | `antora/supplemental-ui/` |

## Diff Generator Setup

The diff generator is now available in `antora/scripts/`:
- `generate-antora-diff.js` - Main Node.js script
- `generate-diff.ps1` - PowerShell wrapper
- `generate-diff.bat` - Batch script wrapper
- `GENERATE-ANTORA-DIFF.md` - Full documentation

### Usage

```powershell
cd antora
.\scripts\generate-diff.ps1
```

This will generate diff pages showing changes between v1 and v2 in `manual/modules/redacted/`.

## Building the Site

```bash
cd antora
antora antora-playbook.yml
```

This will generate the documentation site at `antora/build/site/` with both versions (1.0 and 2.0).

## Migration Notes

- ✅ `manual-1.0/` and `manual-2.0/` directories remain for reference but are no longer used by Antora
- ✅ Each branch has its own clean `/manual/` directory structure
- ✅ Version management is now handled per-branch
- ✅ Diff generation tracks changes between versions automatically
- ✅ All build scripts in `antora/scripts/` configured for branch-based workflow

## Next Steps (Optional)

1. **Clean up old directories** (when ready):
   ```bash
   cd antora
   rm manual-1.0/
   rm manual-2.0/
   ```

2. **Generate diffs**:
   ```bash
   cd antora
   npm run generate-diff
   # or
   .\scripts\generate-diff.ps1
   ```

3. **Integrate diff module** (if using diff generator):
   - Run diff generator
   - Add to `manual/antora.yml`:
     ```yaml
     nav:
       - modules/ROOT/nav.adoc
       - modules/redacted/nav.adoc  # ← diff pages
     ```

## Verification Commands

```bash
# Check branch structure
git branch -a

# View branch content
git ls-tree v1 manual/
git ls-tree v2 manual/

# Check branch versions
git show v1:manual/antora.yml
git show v2:manual/antora.yml

# Verify playbook config
cat antora/antora-playbook.yml
```
