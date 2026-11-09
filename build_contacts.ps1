# Script aperfeicoado para geracao dos contatos e planilhas dos Veteranos do 5o BE
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

    # Monta endereco
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
        Companhia        = $cia
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

Write-Output "Contatos processados: $($contacts.Count)"

$utf8Bom = New-Object System.Text.UTF8Encoding($true)

# 1. PLANILHA EXCEL CSV
$csvPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_planilha.csv"
$c_ced = [char]0x00E7
$a_til = [char]0x00E3
$o_ord = [char]0x00BA

$colGrad = "Gradua$($c_ced)$($a_til)o"
$colCia  = "Companhia (5$($o_ord) BE)"
$colAno  = "Ano Incorpora$($c_ced)$($a_til)o"
$colEnd  = "Endere$($c_ced)o Completo"

$csvHeader = "ID;Nome Completo;Nome de Guerra;$colGrad;$colCia;$colAno;Telefone;Telefone Internacional;E-mail;CPF;Data de Nascimento;Logradouro;Bairro;Cidade;UF;$colEnd"
$csvLines = New-Object System.Collections.Generic.List[string]
$csvLines.Add($csvHeader)

foreach ($c in $contacts) {
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
[System.IO.File]::WriteAllLines($csvPath, $csvLines, $utf8Bom)
Write-Output "1. Planilha CSV criada: $csvPath"

# 2. ARQUIVO VCARD 3.0 (.VCF)
$vcfPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_contatos.vcf"
$vcfBuilder = New-Object System.Text.StringBuilder

$be5_label = "5$($o_ord) BE"
$batalhao_label = "5$($o_ord) Batalh$($a_til)o de Engenharia de Combate Blindado (5$($o_ord) BE)"

foreach ($c in $contacts) {
    [void]$vcfBuilder.AppendLine("BEGIN:VCARD")
    [void]$vcfBuilder.AppendLine("VERSION:3.0")
    
    $displayName = $c.NomeCompleto
    if ($c.Graduacao) {
        $displayName = "$($c.Graduacao) $($c.NomeCompleto)"
    }
    [void]$vcfBuilder.AppendLine("FN:$displayName")
    
    $nameParts = $c.NomeCompleto.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    $firstName = ""
    $lastName = ""
    $middleNames = ""
    if ($nameParts.Length -eq 1) {
        $firstName = $nameParts[0]
    } elseif ($nameParts.Length -eq 2) {
        $firstName = $nameParts[0]
        $lastName = $nameParts[1]
    } else {
        $firstName = $nameParts[0]
        $lastName = $nameParts[-1]
        $middleList = @()
        for ($k = 1; $k -lt ($nameParts.Length - 1); $k++) {
            $middleList += $nameParts[$k]
        }
        $middleNames = $middleList -join " "
    }
    [void]$vcfBuilder.AppendLine("N:$lastName;$firstName;$middleNames;$($c.Graduacao);")

    if ($c.NomeGuerra) {
        [void]$vcfBuilder.AppendLine("NICKNAME:$($c.NomeGuerra)")
    }

    $org = $batalhao_label
    if ($c.Companhia) {
        $org = "$be5_label - $($c.Companhia)"
    }
    [void]$vcfBuilder.AppendLine("ORG:$org")

    if ($c.Graduacao) {
        [void]$vcfBuilder.AppendLine("TITLE:$($c.Graduacao)")
    }

    if ($c.TelefoneDial) {
        [void]$vcfBuilder.AppendLine("TEL;TYPE=CELL,VOICE:$($c.TelefoneDial)")
    } elseif ($c.TelefoneFormat) {
        [void]$vcfBuilder.AppendLine("TEL;TYPE=CELL,VOICE:$($c.TelefoneFormat)")
    }

    if ($c.Email) {
        [void]$vcfBuilder.AppendLine("EMAIL;TYPE=INTERNET,HOME:$($c.Email)")
    }

    if ($c.Logradouro -or $c.Cidade -or $c.Estado) {
        $street = $c.Logradouro
        if ($c.Bairro) {
            if ($street) { $street = "$street, $($c.Bairro)" } else { $street = $c.Bairro }
        }
        [void]$vcfBuilder.AppendLine("ADR;TYPE=HOME:;;$street;$($c.Cidade);$($c.Estado);;Brasil")
    }

    $notes = @()
    $notes += $batalhao_label
    if ($c.ID) { $notes += "ID Integrante: $($c.ID)" }
    if ($c.Graduacao) { $notes += "Gradua$($c_ced)$($a_til)o: $($c.Graduacao)" }
    if ($c.NomeGuerra) { $notes += "Nome de Guerra: $($c.NomeGuerra)" }
    if ($c.Companhia) { $notes += "Companhia: $($c.Companhia)" }
    if ($c.AnoIncorporacao) { $notes += "Ano Incorpora$($c_ced)$($a_til)o: $($c.AnoIncorporacao)" }
    if ($c.CPF) { $notes += "CPF: $($c.CPF)" }
    if ($c.DataNascimento) { $notes += "Nascimento: $($c.DataNascimento)" }
    $noteStr = $notes -join " \n "
    [void]$vcfBuilder.AppendLine("NOTE:$noteStr")

    [void]$vcfBuilder.AppendLine("END:VCARD")
}

[System.IO.File]::WriteAllText($vcfPath, $vcfBuilder.ToString(), $utf8Bom)
Write-Output "2. Arquivo vCard (.vcf) criado: $vcfPath"

# 3. GOOGLE CONTACTS CSV
$googleCsvPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_google_contacts.csv"
$gHeader = "Name,Given Name,Family Name,Additional Name,Nickname,Organization 1 - Name,Organization 1 - Title,E-mail 1 - Type,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value,Address 1 - Type,Address 1 - Formatted,Address 1 - Street,Address 1 - City,Address 1 - Region,Notes"
$gLines = New-Object System.Collections.Generic.List[string]
$gLines.Add($gHeader)

foreach ($c in $contacts) {
    $nameParts = $c.NomeCompleto.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    $firstName = ""
    $lastName = ""
    $middleNames = ""
    if ($nameParts.Length -eq 1) {
        $firstName = $nameParts[0]
    } elseif ($nameParts.Length -eq 2) {
        $firstName = $nameParts[0]
        $lastName = $nameParts[1]
    } else {
        $firstName = $nameParts[0]
        $lastName = $nameParts[-1]
        $middleList = @()
        for ($k = 1; $k -lt ($nameParts.Length - 1); $k++) {
            $middleList += $nameParts[$k]
        }
        $middleNames = $middleList -join " "
    }
    
    $displayName = $c.NomeCompleto
    if ($c.Graduacao) { $displayName = "$($c.Graduacao) $($c.NomeCompleto)" }

    $org = $be5_label
    if ($c.Companhia) { $org = "$be5_label - $($c.Companhia)" }

    $notes = "ID: $($c.ID); Guerra: $($c.NomeGuerra); Inc: $($c.AnoIncorporacao); Cia: $($c.Companhia)"

    $street = $c.Logradouro
    if ($c.Bairro) {
        if ($street) { $street = "$street, $($c.Bairro)" } else { $street = $c.Bairro }
    }

    $gRow = @(
        ('"' + ($displayName -replace '"', '""') + '"'),
        ('"' + ($firstName -replace '"', '""') + '"'),
        ('"' + ($lastName -replace '"', '""') + '"'),
        ('"' + ($middleNames -replace '"', '""') + '"'),
        ('"' + ($c.NomeGuerra -replace '"', '""') + '"'),
        ('"' + ($org -replace '"', '""') + '"'),
        ('"' + ($c.Graduacao -replace '"', '""') + '"'),
        "Home",
        ('"' + ($c.Email -replace '"', '""') + '"'),
        "Mobile",
        ('"' + $c.TelefoneDial + '"'),
        "Home",
        ('"' + ($c.EnderecoCompleto -replace '"', '""') + '"'),
        ('"' + ($street -replace '"', '""') + '"'),
        ('"' + ($c.Cidade -replace '"', '""') + '"'),
        ('"' + ($c.Estado -replace '"', '""') + '"'),
        ('"' + ($notes -replace '"', '""') + '"')
    ) -join ","
    $gLines.Add($gRow)
}

[System.IO.File]::WriteAllLines($googleCsvPath, $gLines, $utf8Bom)
Write-Output "3. Google Contacts CSV criado: $googleCsvPath"
