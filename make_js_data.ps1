# Gera o arquivo dados.js com os 658 integrantes
$rawPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt"
$lines = [System.IO.File]::ReadAllLines($rawPath, [System.Text.Encoding]::UTF8)

$startIdx = 3
$totalRecords = 658

function Format-Phone($raw) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return "" }
    $digits = ($raw -replace '\D', '')
    if ($digits.Length -eq 11) {
        $ddd = $digits.Substring(0, 2)
        $p1 = $digits.Substring(2, 5)
        $p2 = $digits.Substring(7, 4)
        return "($ddd) $p1-$p2"
    } elseif ($digits.Length -eq 10) {
        $ddd = $digits.Substring(0, 2)
        $p1 = $digits.Substring(2, 4)
        $p2 = $digits.Substring(6, 4)
        return "($ddd) $p1-$p2"
    }
    return $raw.Trim()
}

function Format-Phone-Dialable($raw) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return "" }
    $digits = ($raw -replace '\D', '')
    if ($digits.Length -eq 11 -or $digits.Length -eq 10) {
        return "55" + $digits
    }
    return $digits
}

function Clean-Field($val) {
    if ([string]::IsNullOrWhiteSpace($val)) { return "" }
    $t = $val.Trim()
    if ($t -match 'n.?o informad' -or $t -match '^Sem Nome$' -or $t -match '^nao informada$' -or $t -match '^nao@tenho$') {
        return ""
    }
    return $t
}

$contacts = @()

for ($i = 0; $i -lt $totalRecords; $i++) {
    $base = $startIdx + ($i * 14)
    $id      = $lines[$base].Trim()
    $nome    = $lines[$base + 1].Trim()
    $cpf     = Clean-Field $lines[$base + 2]
    $email   = Clean-Field $lines[$base + 3]
    $telRaw  = $lines[$base + 4].Trim()
    $nasc    = Clean-Field $lines[$base + 5]
    $cia     = Clean-Field $lines[$base + 6]
    $grad    = Clean-Field $lines[$base + 7]
    $ano     = Clean-Field $lines[$base + 8]
    $guerra  = Clean-Field $lines[$base + 9]
    $uf      = Clean-Field $lines[$base + 10]
    $cidade  = Clean-Field $lines[$base + 11]
    $bairro  = Clean-Field $lines[$base + 12]
    $rua     = Clean-Field $lines[$base + 13]

    $telFmt  = Format-Phone $telRaw
    $telDial = Format-Phone-Dialable $telRaw

    $addrParts = @()
    if ($rua) { $addrParts += $rua }
    if ($bairro) { $addrParts += "Bairro $bairro" }
    if ($cidade) { $addrParts += $cidade }
    if ($uf) { $addrParts += $uf }
    $enderecoCompleto = $addrParts -join " - "

    $contacts += [PSCustomObject]@{
        id          = [int]$id
        nome        = $nome
        guerra      = $guerra
        grad        = $grad
        cia         = if ($cia) { $cia } else { "Outras" }
        ano         = $ano
        tel         = $telFmt
        telDial     = $telDial
        email       = $email
        cpf         = $cpf
        nasc        = $nasc
        rua         = $rua
        bairro      = $bairro
        cidade      = $cidade
        uf          = $uf
        endereco    = $enderecoCompleto
    }
}

$json = $contacts | ConvertTo-Json -Depth 3 -Compress
$jsContent = "window.VETERANOS_DATA = " + $json + ";"
$outPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\dados.js"
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($outPath, $jsContent, $utf8Bom)

Write-Output "dados.js gerado com sucesso. Contatos: $($contacts.Count)"
