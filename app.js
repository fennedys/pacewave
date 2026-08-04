// =====================================================================
// PaceWave Library - shared frontend logic
// ---------------------------------------------------------------------
// Central config + utilities used across index.html, library.html and
// reader.html. Sets the API base URL and provides fetch helpers and DOM
// utilities for rendering book cards.
// =====================================================================
(function () {
  'use strict';

  // ---- CONFIG -----------------------------------------------------
  // Change this if the API is hosted somewhere other than the current origin.
  const API_BASE = window.PACEWAVE_API_BASE || '';

  // ---- Fetch helper with JSON + error handling ---------------------
  async function api(path, options = {}) {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };
    if (options.body && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }
    const res = await fetch(API_BASE + path, config);
    if (!res.ok) {
      let message = 'Request failed';
      try {
        const data = await res.json();
        message = data.error || message;
      } catch (_) {
        /* ignore parse errors */
      }
      throw new Error(message);
    }
    return res.json();
  }

  // ---- DOM utilities ------------------------------------------------
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // ---- Cover placeholder (inline SVG, no external assets) ----------
  function coverPlaceholder(book) {
    const initials = (book.title || 'Bk').trim().charAt(0).toUpperCase();
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#2563eb"/>` +
      `</linearGradient></defs>` +
      `<rect width="300" height="420" rx="14" fill="url(#g)"/>` +
      `<text x="150" y="230" font-family="Georgia,serif" font-size="110" fill="rgba(255,255,255,.85)" text-anchor="middle">${initials}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function coverSrc(book) {
    return book && book.cover_url ? book.cover_url : coverPlaceholder(book || {});
  }

  // ---- Book card builder (used on homepage + library) ---------------
  function renderBookCard(book) {
    const card = el('article', 'book-card');
    card.setAttribute('data-id', book.id);

    const cat = (book.category && book.category.name) || 'General';
    const desc = (book.description || '').slice(0, 110);
    const chapterCount = book.chapter_count || (book.chapters ? book.chapters.length : 0);

    card.innerHTML =
      `<a class="book-cover-link" href="reader.html?book=${encodeURIComponent(book.id)}">` +
      `  <img class="book-cover" src="${coverSrc(book)}" alt="Cover of ${book.title}" loading="lazy">` +
      `</a>` +
      `<div class="book-info">` +
      `  <span class="book-badges">` +
      (book.is_featured ? `<span class="badge badge-featured">Featured</span>` : '') +
      (book.is_new_arrival ? `<span class="badge badge-new">New</span>` : '') +
      `  </span>` +
      `  <h3 class="book-title">${escapeHtml(book.title)}</h3>` +
      `  <p class="book-author">${escapeHtml(book.author)}</p>` +
      `  <p class="book-cat">${escapeHtml(cat)} · ${chapterCount} ch</p>` +
      `  <p class="book-desc">${escapeHtml(desc)}${desc.length === 110 ? '…' : ''}</p>` +
      `  <a class="btn btn-read" href="reader.html?book=${encodeURIComponent(book.id)}">Read</a>` +
      `</div>`;

    return card;
  }

  function renderBooks(container, books) {
    clear(container);
    if (!books || !books.length) {
      const empty = el('div', 'empty-state');
      empty.innerHTML =
        '<span class="empty-icon">📚</span>' +
        '<p>No books found. Try a different search.</p>';
      container.appendChild(empty);
      return;
    }
    books.forEach((b) => container.appendChild(renderBookCard(b)));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // ---- Navbar (injected by each page) ------------------------------
  function renderNav(active) {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    const links = [
      ['/', 'Home'],
      ['/library.html', 'Library'],
      ['/categories.html', 'Categories'],
      ['/search.html', 'Search'],
    ];
    nav.innerHTML =
      `<a href="/" class="brand">` +
      `  <span class="brand-mark">⌘</span>` +
      `  <span>PaceWave <strong>Library</strong></span>` +
      `</a>` +
      `<button class="nav-toggle" aria-label="Menu">☰</button>` +
      `<div class="nav-links">` +
      links
        .map(
          ([href, label]) =>
            `<a href="${href}" class="${label.toLowerCase() === active ? 'active' : ''}">${label}</a>`
        )
        .join('') +
      `</div>`;

    // Mobile toggle
    const toggle = nav.querySelector('.nav-toggle');
    const linksBox = nav.querySelector('.nav-links');
    toggle.addEventListener('click', () => linksBox.classList.toggle('open'));
  }

  // ---- Footer (injected by each page) ------------------------------
  function renderFooter() {
    const foot = document.getElementById('site-footer');
    if (!foot) return;
    const year = new Date().getFullYear();
    foot.innerHTML =
      `<div class="footer-inner">` +
      `  <div>` +
      `    <span class="brand-mark">⌘</span> <strong>PaceWave Library</strong>` +
      `    <p>Read books anytime, anywhere.</p>` +
      `  </div>` +
      `  <div class="footer-links">` +
      `    <a href="/">Home</a><a href="/library.html">Library</a>` +
      `    <a href="/categories.html">Categories</a><a href="/search.html">Search</a>` +
      `  </div>` +
      `  <div class="footer-copy">© ${year} PaceWave Library</div>` +
      `</div>`;
  }

  // ---- Skeleton loader (shown while data fetches) ------------------
  function showSkeleton(container, count = 8) {
    clear(container);
    for (let i = 0; i < count; i++) {
      const s = el('div', 'book-card skeleton');
      s.innerHTML = '<div class="sk-cover"></div><div class="sk-line"></div><div class="sk-line short"></div>';
      container.appendChild(s);
    }
  }

  // Expose public API
  window.PW = { api, el, clear, renderBookCard, renderBooks, coverSrc, renderNav, renderFooter, showSkeleton, escapeHtml, API_BASE };
})();
