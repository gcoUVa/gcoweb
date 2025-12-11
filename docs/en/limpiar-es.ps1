# Archivo a modificar
$FilePath = "index.html"

if (-not (Test-Path $FilePath)) {
    Write-Host "ERROR: No se encontró index.html en esta carpeta." -ForegroundColor Red
    exit 1
}

$startMarker = '<div class="quarto-listing quarto-listing-container-grid" id="listing-research">'
$endMarker   = '<!-- /content -->'

# Leer archivo completo
$linesArr = Get-Content -Encoding UTF8 $FilePath

# Buscar líneas exactas
$startLine = ($linesArr | Select-String -SimpleMatch $startMarker).LineNumber - 1
$endLine   = ($linesArr | Select-String -SimpleMatch $endMarker).LineNumber - 1

if ($startLine -lt 0) {
    Write-Host "ERROR: No se encontró el bloque de inicio." -ForegroundColor Red
    exit 1
}
if ($endLine -lt 0) {
    Write-Host "ERROR: No se encontró el marcador <!-- /content -->." -ForegroundColor Red
    exit 1
}
if ($endLine -le $startLine) {
    Write-Host "ERROR: Marcadores en orden incorrecto." -ForegroundColor Red
    exit 1
}

# Partes que se conservan
$before = $linesArr[0 .. ($startLine - 1)]
$after  = $linesArr[$endLine .. ($linesArr.Count - 1)]

# Verificación de coherencia de divs antes del marcador final
$checkText = ($before + $after[0]) -join "`n"

$openCount  = ([regex]::Matches($checkText, "<div(\s|>)")).Count + 1
$closeCount = ([regex]::Matches($checkText, "</div>")).Count

if ($openCount -ne $closeCount) {
    Write-Host "AVISO: incoherencia en <div> antes del marcador:" -ForegroundColor Yellow
    Write-Host "  abiertos: $openCount"
    Write-Host "  cerrados: $closeCount"
    Write-Host "NO se modifica el archivo." -ForegroundColor Yellow
    exit 1
}

# Guardar
($before + $after) -join "`n" | Set-Content -Encoding UTF8 $FilePath

Write-Host "Bloque eliminado correctamente. Estructura HTML consistente." -ForegroundColor Green
