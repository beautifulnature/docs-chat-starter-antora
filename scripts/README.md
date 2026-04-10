# Quick Reference: Generate Diff Pages

## One-Liner (Windows PowerShell)
```powershell
cd antora; .\scripts\generate-diff.ps1
```

## One-Liner (Linux/Mac)
```bash
cd antora && node scripts/generate-antora-diff.js
```

## Using npm (if package.json exists)
```bash
cd antora
npm run generate-diff
```

## With Custom Branches
```powershell
# PowerShell
.\scripts\generate-diff.ps1 -OldRef 'main' -NewRef 'develop'

# Node
node scripts/generate-antora-diff.js main develop
```

## What Happens
1. ✅ Finds all changed `.adoc` files between branches
2. ✅ Generates `modules/redacted/pages/*-diff.adoc` files
3. ✅ Creates `modules/redacted/nav.adoc` with all diff pages
4. ✅ Shows styling legend (red for deleted, green for added)

## Next Steps
1. Add to `manual/antora.yml`:
   ```yaml
   nav:
     - modules/ROOT/nav.adoc
     - modules/redacted/nav.adoc  # ← Add this
   ```

2. Rebuild docs:
   ```bash
   antora antora-playbook.yml
   ```

3. View diffs under "Diff Pages" in the generated site

---

See [GENERATE-ANTORA-DIFF.md](./GENERATE-ANTORA-DIFF.md) for full documentation.
