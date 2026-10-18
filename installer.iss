; Script de Inno Setup 7 para Statix Data Analyzer v1.1.0
; Diseñado para Windows 10 / 11 de 64 bits con soporte de modo oscuro e interfaz moderna

#define MyAppName "Statix Data Analyzer"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Alberto"
#define MyAppURL "https://github.com/alberto2005-coder/statix-desktop-data-analyzer"
#define MyAppExeName "Statix Data Analyzer.exe"
#define MyAppAssocName "Archivo de Sesion Statix"
#define MyAppAssocExt ".stx"
#define MyAppAssocKey "StatixProjectFile"

[Setup]
; Identificador único de aplicación (GUID)
AppId={{8B19C34A-4F71-479D-99C5-63F05D8446A1}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
; Carpeta de salida del instalador y nombre
OutputDir=release
OutputBaseFilename=Statix_Data_Analyzer_Setup_v{#MyAppVersion}
SetupIconFile=build\icon.ico
SolidCompression=yes
Compression=lzma2/ultra64
; Estilo moderno de Inno Setup 7 (compatible con Windows 11 y temas claro/oscuro)
WizardStyle=modern
WizardSizePercent=100
DisableProgramGroupPage=yes
; Permite instalar para el usuario actual o todos los usuarios
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesInstallIn64BitMode=x64compatible
ChangesAssociations=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associate_stx"; Description: "&Asociar archivos de proyecto Statix (.stx) para abrir con Statix Data Analyzer"; GroupDescription: "Asociaciones de archivo:"; Flags: checkedonce

[Files]
; Archivos empaquetados de Electron
Source: "release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Icono de la aplicación
Source: "build\icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
; Asociación de la extensión .stx (pregunta al usuario en la instalación)
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocExt}"; ValueType: string; ValueName: ""; ValueData: "{#MyAppAssocKey}"; Flags: uninsdeletevalue; Tasks: associate_stx
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocExt}\OpenWithProgids"; ValueType: string; ValueName: "{#MyAppAssocKey}"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associate_stx
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}"; ValueType: string; ValueName: ""; ValueData: "{#MyAppAssocName}"; Flags: uninsdeletekey; Tasks: associate_stx
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\icon.ico,0"; Tasks: associate_stx
Root: HKA; Subkey: "Software\Classes\{#MyAppAssocKey}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: associate_stx

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
