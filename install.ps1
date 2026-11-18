$ErrorActionPreference = "Stop"

# Configure seu repositório GitHub abaixo quando estiver pronto (ex: "usuario/respostas-rapidas")
$GitHubRepo = "JoseGildenilson/respotas-rapidas"
$Branch = "main"

$InstallDir = Join-Path $env:LOCALAPPDATA "RespostasRapidas"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Instalador / Atualizador: Respostas Rapidas   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Em qual navegador deseja instalar/atualizar?"
Write-Host "  1) Zen Browser"
Write-Host "  2) Mozilla Firefox"
Write-Host "  3) Google Chrome"
Write-Host "  4) Todos os disponiveis"
Write-Host "  0) Cancelar"
Write-Host ""
$Choice = Read-Host "Escolha uma opcao [1-4]"

if ($Choice -eq "0") {
    Write-Host "Instalacao cancelada."
    exit 0
}

if ($Choice -notin @("1", "2", "3", "4")) {
    Write-Host "Opcao invalida." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$ExtFiles = @("manifest.json", "content.js", "content.css", "options.html", "options.js", "popup.html", "popup.js")

if (Test-Path (Join-Path $ScriptDir "manifest.json")) {
    Write-Host ""
    Write-Host "-> Copiando arquivos para $InstallDir..."
    foreach ($f in $ExtFiles) {
        Copy-Item -Path (Join-Path $ScriptDir $f) -Destination (Join-Path $InstallDir $f) -Force
    }
    $LocalXpi = Get-ChildItem -Path $ScriptDir -Filter "*.xpi" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $LocalXpi) {
        Copy-Item -Path $LocalXpi.FullName -Destination (Join-Path $InstallDir "respostas-rapidas.xpi") -Force
    }
} elseif ($GitHubRepo -ne "") {
    Write-Host ""
    Write-Host "-> Baixando arquivos de github.com/$GitHubRepo..."
    $RawUrl = "https://raw.githubusercontent.com/$GitHubRepo/$Branch"
    foreach ($f in $ExtFiles) {
        Invoke-WebRequest -Uri "$RawUrl/$f" -OutFile (Join-Path $InstallDir $f) -UseBasicParsing
    }
    try {
        Invoke-WebRequest -Uri "$RawUrl/respostas-rapidas.xpi" -OutFile (Join-Path $InstallDir "respostas-rapidas.xpi") -UseBasicParsing
    } catch {}
} else {
    Write-Host "Erro: Execute dentro da pasta do projeto ou configure `$GitHubRepo no install.ps1." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

$XpiPath = Join-Path $InstallDir "respostas-rapidas.xpi"

function Install-Zen {
    Write-Host ""
    Write-Host "=== Zen Browser ===" -ForegroundColor Cyan
    if (-not (Test-Path $XpiPath)) {
        Write-Host "Erro: Arquivo 'respostas-rapidas.xpi' nao encontrado." -ForegroundColor Red
        return
    }
    $ZenPaths = @(
        "$env:LOCALAPPDATA\Zen Browser\zen.exe",
        "$env:ProgramFiles\Zen Browser\zen.exe",
        "${env:ProgramFiles(x86)}\Zen Browser\zen.exe"
    )
    $Found = $false
    foreach ($zp in $ZenPaths) {
        if (Test-Path $zp) {
            Write-Host "-> Abrindo Zen Browser... Clique em 'Adicionar' no navegador." -ForegroundColor Green
            Start-Process -FilePath $zp -ArgumentList "`"$XpiPath`""
            $Found = $true
            break
        }
    }
    if (-not $Found) {
        Write-Host "Zen Browser nao encontrado na pasta padrao. Arraste o arquivo abaixo para o Zen Browser:" -ForegroundColor Yellow
        Write-Host "  $XpiPath"
    }
}

function Install-Firefox {
    Write-Host ""
    Write-Host "=== Mozilla Firefox ===" -ForegroundColor Cyan
    if (-not (Test-Path $XpiPath)) {
        Write-Host "Erro: Arquivo 'respostas-rapidas.xpi' nao encontrado." -ForegroundColor Red
        return
    }
    $FirefoxPaths = @(
        "$env:ProgramFiles\Mozilla Firefox\firefox.exe",
        "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe",
        "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
    )
    $Found = $false
    foreach ($fp in $FirefoxPaths) {
        if (Test-Path $fp) {
            Write-Host "-> Abrindo Firefox... Clique em 'Adicionar' no navegador." -ForegroundColor Green
            Start-Process -FilePath $fp -ArgumentList "`"$XpiPath`""
            $Found = $true
            break
        }
    }
    if (-not $Found) {
        Write-Host "Firefox nao encontrado na pasta padrao. Arraste o arquivo abaixo para o Firefox:" -ForegroundColor Yellow
        Write-Host "  $XpiPath"
    }
}

function Install-Chrome {
    Write-Host ""
    Write-Host "=== Google Chrome ===" -ForegroundColor Cyan
    Set-Clipboard -Value $InstallDir
    Write-Host "-> Arquivos instalados em: $InstallDir" -ForegroundColor Green
    Write-Host "-> O caminho acima ja foi COPIADO para seu Ctrl+V!" -ForegroundColor Yellow

    $ChromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($cp in $ChromePaths) {
        if (Test-Path $cp) {
            Start-Process -FilePath $cp -ArgumentList "chrome://extensions"
            break
        }
    }

    Write-Host ""
    Write-Host "Como finalizar no Google Chrome:"
    Write-Host "  1. No Chrome, acesse: chrome://extensions"
    Write-Host "  2. Ative 'Modo do desenvolvedor' (canto superior direito)"
    Write-Host "  3. Clique em 'Carregar sem compactacao' (Load unpacked)"
    Write-Host "  4. Aperte Ctrl+V na barra de pasta da janela e selecione:"
    Write-Host "     $InstallDir" -ForegroundColor Yellow
    Write-Host "  (Se estiver apenas ATUALIZANDO, basta clicar no botao de recarregar na extensao!)"
}

switch ($Choice) {
    "1" { Install-Zen }
    "2" { Install-Firefox }
    "3" { Install-Chrome }
    "4" {
        Install-Zen
        Install-Firefox
        Install-Chrome
    }
}

Write-Host ""
Read-Host "Concluido! Pressione Enter para fechar"
