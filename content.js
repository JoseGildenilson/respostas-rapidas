(() => {
  'use strict';

  const TRIGGER = '\\';
  const FIELD_ID = 'campText';

  let snippets = [];
  let menu = null;
  let items = [];
  let active = 0;
  let startIdx = -1;
  let field = null;
  let inserting = false;

  const norm = (s) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  chrome.storage.local.get('snippets', (d) => {
    snippets = Array.isArray(d.snippets) ? d.snippets : [];
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.snippets) {
      snippets = changes.snippets.newValue || [];
      if (menu) update();
    }
  });

  function open(idx) {
    startIdx = idx;
    active = 0;
    menu = document.createElement('div');
    menu.className = 'rr-menu';
    // mousedown com preventDefault mantém o foco no campo
    menu.addEventListener('mousedown', (e) => e.preventDefault());
    document.body.appendChild(menu);
    update();
  }

  function close() {
    if (menu) menu.remove();
    menu = null;
    items = [];
    startIdx = -1;
  }

  function position() {
    const r = field.getBoundingClientRect();
    const w = Math.min(Math.max(r.width, 320), 560);
    menu.style.width = w + 'px';
    menu.style.left = Math.max(8, r.left) + 'px';
    menu.style.bottom = window.innerHeight - r.top + 6 + 'px';
  }

  function update() {
    if (!menu || !field) return;
    const pos = field.selectionStart;
    if (pos <= startIdx || field.value[startIdx] !== TRIGGER) return close();
    const q = field.value.slice(startIdx + 1, pos);
    if (q.includes('\n')) return close();

    const nq = norm(q);
    items = snippets.filter(
      (s) => !nq || norm(s.title).includes(nq) || norm(s.text).includes(nq)
    );
    if (active >= items.length) active = Math.max(0, items.length - 1);
    render();
  }

  function render() {
    menu.textContent = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'rr-empty';
      empty.textContent = snippets.length
        ? 'Nenhuma mensagem encontrada'
        : 'Nenhuma mensagem salva. Abra as opções da extensão para adicionar.';
      menu.appendChild(empty);
    } else {
      items.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'rr-item' + (i === active ? ' rr-active' : '');
        const t = document.createElement('div');
        t.className = 'rr-title';
        t.textContent = s.title;
        const p = document.createElement('div');
        p.className = 'rr-preview';
        p.textContent = s.text.replace(/\s+/g, ' ');
        el.append(t, p);
        el.addEventListener('click', () => choose(i));
        el.addEventListener('mousemove', () => {
          if (active !== i) {
            active = i;
            menu.querySelector('.rr-active')?.classList.remove('rr-active');
            el.classList.add('rr-active');
          }
        });
        menu.appendChild(el);
      });
    }
    position();
    menu.querySelector('.rr-active')?.scrollIntoView({ block: 'nearest' });
  }

  function choose(i) {
    const s = items[i];
    const start = startIdx;
    close();
    if (!s || !field) return;

    field.focus();
    field.setSelectionRange(start, field.selectionStart);
    inserting = true;
    let ok = false;
    try {
      ok = document.execCommand('insertText', false, s.text);
    } catch (_) {}
    if (!ok) {
      field.setRangeText(s.text, start, field.selectionEnd, 'end');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    inserting = false;
  }

  document.addEventListener(
    'input',
    (e) => {
      if (e.target.id !== FIELD_ID || inserting) return;
      field = e.target;
      if (menu) return update();
      if (!e.inputType || !e.inputType.startsWith('insert')) return;
      const pos = field.selectionStart;
      const v = field.value;
      if (v[pos - 1] === TRIGGER && (pos === 1 || /\s/.test(v[pos - 2]))) {
        open(pos - 1);
      }
    },
    true
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (!menu || e.target !== field) return;
      const stop = () => {
        e.preventDefault();
        e.stopImmediatePropagation();
      };
      switch (e.key) {
        case 'ArrowDown':
          stop();
          if (items.length) active = (active + 1) % items.length;
          render();
          break;
        case 'ArrowUp':
          stop();
          if (items.length) active = (active - 1 + items.length) % items.length;
          render();
          break;
        case 'Enter':
        case 'Tab':
          stop();
          if (items.length) choose(active);
          else close();
          break;
        case 'Escape':
          stop();
          close();
          break;
      }
    },
    true
  );

  // Cursor movido por setas laterais, Home/End ou clique
  document.addEventListener(
    'keyup',
    (e) => {
      if (menu && e.target === field && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) update();
    },
    true
  );
  document.addEventListener(
    'click',
    (e) => {
      if (menu && !menu.contains(e.target)) close();
    },
    true
  );
  document.addEventListener(
    'focusout',
    (e) => {
      if (menu && e.target === field) close();
    },
    true
  );
  window.addEventListener('resize', () => menu && position());
})();
