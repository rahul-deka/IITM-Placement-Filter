(function () {
  'use strict';

  function findTargetTable() {
    const tables = Array.from(document.querySelectorAll('table'));
    if (!tables.length) return null;
    let best = null;
    let bestScore = -1;
    tables.forEach((t) => {
      const rows = t.querySelectorAll('tr').length;
      const ths = t.querySelectorAll('th').length;
      const score = rows + ths * 10;
      if (score > bestScore) {
        best = t;
        bestScore = score;
      }
    });
    return best;
  }

  function getText(node) {
    return (node && node.textContent || '').trim();
  }

  function addColumnFilterIcons(table) {
    const thead = table.querySelector('thead');
    const headerRow = thead ? thead.querySelector('tr') : table.querySelector('tr');
    if (!headerRow) return null;
    const headers = Array.from(headerRow.querySelectorAll('th, td'));

    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const allRows = bodyRows.length ? bodyRows : Array.from(table.querySelectorAll('tr')).slice(1);

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('pf-filters-v2') || '{}');
    } catch (e) {
      saved = {};
    }

    headerRow.classList.add('pf-has-filters');

    headers.forEach((h, colIndex) => {
      if (h.querySelector('.pf-filter-icon')) return;

      const title = getText(h) || `col-${colIndex}`;
      const colValues = allRows.map((r) => getText(r.children[colIndex]));
      const unique = Array.from(new Set(colValues.filter((s) => s)));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pf-filter-icon';
      btn.title = `Filter ${title}`;
      btn.style.marginLeft = '6px';
      btn.style.padding = '2px 6px';
      btn.style.cursor = 'pointer';
      btn.style.border = '1px solid transparent';
      btn.style.background = 'transparent';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.height = '20px';
      btn.style.width = '22px';
      btn.style.lineHeight = '1';
      btn.style.fontSize = '12px';
      btn.innerHTML = '\u25BC';

      const pop = document.createElement('div');
      pop.className = 'pf-popover';
      pop.style.position = 'absolute';
      pop.style.minWidth = '200px';
      pop.style.background = '#fff';
      pop.style.border = '1px solid #ccc';
      pop.style.padding = '8px';
      pop.style.borderRadius = '6px';
      pop.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      pop.style.zIndex = '10000';
      pop.style.display = 'none';

      const lbl = document.createElement('div');
      lbl.textContent = title;
      lbl.style.fontWeight = '600';
      lbl.style.marginBottom = '6px';
      pop.appendChild(lbl);

      let control;
      if (unique.length > 1 && unique.length <= 100) {
        control = document.createElement('select');
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '— any —';
        control.appendChild(emptyOpt);
        unique.sort((a, b) => a.localeCompare(b)).forEach((v) => {
          const o = document.createElement('option');
          o.value = v;
          o.textContent = v;
          control.appendChild(o);
        });
      } else {
        control = document.createElement('input');
        control.type = 'text';
        control.placeholder = 'filter...';
        control.style.width = '100%';
      }

      control.dataset.colIndex = colIndex;
      control.style.padding = '6px';
      control.style.border = '1px solid #ccc';
      control.style.borderRadius = '4px';
      pop.appendChild(control);

      const actions = document.createElement('div');
      actions.style.marginTop = '8px';
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const applyBtn = document.createElement('button');
      applyBtn.textContent = 'Apply';
      applyBtn.style.padding = '6px 8px';
      applyBtn.style.cursor = 'pointer';

      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear';
      clearBtn.style.padding = '6px 8px';
      clearBtn.style.cursor = 'pointer';

      actions.appendChild(applyBtn);
      actions.appendChild(clearBtn);
      pop.appendChild(actions);

      document.body.appendChild(pop);

      function positionPopover() {
        const rect = h.getBoundingClientRect();
        pop.style.top = (window.scrollY + rect.bottom + 6) + 'px';
        pop.style.left = (window.scrollX + rect.left) + 'px';
      }

      function showPopover() {
        positionPopover();
        pop.style.display = 'block';
        pop.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
      }

      function hidePopover() {
        pop.style.display = 'none';
        pop.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }

      if (saved && saved[title] != null && saved[title] !== '') {
        if (control.tagName === 'SELECT') {
          const opt = Array.from(control.options).find((o) => o.value === saved[title]);
          if (opt) control.value = saved[title];
        } else {
          control.value = saved[title];
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pop.style.display === 'block') hidePopover();
        else {
          showPopover();
          control.focus();
        }
      });

      btn.addEventListener('keydown', (ev) => {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          btn.click();
        }
        if (ev.key === 'Escape') hidePopover();
      });

      applyBtn.addEventListener('click', () => {
        const val = control.value || '';
        setFilter(colIndex, title, control.tagName, val);
        saveFiltersV2();
        applyFiltersV2(table);
        hidePopover();
      });

      clearBtn.addEventListener('click', () => {
        control.value = '';
        setFilter(colIndex, title, control.tagName, '');
        saveFiltersV2();
        applyFiltersV2(table);
        hidePopover();
      });

      if (control.tagName === 'SELECT') control.addEventListener('change', () => { applyBtn.click(); });
      if (control.tagName === 'INPUT') control.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') applyBtn.click(); });

      document.addEventListener('click', (ev) => { if (!pop.contains(ev.target) && ev.target !== btn) hidePopover(); });
      window.addEventListener('resize', hidePopover);
      window.addEventListener('scroll', hidePopover, true);

      const prevPosition = window.getComputedStyle(h).position;
      if (!prevPosition || prevPosition === 'static') {
        h.style.position = 'relative';
      }

      btn.style.position = 'absolute';
      btn.style.right = '6px';
      btn.style.top = '50%';
      btn.style.transform = 'translateY(-50%)';
      btn.style.marginLeft = '';
      h.appendChild(btn);
    });

    window.__pf_filters_v2 = window.__pf_filters_v2 || {};

    function setFilter(colIndex, title, tagName, value) {
      const key = title;
      window.__pf_filters_v2[key] = { colIndex: Number(colIndex), tag: tagName, value: (value || '') };
    }

    function saveFiltersV2() {
      try {
        const out = {};
        Object.keys(window.__pf_filters_v2).forEach((k) => { out[k] = window.__pf_filters_v2[k].value; });
        localStorage.setItem('pf-filters-v2', JSON.stringify(out));
      } catch (e) {
        console.warn('pf: save v2 failed', e);
      }
    }

    function applyFiltersV2(table) {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach((row) => {
        let show = true;
        Object.values(window.__pf_filters_v2).forEach((f) => {
          const idx = f.colIndex;
          const cell = row.children[idx];
          const cellText = getText(cell).toLowerCase();
          const val = (f.value || '').toLowerCase().trim();
          if (!val) return;
          if (f.tag === 'INPUT') {
            if (!cellText.includes(val)) show = false;
          } else {
            if (cellText !== val) show = false;
          }
        });
        row.style.display = show ? '' : 'none';
      });
    }

    try {
      Object.keys(saved).forEach((title) => {
        const val = saved[title];
        const header = headers.find((h) => getText(h) === title);
        if (!header) return;
        const idx = headers.indexOf(header);
        window.__pf_filters_v2[title] = { colIndex: idx, tag: 'INPUT', value: val };
      });
    } catch (e) {}

    applyFiltersV2(table);
    window.__pf_applyFiltersV2 = () => applyFiltersV2(table);
    window.__pf_saveFiltersV2 = saveFiltersV2;
    return { applyFiltersV2 };
  }

  function applyFilters(table, filters) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach((row) => {
      let show = true;
      filters.forEach((f) => {
        const idx = Number(f.dataset.colIndex);
        const cell = row.children[idx];
        const cellText = getText(cell).toLowerCase();
        const val = (f.value || '').toLowerCase().trim();
        if (!val) return;
        if (f.tagName === 'INPUT') {
          if (!cellText.includes(val)) show = false;
        } else if (f.tagName === 'SELECT') {
          if (cellText !== val) show = false;
        }
      });
      row.style.display = show ? '' : 'none';
    });
  }

  function saveFilters(filters) {
    try {
      const data = filters.map((f) => f.value || '');
      localStorage.setItem('pf-filters', JSON.stringify(data));
    } catch (e) {
      console.warn('pf: save failed', e);
    }
  }

  function loadFilters(filters) {
    try {
      const raw = localStorage.getItem('pf-filters');
      if (!raw) return;
      const arr = JSON.parse(raw);
      filters.forEach((f, i) => {
        if (arr[i] != null) {
          f.value = arr[i];
          if (f.tagName === 'SELECT') {
            const opt = Array.from(f.options).find((o) => o.value === arr[i]);
            if (opt) f.value = arr[i];
          }
        }
      });
    } catch (e) {
      console.warn('pf: load failed', e);
    }
  }

  function shouldLoadAll() {
    return localStorage.getItem('pf-load-all') === 'true';
  }

  function toggleLoadAll() {
    const pagination = document.querySelector('.pagination');
    if (pagination) {
      try { localStorage.setItem('pf-load-all', 'true'); } catch (e) {}
      loadAllPages();
    } else {
      try { localStorage.setItem('pf-load-all', 'false'); } catch (e) {}
      window.location.reload();
    }
  }

  async function loadAllPages() {
    const table = findTargetTable();
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const pagination = document.querySelector('.pagination');
    if (!pagination) {
      alert('No pagination found - already showing all entries?');
      return;
    }

    const pageLinks = Array.from(pagination.querySelectorAll('a.page-link'))
      .map((a) => a.href)
      .filter((href) => href && href.includes('page='));

    if (pageLinks.length === 0) {
      alert('No additional pages found');
      return;
    }

    const pageNumbers = pageLinks
      .map((href) => {
        const match = href.match(/page=(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((n) => n !== null);

    const maxPage = Math.max(...pageNumbers);
    const currentPage = 1;

    const loadingMsg = document.createElement('div');
    loadingMsg.style.position = 'fixed';
    loadingMsg.style.top = '50%';
    loadingMsg.style.left = '50%';
    loadingMsg.style.transform = 'translate(-50%, -50%)';
    loadingMsg.style.background = 'rgba(0,0,0,0.8)';
    loadingMsg.style.color = '#fff';
    loadingMsg.style.padding = '20px 40px';
    loadingMsg.style.borderRadius = '8px';
    loadingMsg.style.zIndex = '10002';
    loadingMsg.style.fontSize = '16px';
    loadingMsg.textContent = 'Loading all pages... (0%)';
    document.body.appendChild(loadingMsg);

    try {
      setLoadButtonLoading(true);
      let totalRowsAdded = 0;
      for (let page = currentPage + 1; page <= maxPage; page++) {
        loadingMsg.textContent = `Loading page ${page}/${maxPage}... (${Math.round((page - 1) / maxPage * 100)}%)`;
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        const response = await fetch(url.toString());
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const pageTables = doc.querySelectorAll('table.table-striped');
        for (const pageTable of pageTables) {
          const pageRows = pageTable.querySelectorAll('tbody tr');
          pageRows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 1 && !row.textContent.toLowerCase().includes('no records')) {
              tbody.appendChild(row.cloneNode(true));
              totalRowsAdded++;
            }
          });
        }
      }

      loadingMsg.textContent = `✓ Loaded ${totalRowsAdded} additional rows from ${maxPage - currentPage} pages!`;
      setTimeout(() => loadingMsg.remove(), 2500);

      const allRows = tbody.querySelectorAll('tr');
      allRows.forEach((row, index) => {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell && !row.textContent.toLowerCase().includes('no records')) {
          firstCell.textContent = (index + 1).toString();
        }
      });

      if (pagination.parentElement) {
        pagination.parentElement.style.display = 'none';
      }

      window.__pf_filters_v2 = {};
      const headerRow = table.querySelector('thead tr');
      if (headerRow) {
        headerRow.classList.remove('pf-has-filters');
        headerRow.querySelectorAll('.pf-filter-icon').forEach((btn) => btn.remove());
        document.querySelectorAll('.pf-popover').forEach((pop) => pop.remove());
      }

      addColumnFilterIcons(table);
      setLoadButtonLoading(false);
    } catch (error) {
      loadingMsg.textContent = '✗ Error loading pages: ' + error.message;
      loadingMsg.style.background = 'rgba(220,53,69,0.9)';
      setTimeout(() => loadingMsg.remove(), 3000);
      console.error('Load all pages error:', error);
      setLoadButtonLoading(false);
    }
  }

  function ensureLoadButtonStyles() {
    if (document.querySelector('style#pf-load-styles')) return;
    const s = document.createElement('style');
    s.id = 'pf-load-styles';
    s.textContent = '@keyframes pf-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .pf-rotate { animation: pf-rotate 1s linear infinite; display:inline-block; vertical-align:middle; }';
    document.head.appendChild(s);
  }

  function buildLoadButtonContent(hasPagination) {
    const icon = `<svg viewBox="0 0 256 256" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="vertical-align:middle;display:inline-block"><g><g><g><path fill="currentColor" d="M119,29.8C92.3,32.1,66.8,45.6,50,66.3C41.2,77.2,33.8,92,30.7,104.6l-0.8,3.4h-8.7h-8.8l-1,1.4c-0.6,0.8-1.1,2.4-1.3,3.7c-0.4,4,0.5,5.1,15.7,19.9c7.6,7.4,14.4,13.7,15.1,14c2,0.7,4.8,0.6,6.7-0.4c0.9-0.5,7.9-7.2,15.5-14.8c15.2-15.3,15.4-15.5,14.3-19.8c-1-4.1-0.6-4-14.6-4c-7.5,0-12.3-0.2-12.3-0.5c0-0.6,3-8.6,4.3-11.6c3.8-8.4,10.1-17.1,17.4-24.2C86,58.5,102.5,51,121.7,49.5c25.8-2.1,52.7,9.7,68.9,30c1.7,2.1,3.2,3.9,3.4,3.9c0.7,0,15.6-10.6,15.6-11.1c0-1-4.7-6.9-9.8-12c-14.2-14.7-31.2-24.1-51.7-28.6C140.4,29.9,127.2,29.1,119,29.8z"/><path fill="currentColor" d="M209.3,108.1c-1.2,0.3-5,3.8-15.2,14c-7.5,7.5-14.1,14.3-14.6,15.1c-1.3,2.1-1.3,5.9-0.1,8l0.9,1.6l12.1,0.2l12.1,0.2l-1.3,3.9c-7.9,24.5-27.7,44.1-52.1,51.8c-25.8,8.1-54.6,2.6-75.5-14.6c-4-3.3-10.1-9.5-12.8-13.2c-1.3-1.7-2.2-2.6-2.6-2.5c-0.6,0.2-9.8,6.5-14.2,9.6l-1.7,1.3l3.3,4.4c14,18.2,36.1,31.8,58.9,36.4c40.5,8.1,81-8.5,103.5-42.6c6.2-9.4,10.4-18.4,13.2-29l1.5-5.6l9.4-0.2c9.4-0.2,9.4-0.2,10.3-1.4c1.1-1.4,1.5-4,1.1-6.4c-0.3-1.5-2.1-3.6-14.3-15.9c-9.2-9.2-14.7-14.4-15.9-15C213.6,107.5,211.8,107.4,209.3,108.1z"/></g></g></g></svg>`;
    return icon + `<span style="margin-left:8px;vertical-align:middle">${hasPagination ? 'Load All Pages' : 'Reload Page'}</span>`;
  }

  function setLoadButtonLoading(isLoading) {
    const btn = document.querySelector('.pf-load-all-btn');
    if (!btn) return;
    ensureLoadButtonStyles();
    const hasPagination = !!document.querySelector('.pagination');
    if (isLoading) {
      const spinner = `<svg viewBox="0 0 256 256" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="pf-rotate" style="vertical-align:middle;display:inline-block"><g><g><g><path fill="currentColor" d="M119,29.8C92.3,32.1,66.8,45.6,50,66.3C41.2,77.2,33.8,92,30.7,104.6l-0.8,3.4h-8.7h-8.8l-1,1.4c-0.6,0.8-1.1,2.4-1.3,3.7c-0.4,4,0.5,5.1,15.7,19.9c7.6,7.4,14.4,13.7,15.1,14c2,0.7,4.8,0.6,6.7-0.4c0.9-0.5,7.9-7.2,15.5-14.8c15.2-15.3,15.4-15.5,14.3-19.8c-1-4.1-0.6-4-14.6-4c-7.5,0-12.3-0.2-12.3-0.5c0-0.6,3-8.6,4.3-11.6c3.8-8.4,10.1-17.1,17.4-24.2C86,58.5,102.5,51,121.7,49.5c25.8-2.1,52.7,9.7,68.9,30c1.7,2.1,3.2,3.9,3.4,3.9c0.7,0,15.6-10.6,15.6-11.1c0-1-4.7-6.9-9.8-12c-14.2-14.7-31.2-24.1-51.7-28.6C140.4,29.9,127.2,29.1,119,29.8z"/><path fill="currentColor" d="M209.3,108.1c-1.2,0.3-5,3.8-15.2,14c-7.5,7.5-14.1,14.3-14.6,15.1c-1.3,2.1-1.3,5.9-0.1,8l0.9,1.6l12.1,0.2l12.1,0.2l-1.3,3.9c-7.9,24.5-27.7,44.1-52.1,51.8c-25.8,8.1-54.6,2.6-75.5-14.6c-4-3.3-10.1-9.5-12.8-13.2c-1.3-1.7-2.2-2.6-2.6-2.5c-0.6,0.2-9.8,6.5-14.2,9.6l-1.7,1.3l3.3,4.4c14,18.2,36.1,31.8,58.9,36.4c40.5,8.1,81-8.5,103.5-42.6c6.2-9.4,10.4-18.4,13.2-29l1.5-5.6l9.4-0.2c9.4-0.2,9.4-0.2,10.3-1.4c1.1-1.4,1.5-4,1.1-6.4c-0.3-1.5-2.1-3.6-14.3-15.9c-9.2-9.2-14.7-14.4-15.9-15C213.6,107.5,211.8,107.4,209.3,108.1z"/></g></g></g></svg>`;
      btn.innerHTML = spinner + `<span style="margin-left:8px;vertical-align:middle">Loading...</span>`;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.innerHTML = buildLoadButtonContent(hasPagination);
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
  }

  function addLoadAllButton() {
    if (document.querySelector('.pf-load-all-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'pf-load-all-btn btn btn-sm btn-info';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '10001';
    btn.style.padding = '10px 16px';
    btn.style.borderRadius = '6px';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = '600';

    const hasPagination = !!document.querySelector('.pagination');
    const loadingSvg = `<svg viewBox="0 0 256 256" width="14" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="vertical-align:middle;display:inline-block"><g><g><g><path fill="currentColor" d="M119,29.8C92.3,32.1,66.8,45.6,50,66.3C41.2,77.2,33.8,92,30.7,104.6l-0.8,3.4h-8.7h-8.8l-1,1.4c-0.6,0.8-1.1,2.4-1.3,3.7c-0.4,4,0.5,5.1,15.7,19.9c7.6,7.4,14.4,13.7,15.1,14c2,0.7,4.8,0.6,6.7-0.4c0.9-0.5,7.9-7.2,15.5-14.8c15.2-15.3,15.4-15.5,14.3-19.8c-1-4.1-0.6-4-14.6-4c-7.5,0-12.3-0.2-12.3-0.5c0-0.6,3-8.6,4.3-11.6c3.8-8.4,10.1-17.1,17.4-24.2C86,58.5,102.5,51,121.7,49.5c25.8-2.1,52.7,9.7,68.9,30c1.7,2.1,3.2,3.9,3.4,3.9c0.7,0,15.6-10.6,15.6-11.1c0-1-4.7-6.9-9.8-12c-14.2-14.7-31.2-24.1-51.7-28.6C140.4,29.9,127.2,29.1,119,29.8z"/><path fill="currentColor" d="M209.3,108.1c-1.2,0.3-5,3.8-15.2,14c-7.5,7.5-14.1,14.3-14.6,15.1c-1.3,2.1-1.3,5.9-0.1,8l0.9,1.6l12.1,0.2l12.1,0.2l-1.3,3.9c-7.9,24.5-27.7,44.1-52.1,51.8c-25.8,8.1-54.6,2.6-75.5-14.6c-4-3.3-10.1-9.5-12.8-13.2c-1.3-1.7-2.2-2.6-2.6-2.5c-0.6,0.2-9.8,6.5-14.2,9.6l-1.7,1.3l3.3,4.4c14,18.2,36.1,31.8,58.9,36.4c40.5,8.1,81-8.5,103.5-42.6c6.2-9.4,10.4-18.4,13.2-29l1.5-5.6l9.4-0.2c9.4-0.2,9.4-0.2,10.3-1.4c1.1-1.4,1.5-4,1.1-6.4c-0.3-1.5-2.1-3.6-14.3-15.9c-9.2-9.2-14.7-14.4-15.9-15C213.6,107.5,211.8,107.4,209.3,108.1z"/></g></g></g></svg>`;
    btn.innerHTML = loadingSvg + `<span style="margin-left:8px;vertical-align:middle">${hasPagination ? 'Load All Pages' : 'Reload Page'}</span>`;
    btn.title = hasPagination ? 'Fetch and display all pages at once' : 'Reload to restore pagination';
    btn.setAttribute('aria-label', hasPagination ? 'Load All Pages' : 'Reload Page');

    if (hasPagination) {
      btn.style.background = '#17a2b8';
      btn.style.color = '#fff';
      btn.style.border = '1px solid #17a2b8';
    } else {
      btn.style.background = '#28a745';
      btn.style.color = '#fff';
      btn.style.border = '1px solid #28a745';
    }

    btn.addEventListener('click', toggleLoadAll);
    document.body.appendChild(btn);
  }

  function init() {
    const table = findTargetTable();
    if (!table) return;
    const thead = table.querySelector('thead');
    const headerRow = thead ? thead.querySelector('tr') : table.querySelector('tr');
    if (headerRow && headerRow.classList.contains('pf-has-filters')) return;
    addColumnFilterIcons(table);
    addLoadAllButton();

    try {
      if (shouldLoadAll() && !window.__pf_loadAll_autoTriggered) {
        const pagination = document.querySelector('.pagination');
        if (pagination) {
          window.__pf_loadAll_autoTriggered = true;
          setTimeout(() => { loadAllPages(); }, 50);
        }
      }
    } catch (e) {}
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const obs = new MutationObserver((mutations) => { init(); });
  obs.observe(document.body, { childList: true, subtree: true });
})();