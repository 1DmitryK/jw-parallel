// JW Dual Parallel Reader - Core Application Logic
// 100% Private, Zero Tracking, LocalStorage Only

(function () {
  'use strict';

  // --- Predefined URL Map for Instant Parallel Navigation ---
  const PRESETS = {
    'daily-text': {
      title: 'Стих на день / Щоденний текст',
      urls: {
        uk: 'https://wol.jw.org/uk/wol/h/r15/lp-k',
        ru: 'https://wol.jw.org/ru/wol/h/r2/lp-u',
        en: 'https://wol.jw.org/en/wol/h/r1/lp-e'
      }
    },
    'library': {
      title: 'Главная / Бібліотека',
      urls: {
        uk: 'https://www.jw.org/uk/',
        ru: 'https://www.jw.org/ru/',
        en: 'https://www.jw.org/en/'
      }
    }
  };

  // State
  let syncEnabled = true;
  let activePresetKey = 'daily-text';

  // DOM Elements
  const langLeft = document.getElementById('langLeft');
  const langRight = document.getElementById('langRight');
  const urlLeft = document.getElementById('urlLeft');
  const urlRight = document.getElementById('urlRight');
  const iframeLeft = document.getElementById('iframeLeft');
  const iframeRight = document.getElementById('iframeRight');
  const btnDirectLeft = document.getElementById('btnDirectLeft');
  const btnDirectRight = document.getElementById('btnDirectRight');
  const noticeTitleLeft = document.getElementById('noticeTitleLeft');
  const noticeTitleRight = document.getElementById('noticeTitleRight');

  const btnOpenBoth = document.getElementById('btnOpenBoth');
  const btnSyncToggle = document.getElementById('btnSyncToggle');
  const btnOpenLeft = document.getElementById('btnOpenLeft');
  const btnOpenRight = document.getElementById('btnOpenRight');
  const btnReloadLeft = document.getElementById('btnReloadLeft');
  const btnReloadRight = document.getElementById('btnReloadRight');
  const btnTheme = document.getElementById('btnTheme');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const helpModal = document.getElementById('helpModal');

  const btnBookmarks = document.getElementById('btnBookmarks');
  const btnCloseBookmarks = document.getElementById('btnCloseBookmarks');
  const bookmarksModal = document.getElementById('bookmarksModal');
  const bookmarksList = document.getElementById('bookmarksList');
  const btnAddBookmark = document.getElementById('btnAddBookmark');
  const newBookmarkTitle = document.getElementById('newBookmarkTitle');

  const paneLeft = document.getElementById('paneLeft');
  const paneRight = document.getElementById('paneRight');
  const splitDivider = document.getElementById('splitDivider');

  // --- Helper: Convert URL between languages ---
  function translateUrl(url, targetLang) {
    if (!url) return '';
    try {
      // Check WOL
      if (url.includes('wol.jw.org')) {
        if (targetLang === 'uk') return 'https://wol.jw.org/uk/wol/h/r15/lp-u';
        if (targetLang === 'ru') return 'https://wol.jw.org/ru/wol/h/r2/lp-u';
        if (targetLang === 'en') return 'https://wol.jw.org/en/wol/h/r1/lp-e';
      }

      // Ukrainian <-> Russian <-> English Library mapping
      if (url.includes('/бібліотека/') || url.includes('/библиотека/') || url.includes('/library/')) {
        const sub = url.split(/\/(?:бібліотека|библиотека|library)\/?/)[1] || '';
        if (targetLang === 'uk') return `https://www.jw.org/uk/бібліотека/${sub}`;
        if (targetLang === 'ru') return `https://www.jw.org/ru/библиотека/${sub}`;
        if (targetLang === 'en') return `https://www.jw.org/en/library/${sub}`;
      }

      // Check current preset
      for (const key in PRESETS) {
        const item = PRESETS[key];
        const hasMatch = Object.values(item.urls).some(u => url.startsWith(u) || u.startsWith(url));
        if (hasMatch && item.urls[targetLang]) {
          return item.urls[targetLang];
        }
      }

      // Regex replace language prefix /uk/, /ru/, /en/
      const langRegex = /^(https?:\/\/[^\/]+)\/(uk|ru|en)(\/.*)?$/i;
      const match = url.match(langRegex);
      if (match) {
        const host = match[1];
        const rest = match[3] || '/';
        return `${host}/${targetLang}${rest}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  // --- Update Panes ---
  function updateLeftPane(url) {
    urlLeft.value = url;
    iframeLeft.src = url;
    btnDirectLeft.href = url;
    const langName = langLeft.options[langLeft.selectedIndex].text;
    noticeTitleLeft.textContent = `Левое окно (${langName})`;
  }

  function updateRightPane(url) {
    urlRight.value = url;
    iframeRight.src = url;
    btnDirectRight.href = url;
    const langName = langRight.options[langRight.selectedIndex].text;
    noticeTitleRight.textContent = `Правое окно (${langName})`;
  }

  function applyPreset(presetKey) {
    activePresetKey = presetKey;
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const l1 = langLeft.value;
    const l2 = langRight.value;

    const u1 = preset.urls[l1] || `https://www.jw.org/${l1}/`;
    const u2 = preset.urls[l2] || `https://www.jw.org/${l2}/`;

    updateLeftPane(u1);
    updateRightPane(u2);

    // Update preset chips UI
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.preset === presetKey);
    });
  }

  // --- Event Listeners: Presets ---
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      applyPreset(chip.dataset.preset);
    });
  });

  // --- Event Listeners: Language Selectors ---
  langLeft.addEventListener('change', () => {
    const newLang = langLeft.value;
    if (activePresetKey && PRESETS[activePresetKey]) {
      updateLeftPane(PRESETS[activePresetKey].urls[newLang] || `https://www.jw.org/${newLang}/`);
    } else {
      updateLeftPane(translateUrl(urlLeft.value, newLang));
    }
  });

  langRight.addEventListener('change', () => {
    const newLang = langRight.value;
    if (activePresetKey && PRESETS[activePresetKey]) {
      updateRightPane(PRESETS[activePresetKey].urls[newLang] || `https://www.jw.org/${newLang}/`);
    } else {
      updateRightPane(translateUrl(urlRight.value, newLang));
    }
  });

  // --- Event Listeners: URL Inputs ---
  urlLeft.addEventListener('change', () => {
    const val = urlLeft.value.trim();
    updateLeftPane(val);
    activePresetKey = null;
    document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));

    if (syncEnabled) {
      const translated = translateUrl(val, langRight.value);
      updateRightPane(translated);
    }
  });

  urlRight.addEventListener('change', () => {
    const val = urlRight.value.trim();
    updateRightPane(val);
    activePresetKey = null;
    document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));

    if (syncEnabled) {
      const translated = translateUrl(val, langLeft.value);
      updateLeftPane(translated);
    }
  });

  // --- Sync Toggle ---
  btnSyncToggle.addEventListener('click', () => {
    syncEnabled = !syncEnabled;
    btnSyncToggle.innerHTML = syncEnabled
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Синхронизация: ВКЛ`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21v-6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/></svg> Синхронизация: ВЫКЛ`;
    btnSyncToggle.style.opacity = syncEnabled ? '1' : '0.7';
  });

  // --- Open Both Windows (Dual Split-Screen Engine) ---
  btnOpenBoth.addEventListener('click', () => {
    const u1 = urlLeft.value;
    const u2 = urlRight.value;

    const screenW = window.screen.availWidth || window.innerWidth;
    const screenH = window.screen.availHeight || window.innerHeight;
    const halfW = Math.floor(screenW / 2);

    // On Desktop (Mac/PC): Open 2 docked popup windows side-by-side (50/50)
    const isDesktop = !(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (isDesktop) {
      window.open(u1, 'jw_left_pane', `left=0,top=0,width=${halfW},height=${screenH},menubar=no,toolbar=no,status=no`);
      setTimeout(() => {
        window.open(u2, 'jw_right_pane', `left=${halfW},top=0,width=${halfW},height=${screenH},menubar=no,toolbar=no,status=no`);
      }, 250);
    } else {
      // On iPad / iPhone: Open tabs for Split View
      window.open(u1, '_blank');
      setTimeout(() => {
        window.open(u2, '_blank');
      }, 350);
    }
  });

  // --- Single Window Actions ---
  btnOpenLeft.addEventListener('click', () => window.open(urlLeft.value, '_blank'));
  btnOpenRight.addEventListener('click', () => window.open(urlRight.value, '_blank'));
  btnReloadLeft.addEventListener('click', () => updateLeftPane(urlLeft.value));
  btnReloadRight.addEventListener('click', () => updateRightPane(urlRight.value));

  // --- Draggable Split Divider ---
  let isDragging = false;

  splitDivider.addEventListener('mousedown', (e) => {
    isDragging = true;
    splitDivider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const containerRect = document.getElementById('dualContainer').getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left;
    const totalW = containerRect.width;
    let percentage = (offsetX / totalW) * 100;
    if (percentage < 20) percentage = 20;
    if (percentage > 80) percentage = 80;

    paneLeft.style.width = `${percentage}%`;
    paneRight.style.width = `${100 - percentage}%`;
    localStorage.setItem('jw_dual_split', percentage);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      splitDivider.classList.remove('dragging');
      document.body.style.cursor = '';
    }
  });

  // Touch support for split divider on iPad
  splitDivider.addEventListener('touchstart', (e) => {
    isDragging = true;
    splitDivider.classList.add('dragging');
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    const touch = e.touches[0];
    const containerRect = document.getElementById('dualContainer').getBoundingClientRect();
    const offsetX = touch.clientX - containerRect.left;
    const totalW = containerRect.width;
    let percentage = (offsetX / totalW) * 100;
    if (percentage < 20) percentage = 20;
    if (percentage > 80) percentage = 80;

    paneLeft.style.width = `${percentage}%`;
    paneRight.style.width = `${100 - percentage}%`;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      splitDivider.classList.remove('dragging');
    }
  });

  // Restore saved split
  const savedSplit = localStorage.getItem('jw_dual_split');
  if (savedSplit) {
    paneLeft.style.width = `${savedSplit}%`;
    paneRight.style.width = `${100 - parseFloat(savedSplit)}%`;
  }

  // --- Theme Toggle ---
  btnTheme.addEventListener('click', () => {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    if (nextTheme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
    localStorage.setItem('jw_dual_theme', nextTheme);
  });

  const savedTheme = localStorage.getItem('jw_dual_theme');
  if (savedTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
  }

  // --- Modals: Help ---
  btnHelp.addEventListener('click', () => helpModal.classList.add('active'));
  btnCloseHelp.addEventListener('click', () => helpModal.classList.remove('active'));

  // --- Bookmarks (Local Storage) ---
  const DEFAULT_BOOKMARKS = [
    { title: 'Стих на день (UA / RU)', u1: PRESETS['daily-text'].urls.uk, u2: PRESETS['daily-text'].urls.ru },
    { title: 'Библиотека (UA / RU)', u1: PRESETS['library'].urls.uk, u2: PRESETS['library'].urls.ru }
  ];

  function getBookmarks() {
    try {
      const stored = localStorage.getItem('jw_dual_bookmarks');
      return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKS;
    } catch (e) {
      return DEFAULT_BOOKMARKS;
    }
  }

  function saveBookmarks(list) {
    localStorage.setItem('jw_dual_bookmarks', JSON.stringify(list));
  }

  function renderBookmarks() {
    const list = getBookmarks();
    bookmarksList.innerHTML = '';
    list.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'modal-list-item';
      div.innerHTML = `
        <div>
          <div class="modal-list-item-title">${item.title}</div>
          <div class="modal-list-item-path">${item.u1} | ${item.u2}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-open-both" style="padding: 4px 10px; font-size: 0.8rem;" data-open-idx="${index}">Открыть</button>
          <button class="pane-action-btn" style="color: #ef4444;" data-del-idx="${index}" title="Удалить">✕</button>
        </div>
      `;
      bookmarksList.appendChild(div);
    });

    // Attach listeners
    bookmarksList.querySelectorAll('[data-open-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.openIdx, 10);
        const item = list[idx];
        if (item) {
          updateLeftPane(item.u1);
          updateRightPane(item.u2);
          bookmarksModal.classList.remove('active');
        }
      });
    });

    bookmarksList.querySelectorAll('[data-del-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delIdx, 10);
        list.splice(idx, 1);
        saveBookmarks(list);
        renderBookmarks();
      });
    });
  }

  btnBookmarks.addEventListener('click', () => {
    renderBookmarks();
    bookmarksModal.classList.add('active');
  });

  btnCloseBookmarks.addEventListener('click', () => {
    bookmarksModal.classList.remove('active');
  });

  btnAddBookmark.addEventListener('click', () => {
    const title = newBookmarkTitle.value.trim() || 'Пользовательская закладка';
    const list = getBookmarks();
    list.push({
      title: title,
      u1: urlLeft.value,
      u2: urlRight.value
    });
    saveBookmarks(list);
    newBookmarkTitle.value = '';
    renderBookmarks();
  });

  // Close modals on outside click
  [helpModal, bookmarksModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // Initial preset
  applyPreset('daily-text');

})();
