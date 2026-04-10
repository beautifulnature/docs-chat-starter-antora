# Generate Antora diff pages between two git branches
# Usage: .\generate-diff.ps1 [-OldRef 'v1'] [-NewRef 'v2'] [-ModulesDir 'modules'] [-OutModule 'redacted']

param(
    [string]$OldRef = 'v1',
    [string]$NewRef = 'v2',
    [string]$ModulesDir = 'manual/modules',
    [string]$OutModule = 'redacted'
)

Write-Host "Generating Antora diffs from $OldRef to $NewRef..." -ForegroundColor Cyan
Write-Host ""

& node scripts/generate-antora-diff.js $OldRef $NewRef $ModulesDir $OutModule

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Script failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done! Remember to add the redacted module to your manual/antora.yml:" -ForegroundColor Green
Write-Host ""
Write-Host "  nav:" -ForegroundColor Gray
Write-Host "    - modules/ROOT/nav.adoc" -ForegroundColor Gray
Write-Host "    - modules/redacted/nav.adoc" -ForegroundColor Yellow
Write-Host ""
