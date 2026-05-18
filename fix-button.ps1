$content = Get-Content "D:\uiu\src\App.tsx" -Raw
$content = $content -replace "}\r?\n\s*<GraduationCap", "}>\n            <GraduationCap"
$content | Set-Content "D:\uiu\src\App.tsx" -NoNewline
Write-Host "Fixed!"
