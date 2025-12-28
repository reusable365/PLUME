# ===================================================================
# Script PowerShell - Remplacement automatique des console.log
# ===================================================================
# Ce script remplace tous les console.log/error/warn par logger.log/error/warn
# dans les fichiers TypeScript et TSX du projet PLUME
#
# UTILISATION:
# 1. Ouvrez PowerShell dans le dossier racine du projet
# 2. Exécutez: .\cleanup-console-logs.ps1
# 3. Vérifiez les changements avec: git diff
# 4. Si tout est OK: git add . && git commit -m "Replace console.* with logger.*"
#
# NOTE: Ce script modifie les fichiers en place. 
# Assurez-vous d'avoir un backup (commit Git) avant de l'exécuter.
# ===================================================================

Write-Host "🧹 Nettoyage des console.log en cours..." -ForegroundColor Cyan
Write-Host ""

# Compteurs
$totalFiles = 0
$totalReplacements = 0

# Fonction pour traiter un fichier
function Replace-ConsoleStatements {
    param(
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    # Remplacement console.log → logger.log
    $pattern1 = 'console\.log\('
    $replacement1 = 'logger.log('
    $content = $content -replace $pattern1, $replacement1
    $count1 = ([regex]::Matches($originalContent, $pattern1)).Count
    $fileReplacements += $count1
    
    # Remplacement console.error → logger.error
    $pattern2 = 'console\.error\('
    $replacement2 = 'logger.error('
    $content = $content -replace $pattern2, $replacement2
    $count2 = ([regex]::Matches($originalContent, $pattern2)).Count
    $fileReplacements += $count2
    
    # Remplacement console.warn → logger.warn
    $pattern3 = 'console\.warn\('
    $replacement3 = 'logger.warn('
    $content = $content -replace $pattern3, $replacement3
    $count3 = ([regex]::Matches($originalContent, $pattern3)).Count
    $fileReplacements += $count3
    
    # Remplacement console.debug → logger.debug (optionnel)
    $pattern4 = 'console\.debug\('
    $replacement4 = 'logger.debug('
    $content = $content -replace $pattern4, $replacement4
    $count4 = ([regex]::Matches($originalContent, $pattern4)).Count
    $fileReplacements += $count4
    
    # Sauvegarder seulement si des changements ont été faits
    if ($content -ne $originalContent) {
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ $FilePath - $fileReplacements remplacements" -ForegroundColor Green
        return $fileReplacements
    }
    
    return 0
}

# Traiter tous les fichiers .ts et .tsx (sauf node_modules et dist)
$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse | Where-Object {
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch 'dist' -and
    $_.FullName -notmatch '.gemini' -and
    $_.FullName -notmatch 'logger.ts'  # Ne pas modifier le logger lui-même !
}

Write-Host "📁 Fichiers à traiter: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $totalFiles++
    $replacements = Replace-ConsoleStatements -FilePath $file.FullName
    $totalReplacements += $replacements
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ Nettoyage terminé !" -ForegroundColor Green
Write-Host "📊 Fichiers traités: $totalFiles" -ForegroundColor Yellow
Write-Host "🔄 Total remplacements: $totalReplacements" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ ÉTAPES SUIVANTES :" -ForegroundColor Magenta
Write-Host "1. Vérifiez les changements: git diff" -ForegroundColor White
Write-Host "2. Testez l'application: npm run dev" -ForegroundColor White
Write-Host "3. Commitez si tout est OK: git add . && git commit -m 'Replace console.* with logger.*'" -ForegroundColor White
Write-Host ""
