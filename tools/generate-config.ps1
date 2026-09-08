<#
.SYNOPSIS
    Regenerates config.json from whatever audio files are present in audio/.

.DESCRIPTION
    Windows-friendly twin of tools/generate-config.js - use this one locally if you
    do not have Node installed. Both produce byte-identical config.json output.

    Add or remove files in audio/, then run:
        powershell -ExecutionPolicy Bypass -File tools/generate-config.ps1

    Manual edits to a track's "name" or "category" are preserved: entries are
    matched by "id", which is derived from the filename.
#>

$ErrorActionPreference = 'Stop'

$Root       = Split-Path -Parent $PSScriptRoot
$AudioDir   = Join-Path $Root 'audio'
$ConfigPath = Join-Path $Root 'config.json'

$AudioExtensions = @('.mp3', '.ogg', '.wav', '.m4a', '.aac', '.opus', '.flac')

# Filename patterns -> the category and display prefix a new track gets.
$CategoryRules = @(
    @{ Match = '^pause';       Category = 'pauses'; Icon = [char]::ConvertFromUtf32(0x23F8)  }  # pause symbol
    @{ Match = '^bell';        Category = 'bells';  Icon = [char]::ConvertFromUtf32(0x1F514) }  # bell
    @{ Match = '^om$';         Category = 'chants'; Icon = [char]::ConvertFromUtf32(0x1F549) }  # om
    @{ Match = '^(music|bgm)'; Category = 'music';  Icon = [char]::ConvertFromUtf32(0x1F3B5) }  # musical note
    @{ Match = '.*';           Category = 'chants'; Icon = [char]::ConvertFromUtf32(0x1F3B6) }  # musical notes
)

# --- Minimal JSON writer, byte-for-byte equivalent to JSON.stringify(value, null, 2) ---

function Write-JsonString([string]$Value) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    foreach ($ch in $Value.ToCharArray()) {
        switch ([int]$ch) {
            0x22 { [void]$sb.Append('\"'); continue }
            0x5C { [void]$sb.Append('\\'); continue }
            0x08 { [void]$sb.Append('\b'); continue }
            0x0C { [void]$sb.Append('\f'); continue }
            0x0A { [void]$sb.Append('\n'); continue }
            0x0D { [void]$sb.Append('\r'); continue }
            0x09 { [void]$sb.Append('\t'); continue }
            default {
                if ([int]$ch -lt 0x20) { [void]$sb.Append(('\u{0:x4}' -f [int]$ch)) }
                else                   { [void]$sb.Append($ch) }
            }
        }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

function Write-Json($Value, [int]$Depth = 0) {
    $pad     = ' ' * (2 * $Depth)
    $padItem = ' ' * (2 * ($Depth + 1))

    if ($null -eq $Value)    { return 'null' }
    if ($Value -is [string]) { return Write-JsonString $Value }
    if ($Value -is [bool])   { if ($Value) { return 'true' } else { return 'false' } }
    if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
        return [string]::Format([cultureinfo]::InvariantCulture, '{0}', $Value)
    }

    if ($Value -is [System.Collections.IList]) {
        if ($Value.Count -eq 0) { return '[]' }
        $items = foreach ($item in $Value) { $padItem + (Write-Json $item ($Depth + 1)) }
        return "[`n" + ($items -join ",`n") + "`n$pad]"
    }

    # PSCustomObject (from ConvertFrom-Json) or ordered hashtable
    if ($Value -is [System.Collections.IDictionary]) { $names = @($Value.Keys) }
    else { $names = @($Value.PSObject.Properties.Name) }

    if ($names.Count -eq 0) { return '{}' }
    $pairs = foreach ($name in $names) {
        if ($Value -is [System.Collections.IDictionary]) { $child = $Value[$name] } else { $child = $Value.$name }
        $padItem + (Write-JsonString $name) + ': ' + (Write-Json $child ($Depth + 1))
    }
    return "{`n" + ($pairs -join ",`n") + "`n$pad}"
}

# --- Helpers ---

# Pad digit runs so "Pause2" sorts before "Pause10". Compared ordinally so that the
# Node and PowerShell generators always agree on ordering.
function Get-SortKey([string]$Name) {
    return [regex]::Replace($Name.ToLowerInvariant(), '\d+', { param($m) $m.Value.PadLeft(10, '0') })
}

function Get-NameFromId([string]$Id) {
    $words = ($Id -replace '[_-]+', ' ').Trim()
    if ($words.Length -eq 0) { return $words }
    return $words.Substring(0, 1).ToUpperInvariant() + $words.Substring(1)
}

# --- Main ---

if (-not (Test-Path $AudioDir)) {
    Write-Error "No audio directory at $AudioDir"
}

# Read the previous config so hand-edited names/categories survive.
$existing       = $null
$previousTracks = @{}
$previousIds    = @()
if (Test-Path $ConfigPath) {
    try {
        $existing = [System.IO.File]::ReadAllText($ConfigPath) | ConvertFrom-Json
        foreach ($t in $existing.tracks) {
            $previousTracks[$t.id] = $t
            $previousIds += $t.id
        }
    } catch {
        Write-Warning "config.json is not valid JSON ($($_.Exception.Message)) - rebuilding from scratch."
    }
}

$names = @(Get-ChildItem -File $AudioDir |
    Where-Object { $AudioExtensions -contains $_.Extension.ToLowerInvariant() } |
    ForEach-Object { $_.Name })

$byKey = @{}
foreach ($n in $names) { $byKey[(Get-SortKey $n)] = $n }
$keys = [string[]]@($byKey.Keys)
[array]::Sort($keys, [System.StringComparer]::Ordinal)

$tracks = @()
$ids    = @()
foreach ($key in $keys) {
    $file = $byKey[$key]
    $id   = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $ids += $id
    $rule = $CategoryRules | Where-Object { $id -match $_.Match } | Select-Object -First 1

    $previous = $previousTracks[$id]
    if ($previous -and $previous.name)     { $name     = $previous.name }     else { $name     = "$($rule.Icon) $(Get-NameFromId $id)" }
    if ($previous -and $previous.category) { $category = $previous.category } else { $category = $rule.Category }

    $tracks += [ordered]@{
        id       = $id
        name     = $name
        file     = "audio/$file"
        duration = 0
        category = $category
    }
}

if ($existing -and $existing.app) { $app = $existing.app } else {
    $app = [ordered]@{
        name         = 'ChantFlow'
        version      = '1.0.0'
        description  = 'Devotional Chant Player - Create and play customized chanting sessions'
        author       = 'Your Name'
        supportEmail = 'support@example.com'
    }
}

if ($existing -and $existing.defaultRepetitions) { $reps = @($existing.defaultRepetitions) } else {
    $reps = @(
        [ordered]@{ label = '11x';  value = 11  }
        [ordered]@{ label = '21x';  value = 21  }
        [ordered]@{ label = '54x';  value = 54  }
        [ordered]@{ label = '108x'; value = 108 }
    )
}

if ($existing -and $existing.settings) { $settings = $existing.settings } else {
    $settings = [ordered]@{
        autoPlayNext        = $true
        loopSession         = $false
        defaultVolume       = 70
        cacheAudio          = $true
        enableNotifications = $false
    }
}

$config = [ordered]@{
    app                = $app
    tracks             = $tracks
    defaultRepetitions = $reps
    settings           = $settings
}

$output = (Write-Json $config 0) + "`n"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
if ((Test-Path $ConfigPath) -and ([System.IO.File]::ReadAllText($ConfigPath) -eq $output)) {
    Write-Host "config.json already up to date ($($ids.Count) tracks)."
    return
}

[System.IO.File]::WriteAllText($ConfigPath, $output, $utf8NoBom)

$added   = @($ids | Where-Object { $previousIds -notcontains $_ })
$removed = @($previousIds | Where-Object { $ids -notcontains $_ })

Write-Host "Wrote config.json with $($ids.Count) tracks."
if ($added.Count)   { Write-Host "  added:   $($added -join ', ')" }
if ($removed.Count) { Write-Host "  removed: $($removed -join ', ')" }
