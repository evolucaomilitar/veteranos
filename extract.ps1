$logPath = "C:\Users\Usuario\.gemini\antigravity\brain\17b6decb-7a0d-4b5d-8630-b24b4924365b\.system_generated\logs\transcript_full.jsonl"
if (-not (Test-Path $logPath)) {
    $logPath = "C:\Users\Usuario\.gemini\antigravity\brain\17b6decb-7a0d-4b5d-8630-b24b4924365b\.system_generated\logs\transcript.jsonl"
}

$lastUser = $null
Get-Content -Path $logPath -Encoding UTF8 | ForEach-Object {
    if ($_ -match '"type":\s*"USER_INPUT"') {
        $obj = $_ | ConvertFrom-Json
        if ($obj.type -eq "USER_INPUT") {
            $lastUser = $obj.content
        }
    }
}

if ($lastUser) {
    [System.IO.File]::WriteAllText("C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt", $lastUser, [System.Text.Encoding]::UTF8)
    Write-Output "Salvo com sucesso. Tamanho: $($lastUser.Length) caracteres."
} else {
    Write-Output "Nenhum USER_INPUT encontrado."
}
