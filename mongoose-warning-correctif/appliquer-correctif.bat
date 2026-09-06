@echo off
setlocal EnableExtensions

REM Le script est dans :
REM PacteDuChene\mongoose-warning-correctif\
REM Le dossier parent est donc directement la racine du projet.

cd /d "%~dp0\.."

echo.
echo ============================================
echo  Correctif Mongoose - option "new: true"
echo ============================================
echo.
echo Racine du projet :
echo %CD%
echo.

if not exist "backend\src" (
    echo ERREUR : le dossier "backend\src" est introuvable.
    echo.
    echo Verifie que le dossier "mongoose-warning-correctif"
    echo se trouve bien directement dans "PacteDuChene".
    echo.
    pause
    exit /b 1
)

REM Cree un nom de sauvegarde robuste independant du format de date Windows.
for /f "delims=" %%I in ('powershell -NoProfile -Command "(Get-Date).ToString('yyyyMMdd_HHmmss')"') do set "STAMP=%%I"

set "BACKUP=backend\src_backup_mongoose_%STAMP%"

echo Creation de la sauvegarde :
echo %BACKUP%
echo.

xcopy /E /I /Q /Y "backend\src" "%BACKUP%" >nul
if errorlevel 1 (
    echo.
    echo ERREUR : impossible de creer la sauvegarde.
    echo Aucun correctif n'a ete applique.
    echo.
    pause
    exit /b 1
)

echo Sauvegarde creee.
echo.
echo Recherche et remplacement de "new: true"...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = Join-Path (Get-Location) 'backend\src';" ^
  "$files = Get-ChildItem -Path $root -Recurse -Filter *.ts -File;" ^
  "$count = 0;" ^
  "foreach ($file in $files) {" ^
  "  $text = [System.IO.File]::ReadAllText($file.FullName);" ^
  "  $updated = [regex]::Replace($text, '\bnew\s*:\s*true\b', 'returnDocument: ""after""');" ^
  "  if ($updated -ne $text) {" ^
  "    [System.IO.File]::WriteAllText($file.FullName, $updated, [System.Text.UTF8Encoding]::new($false));" ^
  "    $count++;" ^
  "    Write-Host ('  Modifie : ' + $file.FullName);" ^
  "  }" ^
  "}" ^
  "Write-Host (''); Write-Host ('Fichiers modifies : ' + $count);"

if errorlevel 1 (
    echo.
    echo ERREUR pendant le correctif.
    echo La sauvegarde reste disponible ici :
    echo %BACKUP%
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Correctif termine
echo ============================================
echo.
echo Sauvegarde :
echo %BACKUP%
echo.
echo Tu peux maintenant lancer le backend avec :
echo cd "C:\Users\wariw\Desktop\Le Pacte\PacteDuChene\backend"
echo npm run dev
echo.
pause
