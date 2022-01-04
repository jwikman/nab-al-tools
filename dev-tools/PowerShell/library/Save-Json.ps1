param (
    $CustomObject,
    [string]$FilePath
)

$Json = $CustomObject | ConvertTo-Json -Depth 100 | ForEach-Object {
    [Regex]::Replace($_, 
        "\\u(?<Value>[a-zA-Z0-9]{4})", {
            param($m) ([char]([int]::Parse($m.Groups['Value'].Value,
                        [System.Globalization.NumberStyles]::HexNumber))).ToString() } ) }



# Format json:
$indent = 0;
$Json = (($Json -Split "`n" | ForEach-Object {
            if ($_ -match '[\}\]]\s*,?\s*$') {
                # This line ends with ] or }, decrement the indentation level
                $indent--
            }
            $line = ('  ' * $indent) + $($_.TrimStart() -replace '":  (["{[\dft])', '": $1') # \d => numeric values, ft => Booleans (false/true)
            if ($_ -match '[\{\[]\s*$') {
                # This line ends with [ or {, increment the indentation level
                $indent++
            }
            $line
        }) -Join "`n") -replace "\[\s*\]", "[]"

if (Test-Path $FilePath) {
    Remove-Item $FilePath -Force
}

#$Json | Set-Content -Path $FilePath -Encoding "utf8"
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllLines($FilePath, $Json, $Utf8NoBomEncoding)