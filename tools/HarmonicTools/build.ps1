# Build script for Harmonic App Manager
# Usage:
#   .\build.ps1              # Build only
#   .\build.ps1 -Publish     # Build + Publish (self-contained exe)
#   .\build.ps1 -Installer   # Build + Publish + Create Installer

param(
    [string]$Configuration = "Release",
    [switch]$Publish,
    [switch]$Installer
)

$ErrorActionPreference = "Stop"

$appName = "HarmonicAppManager"
$appVersion = "1.0.0"
$projectPath = "src\HarmonicTools.AppManager\HarmonicTools.AppManager.csproj"
$publishDir = "publish"
$installerDir = "Output"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Harmonic App Manager - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/3] Building ($Configuration)..." -ForegroundColor Yellow
dotnet build $projectPath -c $Configuration

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Build succeeded!" -ForegroundColor Green
Write-Host ""

# Step 2: Publish (if -Publish or -Installer)
if ($Publish -or $Installer) {
    Write-Host "[2/3] Publishing (self-contained, win-x64)..." -ForegroundColor Yellow

    # Clean publish folder
    if (Test-Path $publishDir) {
        Write-Host "  Cleaning old publish folder..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $publishDir
    }

    dotnet publish $projectPath `
        -c $Configuration `
        -r win-x64 `
        --self-contained true `
        -p:PublishSingleFile=true `
        -p:IncludeNativeLibrariesForSelfExtract=true `
        -o $publishDir

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Publish failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "Publish succeeded!" -ForegroundColor Green
    Write-Host "  Output: $publishDir\HarmonicTools.AppManager.exe" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Create Installer (if -Installer)
if ($Installer) {
    Write-Host "[3/3] Creating Installer (Inno Setup)..." -ForegroundColor Yellow

    # Check if Inno Setup is installed
    $localAppDataPath = [Environment]::GetFolderPath('LocalApplicationData')
    $appDataPath = [Environment]::GetFolderPath('ApplicationData')

    $innoSetupPath = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        "C:\Program Files\Inno Setup 6\ISCC.exe",
        "$localAppDataPath\Programs\Inno Setup 6\ISCC.exe",
        "$appDataPath\Programs\Inno Setup 6\ISCC.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Inno Setup 6\ISCC.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    # Also try to find via PATH
    if (-not $innoSetupPath) {
        $innoSetupPath = (Get-Command "ISCC.exe" -ErrorAction SilentlyContinue).Source
    }

    if (-not $innoSetupPath) {
        Write-Host "Inno Setup 6 not found!" -ForegroundColor Red
        Write-Host "Please install from: https://jrsoftware.org/isinfo.php" -ForegroundColor Yellow
        Write-Host "Or run: winget install JRSoftware.InnoSetup" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After installation, you may need to restart your terminal or PC." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  Using: $innoSetupPath" -ForegroundColor Gray

    # Create Output directory
    if (-not (Test-Path $installerDir)) {
        New-Item -ItemType Directory -Path $installerDir | Out-Null
    }

    # Run Inno Setup compiler
    $issPath = Join-Path $PSScriptRoot "installer.iss"
    & $innoSetupPath $issPath

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installer creation failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "Installer created successfully!" -ForegroundColor Green

    # Show output
    $installerExe = Get-ChildItem -Path $installerDir -Filter "*Setup*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($installerExe) {
        $size = [math]::Round($installerExe.Length / 1MB, 1)
        Write-Host "  Output: $($installerExe.FullName) ($size MB)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
