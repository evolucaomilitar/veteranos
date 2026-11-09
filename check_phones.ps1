$lines = Get-Content -Path "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt" -Encoding UTF8

$phones = @()
for ($i = 0; $i -lt 658; $i++) {
    $base = 3 + ($i * 14)
    $tel = $lines[$base + 4]
    $phones += $tel
}

$rawLengths = $phones | ForEach-Object { ($_.Trim() -replace '\D', '').Length } | Group-Object | Sort-Object Name
Write-Output "Distribuicao de quantidade de digitos nos telefones:"
$rawLengths | ForEach-Object { "$($_.Name) digitos: $($_.Count) ocorrencias" }

Write-Output "`nExemplos de telefones:"
$phones[0..15] | ForEach-Object { $_ }
