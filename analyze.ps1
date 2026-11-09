$lines = Get-Content -Path "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt" -Encoding UTF8
Write-Output "Total de linhas: $($lines.Count)"
Write-Output "Primeiras 35 linhas:"
for ($i = 0; $i -lt [Math]::Min(35, $lines.Count); $i++) {
    Write-Output "[$i]: $($lines[$i])"
}
Write-Output "Ultimas 20 linhas:"
for ($i = [Math]::Max(0, $lines.Count - 20); $i -lt $lines.Count; $i++) {
    Write-Output "[$i]: $($lines[$i])"
}
