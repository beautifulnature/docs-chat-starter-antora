@echo off
REM Generate Antora diff pages between two git branches
REM Usage: generate-diff.bat [OLD_REF] [NEW_REF] [MODULES_DIR] [OUT_MODULE]
REM Defaults: v1 v2 modules redacted

setlocal enabledelayedexpansion

set OLD_REF=%1
set NEW_REF=%2
set MODULES_DIR=%3
set OUT_MODULE=%4

if "!OLD_REF!"=="" set OLD_REF=v1
if "!NEW_REF!"=="" set NEW_REF=v2
if "!MODULES_DIR!"=="" set MODULES_DIR=manual/modules
if "!OUT_MODULE!"=="" set OUT_MODULE=redacted

echo Generating Antora diffs from !OLD_REF! to !NEW_REF!...
echo.

node scripts/generate-antora-diff.js !OLD_REF! !NEW_REF! !MODULES_DIR! !OUT_MODULE!

if !errorlevel! neq 0 (
    echo.
    echo Error: Script failed with exit code !errorlevel!
    exit /b !errorlevel!
)

echo.
echo Done! Remember to add the redacted module to your manual/antora.yml:
echo.
echo   nav:
echo     - modules/ROOT/nav.adoc
echo     - modules/redacted/nav.adoc
echo.
