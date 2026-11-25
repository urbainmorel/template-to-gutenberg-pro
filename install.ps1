param(
    [switch]$Project
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillSrc = Join-Path $ScriptDir "skills\template-to-gutenberg-pro"
$SkillName = "template-to-gutenberg-pro"

function Install-SkillTo {
    param(
        [string]$TargetDir,
        [string]$Label
    )
    if (Test-Path $TargetDir) {
        Remove-Item -Recurse -Force $TargetDir
    }
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
    Copy-Item -Path "$SkillSrc\*" -Destination $TargetDir -Recurse -Force
    Write-Host "  [OK] $Label -> $TargetDir" -ForegroundColor Green
}

Write-Host "Installing $SkillName..." -ForegroundColor Cyan

if ($Project) {
    Install-SkillTo -TargetDir (Join-Path (Get-Location) ".agents\skills\$SkillName") -Label "Universal Project (.agents)"
    Install-SkillTo -TargetDir (Join-Path (Get-Location) ".claude\skills\$SkillName") -Label "Claude Code Project (.claude)"
    exit 0
}

$installed = 0
$homeDir = $env:USERPROFILE

$targets = @(
    @{ Check = "$homeDir\.gemini"; Dest = "$homeDir\.gemini\config\skills\$SkillName"; Label = "Antigravity / Gemini CLI" },
    @{ Check = "$homeDir\.claude"; Dest = "$homeDir\.claude\skills\$SkillName"; Label = "Claude Code" },
    @{ Check = "$homeDir\.codex"; Dest = "$homeDir\.codex\skills\$SkillName"; Label = "Codex" },
    @{ Check = "$homeDir\.config\opencode"; Dest = "$homeDir\.config\opencode\skills\$SkillName"; Label = "OpenCode" }
)

foreach ($t in $targets) {
    if (Test-Path $t.Check) {
        Install-SkillTo -TargetDir $t.Dest -Label $t.Label
        $installed++
    }
}

if ($installed -eq 0) {
    Install-SkillTo -TargetDir "$homeDir\.agents\skills\$SkillName" -Label "Universal (.agents)"
}

Write-Host "Done! $SkillName is installed globally." -ForegroundColor Cyan
