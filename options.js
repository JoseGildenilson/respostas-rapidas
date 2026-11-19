const $ = (id) => document.getElementById(id);
let snippets = [];
let editingId = null;
let currentShortcut = null;

const MODIFIER_CODES = new Set([
  'ShiftLeft', 'ShiftRight',
  'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight',
  'MetaLeft', 'MetaRight',
]);

// Atalhos reservados pelo Chrome, Firefox e Zen Browser (Linux/Windows)
const BLOCKED_CTRL_SHIFT = new Set([
  'KeyB', 'KeyC', 'KeyE', 'KeyH', 'KeyI', 'KeyJ', 'KeyK', 'KeyM',
  'KeyN', 'KeyO', 'KeyP', 'KeyQ', 'KeyR', 'KeyS', 'KeyT', 'KeyU',
  'KeyV', 'KeyW', 'KeyY', 'Delete', 'Tab',
]);
const BLOCKED_ALT_SHIFT = new Set(['KeyB', 'KeyI', 'KeyT']);
const BLOCKED_CTRL_ALT = new Set(['Delete', 'KeyT', 'KeyL']);

function codeToLabel(code) {
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return 'Num' + code.slice(6);
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^F([1-9]|1[0-2])$/.test(code)) return code;
  return null;
}

function formatShortcut(sc) {
  if (!sc) return '';
  const parts = [];
  if (sc.ctrl) parts.push('Ctrl');
  if (sc.alt) parts.push('Alt');
  if (sc.shift) parts.push('Shift');
  parts.push(codeToLabel(sc.code) || sc.code);
  return parts.join(' + ');
}

function sameShortcut(a, b) {
  return Boolean(
    a && b &&
    Boolean(a.ctrl) === Boolean(b.ctrl) &&
    Boolean(a.alt) === Boolean(b.alt) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    a.code === b.code
  );
}

function validateShortcutEvent(e) {
  if (e.metaKey) {
    return { error: 'Tecla Windows/Super é reservada pelo sistema operacional.' };
  }

  const keyLabel = codeToLabel(e.code);
  if (!keyLabel) {
    return { error: 'Use letras (A-Z), números (0-9) ou teclas de função (F1-F12).' };
  }

  const ctrl = e.ctrlKey;
  const alt = e.altKey;
  const shift = e.shiftKey;

  // Sem Ctrl nem Alt (ex.: tecla solta ou Shift + 1) interfere na digitação normal
  if (!ctrl && !alt) {
    return {
      error: 'Shift sozinho ou tecla solta interfere na digitação (ex.: Shift+1 digita "!"). Use Alt + Shift + tecla ou Ctrl + Shift + número.',
    };
  }

  // Ctrl sozinho (sem Shift e sem Alt) conflita com abas e edição (Ctrl+1..9, Ctrl+C/V/T/W/R...)
  if (ctrl && !alt && !shift) {
    return {
      error: 'Atalhos só com Ctrl conflitam com o navegador/edição. Use Alt + Shift + tecla ou Ctrl + Shift + número.',
    };
  }

  // Alt sozinho conflita com abas no Firefox/Zen Linux (Alt+1..9) e menus no Windows
  if (alt && !ctrl && !shift) {
    return {
      error: 'Atalhos só com Alt conflitam com abas no Firefox/Zen (Alt+1..9) e menus. Use Alt + Shift + tecla.',
    };
  }

  // Ctrl + Shift + letras reservadas pelo navegador
  if (ctrl && shift && !alt && BLOCKED_CTRL_SHIFT.has(e.code)) {
    return {
      error: `Ctrl + Shift + ${keyLabel} é reservado pelo navegador. Tente Alt + Shift + ${keyLabel} ou um número.`,
    };
  }

  // Alt + Shift + teclas reservadas do Chrome
  if (alt && shift && !ctrl && BLOCKED_ALT_SHIFT.has(e.code)) {
    return {
      error: `Alt + Shift + ${keyLabel} é reservado pelo Chrome. Escolha outra tecla ou número.`,
    };
  }

  // Ctrl + Alt (AltGr no teclado ABNT2)
  if (ctrl && alt && !shift && BLOCKED_CTRL_ALT.has(e.code)) {
    return {
      error: `Ctrl + Alt + ${keyLabel} é reservado pelo sistema/navegador.`,
    };
  }

  const shortcut = { ctrl, alt, shift, code: e.code };
  shortcut.label = formatShortcut(shortcut);

  const conflict = snippets.find((s) => s.id !== editingId && sameShortcut(s.shortcut, shortcut));
  if (conflict) {
    return { error: `Atalho ${shortcut.label} já está em uso por "${conflict.title}".` };
  }

  return { shortcut };
}

function setShortcutError(text) {
  const el = $('shortcutErr');
  el.textContent = text || '';
  el.hidden = !text;
}

function setShortcutValue(sc) {
  currentShortcut = sc || null;
  $('shortcut').value = currentShortcut ? (currentShortcut.label || formatShortcut(currentShortcut)) : '';
  setShortcutError('');
}

function flash(text) {
  $('msg').textContent = text;
  setTimeout(() => ($('msg').textContent = ''), 2000);
}

function persist() {
  return chrome.storage.local.set({ snippets });
}

function resetForm() {
  editingId = null;
  $('title').value = '';
  $('text').value = '';
  setShortcutValue(null);
  $('cancel').hidden = true;
  $('save').textContent = 'Salvar';
}

function render() {
  $('count').textContent = snippets.length;
  const list = $('list');
  list.textContent = '';
  snippets.forEach((s) => {
    const el = document.createElement('div');
    el.className = 'item';
    const head = document.createElement('div');
    head.className = 'head';
    const t = document.createElement('div');
    t.className = 't';
    t.textContent = s.title;
    head.appendChild(t);
    if (s.shortcut) {
      const kbd = document.createElement('kbd');
      kbd.className = 'rr-kbd';
      kbd.textContent = s.shortcut.label || formatShortcut(s.shortcut);
      head.appendChild(kbd);
    }
    const p = document.createElement('div');
    p.className = 'p';
    p.textContent = s.text;
    const edit = document.createElement('button');
    edit.textContent = 'Editar';
    edit.onclick = () => {
      editingId = s.id;
      $('title').value = s.title;
      $('text').value = s.text;
      setShortcutValue(s.shortcut ? { ...s.shortcut } : null);
      $('cancel').hidden = false;
      $('save').textContent = 'Atualizar';
      window.scrollTo(0, 0);
    };
    const del = document.createElement('button');
    del.textContent = 'Excluir';
    del.onclick = async () => {
      if (!confirm('Excluir "' + s.title + '"?')) return;
      snippets = snippets.filter((x) => x.id !== s.id);
      await persist();
      if (editingId === s.id) resetForm();
      render();
    };
    el.append(head, p, edit, del);
    list.appendChild(el);
  });
}

$('shortcut').addEventListener('keydown', (e) => {
  if (e.key === 'Tab') return;
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Escape') {
    setShortcutValue(null);
    return;
  }

  if (MODIFIER_CODES.has(e.code)) return;

  const result = validateShortcutEvent(e);
  if (result.error) {
    setShortcutError(result.error);
    return;
  }
  setShortcutValue(result.shortcut);
});

$('clearShortcut').onclick = () => setShortcutValue(null);

$('save').onclick = async () => {
  const title = $('title').value.trim();
  const text = $('text').value;
  if (!title || !text.trim()) return flash('Preencha título e mensagem');

  if (currentShortcut) {
    const conflict = snippets.find((s) => s.id !== editingId && sameShortcut(s.shortcut, currentShortcut));
    if (conflict) {
      return setShortcutError(`Atalho ${currentShortcut.label} já está em uso por "${conflict.title}".`);
    }
  }

  const shortcut = currentShortcut ? { ...currentShortcut } : null;
  if (editingId) {
    snippets = snippets.map((s) => (s.id === editingId ? { ...s, title, text, shortcut } : s));
  } else {
    snippets.push({ id: crypto.randomUUID(), title, text, shortcut });
  }
  await persist();
  resetForm();
  render();
  flash('Salvo');
};

$('cancel').onclick = resetForm;

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'respostas-rapidas.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

$('import').onclick = () => $('file').click();
$('file').onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data)) throw new Error();
    const usedShortcuts = snippets.map((s) => s.shortcut).filter(Boolean);
    const valid = data
      .filter((s) => s && typeof s.title === 'string' && typeof s.text === 'string')
      .map((s) => {
        let sc = null;
        if (s.shortcut && typeof s.shortcut.code === 'string' && codeToLabel(s.shortcut.code)) {
          const candidate = {
            ctrl: Boolean(s.shortcut.ctrl),
            alt: Boolean(s.shortcut.alt),
            shift: Boolean(s.shortcut.shift),
            code: s.shortcut.code,
          };
          candidate.label = formatShortcut(candidate);
          if ((candidate.ctrl || candidate.alt) && !usedShortcuts.some((u) => sameShortcut(u, candidate))) {
            sc = candidate;
            usedShortcuts.push(candidate);
          }
        }
        return { id: crypto.randomUUID(), title: s.title, text: s.text, shortcut: sc };
      });
    snippets = snippets.concat(valid);
    await persist();
    render();
    flash(valid.length + ' importadas');
  } catch (_) {
    flash('Arquivo inválido');
  }
  e.target.value = '';
};

chrome.storage.local.get('snippets', (d) => {
  snippets = Array.isArray(d.snippets) ? d.snippets : [];
  render();
});
