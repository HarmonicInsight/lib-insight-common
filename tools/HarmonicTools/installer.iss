; Inno Setup Script for Harmonic App Manager
; https://jrsoftware.org/isinfo.php

#define MyAppName "Harmonic App Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Harmonic Insight"
#define MyAppURL "https://harmonicinsight.com"
#define MyAppExeName "HarmonicTools.AppManager.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-4A5B-9C8D-1234567890AB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\HarmonicInsight\AppManager
DefaultGroupName=Harmonic Insight\App Manager
AllowNoIcons=yes
LicenseFile=
InfoBeforeFile=
OutputDir=Output
OutputBaseFilename=HarmonicAppManager-v{#MyAppVersion}-Setup
SetupIconFile=src\HarmonicTools.AppManager\Assets\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
MinVersion=10.0
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}

[Languages]
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "publish\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "publish\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "publish\*.json"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "publish\*.pdb"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[CustomMessages]
japanese.LaunchProgram=Harmonic App Manager を起動する
english.LaunchProgram=Launch Harmonic App Manager

[Code]
// Check if .NET 8 Desktop Runtime is installed
function IsDotNetDesktopRuntimeInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  // Check for .NET 8 Desktop Runtime
  Result := RegKeyExists(HKLM, 'SOFTWARE\dotnet\Setup\InstalledVersions\x64\sharedfx\Microsoft.WindowsDesktop.App');
end;

procedure InitializeWizard();
begin
  // Nothing special needed for self-contained app
end;
