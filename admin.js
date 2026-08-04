// =====================================================================
// PaceWave Library - admin dashboard logic
// ---------------------------------------------------------------------
// Handles: auth guard, tab navigation, overview stats, book CRUD with
// dynamic chapter editor + cover upload, category CRUD, featured
// management and new arrivals.
// =====================================================================
(function () {
  'use strict';

  // ---- Auth: read stored token ------------------------------------
  function token() { return localStorage.getItem('pw_admin_token'); }

  // ---- API helper (adds auth header + JSON handling) --------------
  const API_BASE = '';
  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token()) headers['Authorization'] = 'Bearer ' + token();
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (res.status === 401) { window.location.href = 'login.html'; throw new Error('Session expired'); }
    if (!res.ok) {
      let msg = 'Request failed';
      try { const d = await res.json(); msg = d.error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt !== undefined) n.textContent = txt; return n; };

  // ---- Toast notifications -----------------------------------------
  function toast(msg, isError = false) {
    const t = el('div', 'toast' + (isError ? ' error' : ''), msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // Expose API helper early so the login page can use PW.api too.
  window.PW = { api };

  // ---- Guard: this block only runs on the dashboard ---------------
  const isDashboard = !!$('.sidebar');
  if (!isDashboard) return; // we're on the login page

  // Redirect to login if no valid token
  if (!token()) { window.location.replace('login.html'); return; }
  const user = JSON.parse(localStorage.getItem('pw_admin_user') || '{}');
  const userLabel = $('#user-label');
  if (userLabel) userLabel.textContent = user.name ? user.name + ' · ' + user.email : user.email || '';

  // ---- Tab navigation ----------------------------------------------
  const TAB_TITLES = { overview: 'Overview', books: 'Books', categories: 'Categories', featured: 'Featured', newarrivals: 'New Arrivals' };
  function switchTab(name) {
    $$('.main section').forEach((s) => s.classList.add('hidden'));
    const sec = $('#tab-' + name);
    if (sec) sec.classList.remove('hidden');
    $$('.side-link[data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
    const t = $('#page-title'); if (t) t.textContent = TAB_TITLES[name] || name;
    window.location.hash = name;
    // Refresh content per tab
    if (name === 'overview') loadStats();
    if (name === 'books') loadBooks();
    if (name === 'categories') loadCategories();
    if (name === 'featured') loadFeatured();
    if (name === 'newarrivals') loadNewArrivals();
  }
  $$('.side-link[data-tab]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); switchTab(a.dataset.tab); }));

  const hashTab = window.location.hash.replace('#', '') || 'overview';
  switchTab(hashTab);

  // Logout
  $('#logout-btn').addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    localStorage.removeItem('pw_admin_token');
    localStorage.removeItem('pw_admin_refresh');
    localStorage.removeItem('pw_admin_user');
    window.location.href = 'login.html';
  });

  // =====================================================================
  // OVERVIEW - stats + recent books
  // =====================================================================
  async function loadStats() {
    try {
      const { stats, recent_books } = await api('/api/admin/stats');
      const nums = ['total_books', 'total_categories', 'total_readers', 'total_views'];
      $$('#stats-grid .num').forEach((n, i) => { n.textContent = (stats[nums[i]] || 0).toLocaleString(); });

      const tb = $('#recent-table tbody'); tb.innerHTML = '';
      (recent_books || []).forEach((b) => {
        const tr = el('tr');
        tr.innerHTML =
          '<td>' + coverTd(b) + '</td>' +
          '<td>' + esc(b.title) + '</td><td>' + esc(b.author) + '</td>' +
          '<td>' + esc((b.category && b.category.name) || '—') + '</td>' +
          '<td>' + (b.views || 0) + '</td>' +
          '<td>' + new Date(b.created_at).toLocaleDateString() + '</td>';
        tb.appendChild(tr);
      });
    } catch (e) { toast(e.message, true); }
  }

  function coverTd(b) {
    if (!b.cover_url) return '<div style="width:40px;height:56px;border-radius:6px;background:var(--grad)"></div>';
    return '<img class="cover" src="' + b.cover_url + '" alt="cover">';
  }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(); } catch (_) { return '—'; } }

  // =====================================================================
  // BOOKS - list, search, edit, delete
  // =====================================================================
  let allBooks = [];
  async function loadBooks() {
    const q = ($('#book-search') && $('#book-search').value.trim()) || '';
    try {
      const { books } = await api('/api/books?per_page=100' + (q ? '&search=' + encodeURIComponent(q) : ''));
      allBooks = books;
      renderBooksTable(books);
    } catch (e) { toast(e.message, true); }
  }
  function renderBooksTable(books) {
    const tb = $('#books-table tbody'); tb.innerHTML = '';
    books.forEach((b) => {
      const tr = el('tr');
      tr.innerHTML =
        '<td>' + coverTd(b) + '</td>' +
        '<td><strong>' + esc(b.title) + '</strong></td>' +
        '<td>' + esc(b.author) + '</td>' +
        '<td>' + esc((b.category && b.category.name) || '—') + '</td>' +
        '<td>' + (b.chapter_count || 0) + '</td>' +
        '<td>' + (b.is_featured ? '✅' : '—') + '</td>' +
        '<td>' + (b.is_new_arrival ? '✅' : '—') + '</td>' +
        '<td>' + (b.views || 0) + '</td>';
      const actions = el('td');
      const editB = el('button', 'btn btn-sm btn-xs', 'Edit');
      editB.addEventListener('click', () => openEditor(b));
      const delB = el('button', 'btn btn-sm btn-danger btn-xs', 'Delete');
      delB.addEventListener('click', () => deleteBook(b));
      actions.append(editB, delB);
      tr.appendChild(actions);
      tb.appendChild(tr);
    });
    if (!books.length) tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No books found.</td></tr>';
  }
  $('#book-search').addEventListener('input', () => loadBooks());
  $('#new-book-btn').addEventListener('click', () => openEditor(null));

  async function deleteBook(b) {
    if (!confirm('Delete "' + b.title + '"? This also deletes all its chapters.')) return;
    try { await api('/api/books/' + b.id, { method: 'DELETE' }); toast('Book deleted'); loadBooks(); } catch (e) { toast(e.message, true); }
  }

  // =====================================================================
  // BOOK EDITOR - dynamic chapters + cover upload
  // =====================================================================
  let editingBook = null;
  async function openEditor(book) {
    // For editing, fetch the full detail (list response omits chapter content).
    if (book) {
      try {
        const { book: full } = await api('/api/books/' + book.id);
        book = full;
      } catch (_) { /* keep the list row if detail fails */ }
    }
    editingBook = book;
    switchTabEditor(book ? 'edit' : 'add');
    $('#b-title').value = book ? book.title : '';
    $('#b-author').value = book ? book.author : '';
    $('#b-description').value = book ? (book.description || '') : '';
    $('#b-category').value = book && book.category_id ? book.category_id : '';
    $('#b-featured').checked = book ? !!book.is_featured : false;
    $('#b-newarrival').checked = book ? !!book.is_new_arrival : false;
    $('#b-cover').value = '';

    const chapBox = $('#chapters-container'); chapBox.innerHTML = '';
    if (book && book.chapters && book.chapters.length) {
      book.chapters.slice().sort((a, b) => a.chapter_no - b.chapter_no).forEach((c) => addChapterRow(c));
    } else {
      addChapterRow();
    }
  }
  // Add an editable chapter block (prefill from an existing chapter if given)
  function addChapterRow(chapter) {
    const box = el('div', 'chapter-block');
    const num = (chapter && chapter.chapter_no) || '';
    const title = (chapter && chapter.title) || '';
    const content = (chapter && chapter.content) || '';
    const chapId = (chapter && chapter.id) || '';
    box.innerHTML =
      '<div class="row">' +
      '<input class="ch-no" type="number" min="1" placeholder="No." value="' + num + '" style="width:70px">' +
      '<input class="ch-title" type="text" placeholder="Chapter title" value="' + esc(title) + '">' +
      '<input type="hidden" class="ch-id" value="' + chapId + '">' +
      '<button type="button" class="btn btn-sm btn-danger btn-xs ch-remove">Remove</button>' +
      '</div>' +
      '<textarea class="ch-content" rows="5" placeholder="Chapter content (text)…">' + esc(content) + '</textarea>';
    box.querySelector('.ch-remove').addEventListener('click', () => { if (confirm('Remove this chapter?')) box.remove(); });
    $('#chapters-container').appendChild(box);
  }
  $('#add-chapter-btn').addEventListener('click', () => addChapterRow());

  function switchTabEditor(mode) {
    $$('.main section').forEach((s) => s.classList.add('hidden'));
    $('#tab-book-editor').classList.remove('hidden');
    $('#editor-title').textContent = mode === 'add' ? 'Add New Book' : 'Edit Book';
    $('#save-book-btn').textContent = mode === 'add' ? 'Save Book' : 'Save Changes';
  }
  $('#editor-back').addEventListener('click', () => { switchTab('books'); });

  // ---- Save book (create or update) --------------------------------
  $('#book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('#b-title').value.trim();
    const author = $('#b-author').value.trim();
    if (!title || !author) return toast('Title and author are required.', true);

    const chapters = $$('#chapters-container .chapter-block').map((blk) => ({
      id: blk.querySelector('.ch-id').value,
      chapter_no: Number(blk.querySelector('.ch-no').value || 0),
      title: blk.querySelector('.ch-title').value.trim(),
      content: blk.querySelector('.ch-content').value,
    }));

    const fd = new FormData();
    fd.append('title', title);
    fd.append('author', author);
    fd.append('description', $('#b-description').value);
    fd.append('category_id', $('#b-category').value);
    fd.append('is_featured', $('#b-featured').checked ? 'true' : 'false');
    fd.append('is_new_arrival', $('#b-newarrival').checked ? 'true' : 'false');
    const cover = $('#b-cover').files[0];
    if (cover) fd.append('cover', cover);

    const btn = $('#save-book-btn'); btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const base = '/api/books' + (editingBook ? '/' + editingBook.id : '');
      const method = editingBook ? 'PUT' : 'POST';
      const { book } = await api(base, { method, body: fd });
      // Save / update chapters
      await saveChapters(book.id, chapters);
      toast(editingBook ? 'Book updated' : 'Book created');
      switchTab('books');
    } catch (err) { toast(err.message, true); }
    btn.disabled = false; btn.textContent = editingBook ? 'Save Changes' : 'Save Book';
  });

  // Compare existing vs new chapters; create new, update changed, delete removed.
  async function saveChapters(bookId, chapters) {
    const existing = new Map((editingBook?.chapters || []).map((c) => [c.id, c]));
    const seen = new Set();

    for (const ch of chapters) {
      if (ch.title.trim() === '' || ch.content.trim() === '') continue;
      if (ch.id && existing.has(ch.id)) {
        // Update existing
        const prev = existing.get(ch.id);
        if (prev.title !== ch.title || prev.content !== ch.content || prev.chapter_no !== ch.chapter_no) {
          await api('/api/chapters/' + ch.id, { method: 'PUT', body: { title: ch.title, content: ch.content, chapter_no: ch.chapter_no } });
        }
        seen.add(ch.id);
      } else if (ch.id) {
        // A chapter that was deleted then re-added with same id - skip safe
        seen.add(ch.id);
      } else {
        // New chapter
        await api('/api/books/' + bookId + '/chapters', { method: 'POST', body: { title: ch.title, content: ch.content, chapter_no: ch.chapter_no || undefined } });
      }
    }
    // Delete removed chapters
    for (const [id] of existing) {
      if (!seen.has(id)) await api('/api/chapters/' + id, { method: 'DELETE' });
    }
  }

  // =====================================================================
  // CATEGORIES
  // =====================================================================
  async function loadCategories() {
    try {
      const { categories } = await api('/api/categories?with_books=true');
      const tb = $('#cats-table tbody'); tb.innerHTML = '';
      categories.forEach((c) => {
        const tr = el('tr');
        tr.innerHTML = '<td><strong>' + esc(c.name) + '</strong></td><td>' + esc(c.slug) + '</td><td>' + (c.book_count || 0) + '</td>';
        const actions = el('td');
        const del = el('button', 'btn btn-sm btn-danger btn-xs', 'Delete');
        del.addEventListener('click', () => deleteCategory(c));
        actions.appendChild(del);
        tr.appendChild(actions);
        tb.appendChild(tr);
      });
      // Populate category selectors
      const sel = $('#b-category'); const featSel = $('#featured-select');
      [sel, featSel].forEach((s) => { const keep = s.value; s.innerHTML = '<option value="">—</option>'; categories.forEach((c) => { const o = el('option', '', c.name); o.value = c.id; s.appendChild(o); }); s.value = keep; });
      await loadNonFeatured();
    } catch (e) { toast(e.message, true); }
  }
  $('#add-cat-btn').addEventListener('click', async () => {
    const name = $('#cat-name').value.trim();
    if (!name) return toast('Category name required.', true);
    try { await api('/api/categories', { method: 'POST', body: { name, description: $('#cat-desc').value } }); toast('Category added'); $('#cat-name').value = ''; $('#cat-desc').value = ''; loadCategories(); } catch (e) { toast(e.message, true); }
  });
  async function deleteCategory(c) {
    if (!confirm('Delete category "' + c.name + '"? Books keep but lose the category.')) return;
    try { await api('/api/categories/' + c.id, { method: 'DELETE' }); toast('Category deleted'); loadCategories(); } catch (e) { toast(e.message, true); }
  }

  // =====================================================================
  // FEATURED management
  // =====================================================================
  async function loadNonFeatured() {
    try {
      const { books } = await api('/api/books?per_page=100');
      const { featured } = await api('/api/featured');
      const featIds = new Set((featured || []).map((f) => f.id));
      const sel = $('#featured-select');
      sel.innerHTML = '';
      books.filter((b) => !featIds.has(b.id)).forEach((b) => {
        const o = el('option', '', b.title + ' — ' + b.author); o.value = b.id; sel.appendChild(o);
      });
    } catch (_) {}
  }
  async function loadFeatured() {
    try {
      const { featured } = await api('/api/featured');
      const tb = $('#featured-table tbody'); tb.innerHTML = '';
      featured.forEach((b, i) => {
        const tr = el('tr');
        tr.innerHTML = '<td>' + (i + 1) + '</td><td><strong>' + esc(b.title) + '</strong></td><td>' + esc(b.author) + '</td>';
        const actions = el('td');
        const up = el('button', 'btn btn-sm btn-xs', '▲'); up.addEventListener('click', () => moveFeatured(i, -1));
        const down = el('button', 'btn btn-sm btn-xs', '▼'); down.addEventListener('click', () => moveFeatured(i, 1));
        const rm = el('button', 'btn btn-sm btn-danger btn-xs', 'Remove'); rm.addEventListener('click', () => removeFeatured(b.id));
        actions.append(up, down, rm);
        tr.appendChild(actions);
        tb.appendChild(tr);
      });
      await loadNonFeatured();
    } catch (e) { toast(e.message, true); }
  }
  $('#add-featured-btn').addEventListener('click', async () => {
    const id = $('#featured-select').value;
    if (!id) return toast('Select a book to feature.', true);
    try { await api('/api/featured', { method: 'POST', body: { book_id: id } }); toast('Added to featured'); loadFeatured(); } catch (e) { toast(e.message, true); }
  });
  async function moveFeatured(index, dir) {
    const { featured } = await api('/api/featured');
    const arr = featured.slice();
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    const t = arr[index]; arr[index] = arr[target]; arr[target] = t;
    try { await api('/api/featured/reorder', { method: 'PUT', body: { order: arr.map((b) => b.id) } }); loadFeatured(); } catch (e) { toast(e.message, true); }
  }
  async function removeFeatured(id) {
    try { await api('/api/featured/' + id, { method: 'DELETE' }); toast('Removed from featured'); loadFeatured(); } catch (e) { toast(e.message, true); }
  }

  // =====================================================================
  // NEW ARRIVALS
  // =====================================================================
  async function loadNewArrivals() {
    try {
      const { books } = await api('/api/books/new-arrivals?limit=50');
      const tb = $('#newarrivals-table tbody'); tb.innerHTML = '';
      books.forEach((b) => {
        const tr = el('tr');
        tr.innerHTML =
          '<td>' + coverTd(b) + '</td><td><strong>' + esc(b.title) + '</strong></td>' +
          '<td>' + esc(b.author) + '</td><td>' + fmtDate(b.created_at) + '</td>';
        const actions = el('td');
        const rm = el('button', 'btn btn-sm btn-danger btn-xs', 'Remove');
        rm.addEventListener('click', async () => { try { await api('/api/books/' + b.id, { method: 'PUT', body: { is_new_arrival: false } }); toast('Removed from new arrivals'); loadNewArrivals(); } catch (e) { toast(e.message, true); } });
        actions.appendChild(rm);
        tr.appendChild(actions);
        tb.appendChild(tr);
      });
      if (!books.length) tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No new arrivals yet.</td></tr>';
    } catch (e) { toast(e.message, true); }
  }

})();
