# Respostas Rápidas (`\`)

Extensão para Chrome, Firefox e Zen Browser que permite inserir respostas salvas digitando `\` no chat de suporte.

## Instalação

### Windows (Colegas de equipe)
1. Baixe ou clone este repositório.
2. Dê dois cliques em **`install.bat`**.
   - **Zen Browser / Firefox**: Se o arquivo `respostas-rapidas.xpi` estiver presente, o navegador abrirá pedindo apenas para clicar em **Adicionar**.
   - **Google Chrome**: O instalador copiará os arquivos para `%LOCALAPPDATA%\RespostasRapidas` e colocará esse caminho no seu `Ctrl+V`. No Chrome, abra `chrome://extensions`, ative o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e cole (`Ctrl+V`) o caminho da pasta.

### Linux
No terminal, dentro da pasta do projeto:
```bash
./install.sh
```
- Os arquivos fixos ficam em `~/.local/share/respostas-rapidas` (o caminho já vai para sua área de transferência).
- Se o `respostas-rapidas.xpi` estiver na pasta, o script já o abre automaticamente no Zen Browser / Firefox.

---

## Como Atualizar

- **No Chrome (Windows/Linux)**: Basta rodar o `install.bat` (Windows) ou `./install.sh` (Linux) novamente e clicar no ícone de recarregar em `chrome://extensions`. Suas mensagens salvas **não** são perdidas.
- **No Zen Browser / Firefox**:
  - Rodando o instalador novamente com o novo `.xpi`, **ou**
  - Automaticamente em segundo plano se o `update_url` estiver configurado com o repositório do GitHub.

---

## Como Gerar Nova Versão (Para o Mantenedor)

1. Atualize o número da `"version"` no `manifest.json` (ex: `"1.0.1"`).
2. Gere o pacote `.zip` limpo rodando:
   ```bash
   ./build.sh
   ```
3. Envie o arquivo gerado em `dist/respostas-rapidas-vX.Y.Z.zip` para a Mozilla em [addons.mozilla.org/developers/](https://addons.mozilla.org/developers/) (opção *Self-distributed*).
4. Baixe o `.xpi` assinado pela Mozilla, renomeie para **`respostas-rapidas.xpi`** na raiz deste projeto e faça o commit/release no GitHub.
