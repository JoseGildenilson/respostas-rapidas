#!/usr/bin/env bash
set -euo pipefail

# Configure seu repositório GitHub abaixo quando estiver pronto (ex: "usuario/respostas-rapidas")
GITHUB_REPO="JoseGildenilson/respotas-rapidas"
BRANCH="main"

INSTALL_DIR="${HOME}/.local/share/respostas-rapidas"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================="
echo "   Instalador / Atualizador: Respostas Rápidas   "
echo "================================================="
echo ""
echo "Em qual navegador deseja instalar/atualizar?"
echo "  1) Zen Browser"
echo "  2) Mozilla Firefox"
echo "  3) Google Chrome / Chromium"
echo "  4) Todos os disponíveis"
echo "  0) Cancelar"
echo ""
read -rp "Escolha uma opção [1-4]: " CHOICE

if [[ "$CHOICE" == "0" ]]; then
  echo "Instalação cancelada."
  exit 0
fi

if [[ ! "$CHOICE" =~ ^[1-4]$ ]]; then
  echo "Opção inválida."
  exit 1
fi

mkdir -p "$INSTALL_DIR"
EXT_FILES=(manifest.json content.js content.css options.html options.js popup.html popup.js)

# Copia arquivos locais ou baixa do GitHub
if [[ -f "$SCRIPT_DIR/manifest.json" ]]; then
  echo ""
  echo "-> Copiando arquivos para $INSTALL_DIR..."
  for f in "${EXT_FILES[@]}"; do
    cp -f "$SCRIPT_DIR/$f" "$INSTALL_DIR/"
  done
  XPI_SRC=$(ls -t "$SCRIPT_DIR"/*.xpi 2>/dev/null | head -n 1 || true)
  if [[ -n "$XPI_SRC" ]]; then
    cp -f "$XPI_SRC" "$INSTALL_DIR/respostas-rapidas.xpi"
  fi
elif [[ -n "$GITHUB_REPO" ]]; then
  echo ""
  echo "-> Baixando arquivos de github.com/$GITHUB_REPO..."
  RAW_URL="https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}"
  for f in "${EXT_FILES[@]}"; do
    curl -fsSL "${RAW_URL}/${f}" -o "$INSTALL_DIR/$f"
  done
  curl -fsSL "${RAW_URL}/respostas-rapidas.xpi" -o "$INSTALL_DIR/respostas-rapidas.xpi" 2>/dev/null || true
else
  echo "Erro: Execute este script dentro da pasta do projeto ou configure GITHUB_REPO no script."
  exit 1
fi

XPI_PATH="$INSTALL_DIR/respostas-rapidas.xpi"

install_zen() {
  echo ""
  echo "=== Zen Browser ==="
  if [[ ! -f "$XPI_PATH" ]]; then
    echo "Erro: Arquivo 'respostas-rapidas.xpi' não encontrado em $INSTALL_DIR."
    return
  fi
  if command -v zen-browser >/dev/null 2>&1; then
    echo "-> Abrindo Zen Browser... Clique em 'Adicionar' no navegador."
    nohup zen-browser "$XPI_PATH" >/dev/null 2>&1 &
  elif command -v zen >/dev/null 2>&1; then
    echo "-> Abrindo Zen Browser... Clique em 'Adicionar' no navegador."
    nohup zen "$XPI_PATH" >/dev/null 2>&1 &
  elif command -v flatpak >/dev/null 2>&1 && flatpak info app.zen_browser.zen >/dev/null 2>&1; then
    echo "-> Abrindo Zen Browser (Flatpak)... Clique em 'Adicionar' no navegador."
    nohup flatpak run app.zen_browser.zen "$XPI_PATH" >/dev/null 2>&1 &
  else
    echo "Zen Browser não encontrado automaticamente. Arraste o arquivo abaixo para dentro do Zen Browser:"
    echo "  $XPI_PATH"
  fi
}

install_firefox() {
  echo ""
  echo "=== Mozilla Firefox ==="
  if [[ ! -f "$XPI_PATH" ]]; then
    echo "Erro: Arquivo 'respostas-rapidas.xpi' não encontrado em $INSTALL_DIR."
    return
  fi
  if command -v firefox >/dev/null 2>&1; then
    echo "-> Abrindo Firefox... Clique em 'Adicionar' no navegador."
    nohup firefox "$XPI_PATH" >/dev/null 2>&1 &
  elif command -v flatpak >/dev/null 2>&1 && flatpak info org.mozilla.firefox >/dev/null 2>&1; then
    echo "-> Abrindo Firefox (Flatpak)... Clique em 'Adicionar' no navegador."
    nohup flatpak run org.mozilla.firefox "$XPI_PATH" >/dev/null 2>&1 &
  else
    echo "Firefox não encontrado automaticamente. Arraste o arquivo abaixo para dentro do Firefox:"
    echo "  $XPI_PATH"
  fi
}

install_chrome() {
  echo ""
  echo "=== Google Chrome / Chromium ==="
  echo "-> Arquivos instalados/atualizados em:"
  echo "   $INSTALL_DIR"

  if command -v wl-copy >/dev/null 2>&1; then
    printf "%s" "$INSTALL_DIR" | wl-copy
    echo "-> Caminho copiado para seu Ctrl+V (via wl-copy)!"
  elif command -v xclip >/dev/null 2>&1; then
    printf "%s" "$INSTALL_DIR" | xclip -selection clipboard
    echo "-> Caminho copiado para seu Ctrl+V (via xclip)!"
  fi

  for bin in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$bin" >/dev/null 2>&1; then
      nohup "$bin" "chrome://extensions" >/dev/null 2>&1 &
      break
    fi
  done

  echo ""
  echo "Como finalizar no Chrome:"
  echo "  1. Acesse: chrome://extensions"
  echo "  2. Ative 'Modo do desenvolvedor' (canto superior direito)"
  echo "  3. Clique em 'Carregar sem compactação' e selecione (ou cole Ctrl+V):"
  echo "     $INSTALL_DIR"
  echo "  (Se já estava instalada antes, basta clicar no botão de recarregar na extensão!)"
}

case "$CHOICE" in
  1) install_zen ;;
  2) install_firefox ;;
  3) install_chrome ;;
  4)
    install_zen
    install_firefox
    install_chrome
    ;;
esac

echo ""
echo "Concluído!"
