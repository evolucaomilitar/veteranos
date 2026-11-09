$lines = Get-Content -Path "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt" -Encoding UTF8

$startIdx = 3
$totalRecords = 658
$anomalies = 0

for ($i = 0; $i -lt $totalRecords; $i++) {
    $base = $startIdx + ($i * 14)
    $id = $lines[$base]
    $nome = $lines[$base + 1]
    $cpf = $lines[$base + 2]
    $email = $lines[$base + 3]
    $tel = $lines[$base + 4]
    $nasc = $lines[$base + 5]
    $cia = $lines[$base + 6]
    $grad = $lines[$base + 7]
    $ano = $lines[$base + 8]
    $guerra = $lines[$base + 9]
    $uf = $lines[$base + 10]
    $cidade = $lines[$base + 11]
    $bairro = $lines[$base + 12]
    $rua = $lines[$base + 13]

    if ($id -notmatch '^\d+$') {
        Write-Output "Anomalia no registro $i (linha $base): ID '$id' nao e numerico! Nome: '$nome'"
        $anomalies++
    }
}

Write-Output "Verificacao concluida. Total de anomalias encontradas: $anomalies"
