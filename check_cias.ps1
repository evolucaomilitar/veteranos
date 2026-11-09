$jsonStr = [System.IO.File]::ReadAllText("C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\dados.js", [System.Text.Encoding]::UTF8)
$clean = $jsonStr.Replace("window.VETERANOS_DATA = ", "").TrimEnd(";")
$data = $clean | ConvertFrom-Json

$data | Group-Object cia | Select-Object Name, Count | Format-Table -AutoSize
