# Gera listas de apenas nomes e apenas telefones para todas as companhias
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

$contacts = @()

for ($i = 0; $i -lt $totalRecords; $i++) {
    $base = $startIdx + ($i * 14)
    $id      = $lines[$base].Trim()
    $nome    = $lines[$base + 1].Trim()
    $telRaw  = $lines[$base + 4].Trim()
    $cia     = $lines[$base + 6].Trim()
    $grad    = $lines[$base + 7].Trim()
    $guerra  = $lines[$base + 9].Trim()

    if ($grad -match 'n.?o informad') { $grad = "" }
    if ($guerra -match 'n.?o informad') { $guerra = "" }

    $telFmt  = Format-Phone $telRaw
    $telDial = Format-Phone-Dialable $telRaw

    $contacts += [PSCustomObject]@{
        ID          = $id
        Nome        = $nome
        Guerra      = $guerra
        Graduacao   = $grad
        Companhia   = if ($cia) { $cia } else { "Outras" }
        Telefone    = $telFmt
        TelefoneDig = $telDial
    }
}

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
$outDir = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\exportados_por_companhia"

# 1. Arquivos Globais (Todos os 658)
$nomesTodos = $contacts | ForEach-Object { if ($_.Graduacao) { "$($_.Graduacao) $($_.Nome)" } else { $_.Nome } }
[System.IO.File]::WriteAllLines((Join-Path $outDir "TODOS_apenas_nomes.txt"), $nomesTodos, $utf8Bom)

$telsTodosFmt = $contacts | ForEach-Object { $_.Telefone } | Where-Object { $_ }
[System.IO.File]::WriteAllLines((Join-Path $outDir "TODOS_apenas_telefones_formatados.txt"), $telsTodosFmt, $utf8Bom)

$telsTodosDig = $contacts | ForEach-Object { $_.TelefoneDig } | Where-Object { $_ }
[System.IO.File]::WriteAllLines((Join-Path $outDir "TODOS_apenas_telefones_digitos_whatsapp.txt"), $telsTodosDig, $utf8Bom)

$nomeETelTodos = $contacts | ForEach-Object { 
    $n = if ($_.Graduacao) { "$($_.Graduacao) $($_.Nome)" } else { $_.Nome }
    if ($_.Guerra) { $n += " ($($_.Guerra))" }
    "$n - $($_.Telefone)"
}
[System.IO.File]::WriteAllLines((Join-Path $outDir "TODOS_nome_e_telefone.txt"), $nomeETelTodos, $utf8Bom)

# 2. Arquivos por Companhia
$ciasDef = @(
    @{ Pattern = '^1.? Cia Eng'; Slug = "1_Cia_Eng_Cmb_Bld" },
    @{ Pattern = '^2.? Cia Eng'; Slug = "2_Cia_Eng_Cmb_Bld" },
    @{ Pattern = 'CEP';          Slug = "Cia_Eng_Pontes_CEP" },
    @{ Pattern = 'CCAp';         Slug = "Cia_Cmdo_e_Apoio_CCAp" },
    @{ Pattern = 'Estado Maior'; Slug = "Estado_Maior" },
    @{ Pattern = 'NPOR';         Slug = "NPOR" }
)

foreach ($item in $ciasDef) {
    $slug = $item.Slug
    $pat = $item.Pattern
    $lista = $contacts | Where-Object { $_.Companhia -match $pat }

    $nomes = $lista | ForEach-Object { if ($_.Graduacao) { "$($_.Graduacao) $($_.Nome)" } else { $_.Nome } }
    [System.IO.File]::WriteAllLines((Join-Path $outDir "${slug}_apenas_nomes.txt"), $nomes, $utf8Bom)

    $telsFmt = $lista | ForEach-Object { $_.Telefone }
    [System.IO.File]::WriteAllLines((Join-Path $outDir "${slug}_apenas_telefones.txt"), $telsFmt, $utf8Bom)

    $nomeETel = $lista | ForEach-Object { 
        $n = if ($_.Graduacao) { "$($_.Graduacao) $($_.Nome)" } else { $_.Nome }
        if ($_.Guerra) { $n += " ($($_.Guerra))" }
        "$n - $($_.Telefone)"
    }
    [System.IO.File]::WriteAllLines((Join-Path $outDir "${slug}_nome_e_telefone.txt"), $nomeETel, $utf8Bom)

    Write-Output "[$($lista.Count) integrantes] Gerados TXTs para $slug"
}
