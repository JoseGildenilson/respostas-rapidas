const $ = (id) => document.getElementById(id);
let snippets = [];
let editingId = null;

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
    const t = document.createElement('div');
    t.className = 't';
    t.textContent = s.title;
    const p = document.createElement('div');
    p.className = 'p';
    p.textContent = s.text;
    const edit = document.createElement('button');
    edit.textContent = 'Editar';
    edit.onclick = () => {
      editingId = s.id;
      $('title').value = s.title;
      $('text').value = s.text;
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
    el.append(t, p, edit, del);
    list.appendChild(el);
  });
}

$('save').onclick = async () => {
  const title = $('title').value.trim();
  const text = $('text').value;
  if (!title || !text.trim()) return flash('Preencha título e mensagem');
  if (editingId) {
    snippets = snippets.map((s) => (s.id === editingId ? { ...s, title, text } : s));
  } else {
    snippets.push({ id: crypto.randomUUID(), title, text });
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
    const valid = data
      .filter((s) => s && typeof s.title === 'string' && typeof s.text === 'string')
      .map((s) => ({ id: crypto.randomUUID(), title: s.title, text: s.text }));
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
