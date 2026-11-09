$scriptContent = @'
# Converter com tratamento robusto de texto e codificacao
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
    # Identifica qualquer variante de "nao informado", "Sem Nome", etc.
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

    # Monta endereco formatado de forma limpa
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

Write-Output "Total de contatos processados: $($contacts.Count)"

$utf8Bom = New-Object System.Text.UTF8Encoding($true)

# 1. Gerar Planilha Excel CSV (delimitador ';' com UTF8 BOM)
$csvPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_planilha.csv"
$csvHeader = "ID;Nome Completo;Nome de Guerra;Graduação;Companhia (5º BE);Ano Incorporação;Telefone;Telefone Internacional;E-mail;CPF;Data de Nascimento;Logradouro;Bairro;Cidade;UF;Endereço Completo"
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
Write-Output "Planilha CSV salva com sucesso: $csvPath"

# 2. Gerar Arquivo vCard 3.0 (.vcf)
$vcfPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_contatos.vcf"
$vcfBuilder = New-Object System.Text.StringBuilder

foreach ($c in $contacts) {
    [void]$vcfBuilder.AppendLine("BEGIN:VCARD")
    [void]$vcfBuilder.AppendLine("VERSION:3.0")
    
    $displayName = $c.NomeCompleto
    if ($c.Graduacao) {
        $displayName = "$($c.Graduacao) $($c.NomeCompleto)"
    }
    [void]$vcfBuilder.AppendLine("FN:$displayName")
    
    $nameParts = $c.NomeCompleto.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($nameParts.Length -gt 1) {
        $firstName = $nameParts[0]
        $lastName = $nameParts[-1]
        $middleNames = ($nameParts[1..($nameParts.Length - 2)]) -join " "
        [void]$vcfBuilder.AppendLine("N:$lastName;$firstName;$middleNames;$($c.Graduacao);")
    } else {
        [void]$vcfBuilder.AppendLine("N:$($c.NomeCompleto);;;$($c.Graduacao);")
    }

    if ($c.NomeGuerra) {
        [void]$vcfBuilder.AppendLine("NICKNAME:$($c.NomeGuerra)")
    }

    $org = "5º Batalhão de Engenharia (5º BE)"
    if ($c.Companhia) {
        $org = "5º BE - $($c.Companhia)"
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
        if ($c.Bairro) { $street = "$street, $c.Bairro" }
        [void]$vcfBuilder.AppendLine("ADR;TYPE=HOME:;;$street;$($c.Cidade);$($c.Estado);;Brasil")
    }

    $notes = @()
    $notes += "5º Batalhão de Engenharia de Combate Blindado (5º BE)"
    if ($c.ID) { $notes += "ID Integrante: $($c.ID)" }
    if ($c.Graduacao) { $notes += "Graduação: $($c.Graduacao)" }
    if ($c.NomeGuerra) { $notes += "Nome de Guerra: $($c.NomeGuerra)" }
    if ($c.Companhia) { $notes += "Companhia: $($c.Companhia)" }
    if ($c.AnoIncorporacao) { $notes += "Ano Incorporação: $($c.AnoIncorporacao)" }
    if ($c.CPF) { $notes += "CPF: $($c.CPF)" }
    if ($c.DataNascimento) { $notes += "Nascimento: $($c.DataNascimento)" }
    $noteStr = $notes -join " \n "
    [void]$vcfBuilder.AppendLine("NOTE:$noteStr")

    [void]$vcfBuilder.AppendLine("END:VCARD")
}

[System.IO.File]::WriteAllText($vcfPath, $vcfBuilder.ToString(), $utf8Bom)
Write-Output "Arquivo vCard (.vcf) salvo com sucesso: $vcfPath"

# 3. Gerar Google Contacts CSV
$googleCsvPath = "C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\veteranos_5be_google_contacts.csv"
$gHeader = "Name,Given Name,Family Name,Additional Name,Nickname,Organization 1 - Name,Organization 1 - Title,E-mail 1 - Type,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value,Address 1 - Type,Address 1 - Formatted,Address 1 - Street,Address 1 - City,Address 1 - Region,Notes"
$gLines = New-Object System.Collections.Generic.List[string]
$gLines.Add($gHeader)

foreach ($c in $contacts) {
    $nameParts = $c.NomeCompleto.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    $first = if ($nameParts.Length -ge 1) { $nameParts[0] } else { "" }
    $last = if ($nameParts.Length -ge 2) { $nameParts[-1] } else { "" }
    $middle = if ($nameParts.Length -ge 3) { ($nameParts[1..($nameParts.Length - 2)]) -join " " } else { "" }
    
    $displayName = $c.NomeCompleto
    if ($c.Graduacao) { $displayName = "$($c.Graduacao) $($c.NomeCompleto)" }

    $org = "5º BE"
    if ($c.Companhia) { $org = "5º BE - $($c.Companhia)" }

    $notes = "ID: $($c.ID); Guerra: $($c.NomeGuerra); Inc: $($c.AnoIncorporacao); Cia: $($c.Companhia)"

    $gRow = @(
        ('"' + ($displayName -replace '"', '""') + '"'),
        ('"' + ($first -replace '"', '""') + '"'),
        ('"' + ($last -replace '"', '""') + '"'),
        ('"' + ($middle -replace '"', '""') + '"'),
        ('"' + ($c.NomeGuerra -replace '"', '""') + '"'),
        ('"' + ($org -replace '"', '""') + '"'),
        ('"' + ($c.Graduacao -replace '"', '""') + '"'),
        "Home",
        ('"' + ($c.Email -replace '"', '""') + '"'),
        "Mobile",
        ('"' + $c.TelefoneDial + '"'),
        "Home",
        ('"' + ($c.EnderecoCompleto -replace '"', '""') + '"'),
        ('"' + ($c.Logradouro -replace '"', '""') + '"'),
        ('"' + ($c.Cidade -replace '"', '""') + '"'),
        ('"' + ($c.Estado -replace '"', '""') + '"'),
        ('"' + ($notes -replace '"', '""') + '"')
    ) -join ","
    $gLines.Add($gRow)
}

[System.IO.File]::WriteAllLines($googleCsvPath, $gLines, $utf8Bom)
Write-Output "Google Contacts CSV salvo com sucesso: $googleCsvPath"
'@

# Salva converter.ps1 com UTF-8 BOM
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText("C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\converter.ps1", $scriptContent, $utf8Bom)
Write-Output "converter.ps1 regravado com UTF8 BOM com sucesso."
