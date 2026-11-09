# Script para gerar planilhas e arquivos VCF separados para cada Companhia
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
        return "+55" + $digits
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
        ID               = $id
        NomeCompleto     = $nome
        NomeGuerra       = $guerra
        Graduacao        = $grad
        Companhia        = if ($cia) { $cia } else { "Outras" }
        AnoIncorporacao  = $ano
        TelefoneFormat   = $telFmt
        TelefoneDial     = $telDial
        Email            = $email
        CPF              = $cpf
        DataNascimento   = $nasc
        Logradouro       = $rua
        Bairro           = $bairro
        Cidade           = $cidade
        Estado           = $uf
        EnderecoCompleto = $enderecoCompleto
    }
}

$utf8Bom = New-Object System.Text.UTF8Encoding($true)

$ciasDef = @(
    @{ Pattern = '^1.? Cia Eng'; Slug = "1_Cia_Eng_Cmb_Bld"; Label = "1ª Cia Eng Cmb Bld" },
    @{ Pattern = '^2.? Cia Eng'; Slug = "2_Cia_Eng_Cmb_Bld"; Label = "2ª Cia Eng Cmb Bld" },
    @{ Pattern = 'CEP';          Slug = "Cia_Eng_Pontes_CEP"; Label = "Cia Eng Pontes (CEP)" },
    @{ Pattern = 'CCAp';         Slug = "Cia_Cmdo_e_Apoio_CCAp"; Label = "Cia Cmdo e Ap (CCAp)" },
    @{ Pattern = 'Estado Maior'; Slug = "Estado_Maior"; Label = "Estado-Maior" },
    @{ Pattern = 'NPOR';         Slug = "NPOR"; Label = "NPOR" }
)

$c_ced = [char]0x00E7
$a_til = [char]0x00E3
$o_ord = [char]0x00BA
$csvHeader = "ID;Nome Completo;Nome de Guerra;Gradua$($c_ced)$($a_til)o;Companhia (5$($o_ord) BE);Ano Incorpora$($c_ced)$($a_til)o;Telefone;Telefone Internacional;E-mail;CPF;Data de Nascimento;Logradouro;Bairro;Cidade;UF;Endere$($c_ced)o Completo"

$outDir = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\exportados_por_companhia"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

foreach ($item in $ciasDef) {
    $slug = $item.Slug
    $pat = $item.Pattern
    $lista = $contacts | Where-Object { $_.Companhia -match $pat }

    # 1. CSV
    $csvLines = New-Object System.Collections.Generic.List[string]
    $csvLines.Add($csvHeader)
    foreach ($c in $lista) {
        $row = @(
            $c.ID,
            ('"' + ($c.NomeCompleto -replace '"', '""') + '"'),
            ('"' + ($c.NomeGuerra -replace '"', '""') + '"'),
            ('"' + ($c.Graduacao -replace '"', '""') + '"'),
            ('"' + ($c.Companhia -replace '"', '""') + '"'),
            $c.AnoIncorporacao,
            ('"' + $c.TelefoneFormat + '"'),
            ('"' + $c.TelefoneDial + '"'),
            ('"' + ($c.Email -replace '"', '""') + '"'),
            ('"' + $c.CPF + '"'),
            $c.DataNascimento,
            ('"' + ($c.Logradouro -replace '"', '""') + '"'),
            ('"' + ($c.Bairro -replace '"', '""') + '"'),
            ('"' + ($c.Cidade -replace '"', '""') + '"'),
            ('"' + ($c.Estado -replace '"', '""') + '"'),
            ('"' + ($c.EnderecoCompleto -replace '"', '""') + '"')
        ) -join ";"
        $csvLines.Add($row)
    }
    $csvFile = Join-Path $outDir "$slug.csv"
    [System.IO.File]::WriteAllLines($csvFile, $csvLines, $utf8Bom)

    # 2. VCF
    $vcfBuilder = New-Object System.Text.StringBuilder
    $batalhao_label = "5$($o_ord) Batalh$($a_til)o de Engenharia de Combate Blindado (5$($o_ord) BE)"

    foreach ($c in $lista) {
        [void]$vcfBuilder.AppendLine("BEGIN:VCARD")
        [void]$vcfBuilder.AppendLine("VERSION:3.0")
        
        $displayName = if ($c.Graduacao) { "$($c.Graduacao) $($c.NomeCompleto)" } else { $c.NomeCompleto }
        [void]$vcfBuilder.AppendLine("FN:$displayName")
        
        $nameParts = $c.NomeCompleto.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        $firstName = if ($nameParts.Length -ge 1) { $nameParts[0] } else { "" }
        $lastName = if ($nameParts.Length -ge 2) { $nameParts[-1] } else { "" }
        $middleNames = if ($nameParts.Length -gt 2) { ($nameParts[1..($nameParts.Length - 2)]) -join " " } else { "" }
        [void]$vcfBuilder.AppendLine("N:$lastName;$firstName;$middleNames;$($c.Graduacao);")

        if ($c.NomeGuerra) { [void]$vcfBuilder.AppendLine("NICKNAME:$($c.NomeGuerra)") }

        $org = "5$($o_ord) BE - $($c.Companhia)"
        [void]$vcfBuilder.AppendLine("ORG:$org")
        if ($c.Graduacao) { [void]$vcfBuilder.AppendLine("TITLE:$($c.Graduacao)") }

        if ($c.TelefoneDial) {
            [void]$vcfBuilder.AppendLine("TEL;TYPE=CELL,VOICE:$($c.TelefoneDial)")
        } elseif ($c.TelefoneFormat) {
            [void]$vcfBuilder.AppendLine("TEL;TYPE=CELL,VOICE:$($c.TelefoneFormat)")
        }

        if ($c.Email) { [void]$vcfBuilder.AppendLine("EMAIL;TYPE=INTERNET,HOME:$($c.Email)") }

        if ($c.Logradouro -or $c.Cidade -or $c.Estado) {
            $street = $c.Logradouro
            if ($c.Bairro) { $street = if ($street) { "$street, $($c.Bairro)" } else { $c.Bairro } }
            [void]$vcfBuilder.AppendLine("ADR;TYPE=HOME:;;$street;$($c.Cidade);$($c.Estado);;Brasil")
        }

        $notes = @($batalhao_label)
        if ($c.ID) { $notes += "ID: $($c.ID)" }
        if ($c.Graduacao) { $notes += "Gradua$($c_ced)$($a_til)o: $($c.Graduacao)" }
        if ($c.NomeGuerra) { $notes += "Guerra: $($c.NomeGuerra)" }
        if ($c.Companhia) { $notes += "Companhia: $($c.Companhia)" }
        if ($c.AnoIncorporacao) { $notes += "Ano: $($c.AnoIncorporacao)" }
        if ($c.CPF) { $notes += "CPF: $($c.CPF)" }
        [void]$vcfBuilder.AppendLine("NOTE:$($notes -join ' \n ')")
        [void]$vcfBuilder.AppendLine("END:VCARD")
    }

    $vcfFile = Join-Path $outDir "$slug.vcf"
    [System.IO.File]::WriteAllText($vcfFile, $vcfBuilder.ToString(), $utf8Bom)

    Write-Output "[$($lista.Count) integrantes] Gerados: $slug.csv e $slug.vcf"
}
