(function () {
  const STORAGE = {
    leftWidth: "bagu_mkdocs_left_width", rightWidth: "bagu_mkdocs_right_width",
    leftCollapsed: "bagu_mkdocs_left_collapsed", rightCollapsed: "bagu_mkdocs_right_collapsed",
    tocCollapsed: "bagu_mkdocs_toc_collapsed"
  };
  const DEFAULTS = { leftWidth: 248, rightWidth: 272 };

  function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
  function getDesktop() { return window.matchMedia("(min-width: 992px)").matches; }
  function getBounds(side) { return side === "left" ? { min: 200, max: Math.min(360, Math.floor(window.innerWidth * 0.28)) } : { min: 220, max: Math.min(380, Math.floor(window.innerWidth * 0.3)) }; }
  function getPageKey() { return location.pathname; }
  function loadJSON(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
  function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  // [原有逻辑] 侧边栏宽度与折叠状态应用
  function applyLayoutState(root) {
    const state = root.__baguState;
    if (!state) return;
    document.body.classList.toggle("bagu-left-collapsed", !!state.leftCollapsed);
    document.body.classList.toggle("bagu-right-collapsed", !!state.rightCollapsed);
    document.documentElement.style.setProperty("--bagu-left-width", `${state.leftWidth}px`);
    document.documentElement.style.setProperty("--bagu-right-width", `${state.rightWidth}px`);

    if (state.leftToggle) { state.leftToggle.innerHTML = state.leftCollapsed ? `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>` : `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>`; }
    if (state.rightToggle) { state.rightToggle.innerHTML = state.rightCollapsed ? `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>` : `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>`; }
  }

  // [原有逻辑] 侧边栏拖拽
  function beginResize(root, side, startEvent) {
    if (!getDesktop()) return;
    const state = root.__baguState;
    if ((side === "left" && state.leftCollapsed) || (side === "right" && state.rightCollapsed)) return;
    const startX = startEvent.clientX; const startWidth = side === "left" ? state.leftWidth : state.rightWidth; const bounds = getBounds(side);
    function onMove(event) {
      const delta = event.clientX - startX;
      if (side === "left") { state.leftWidth = clamp(startWidth + delta, bounds.min, bounds.max); localStorage.setItem(STORAGE.leftWidth, String(state.leftWidth)); } 
      else { state.rightWidth = clamp(startWidth - delta, bounds.min, bounds.max); localStorage.setItem(STORAGE.rightWidth, String(state.rightWidth)); }
      applyLayoutState(root);
    }
    function onUp() { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); document.body.style.userSelect = ""; document.body.style.cursor = ""; }
    document.body.style.userSelect = "none"; document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  // [原有逻辑] 构建侧边栏控件
  function ensureLayoutControls(root) {
    if (!getDesktop()) return;
    const inner = root.querySelector(".md-main__inner"); const primary = root.querySelector(".md-sidebar--primary"); const secondary = root.querySelector(".md-sidebar--secondary");
    if (!inner || !primary || !secondary || inner.dataset.baguLayoutReady === "1") return;

    const state = {
      leftWidth: clamp(Number(localStorage.getItem(STORAGE.leftWidth)) || DEFAULTS.leftWidth, getBounds("left").min, getBounds("left").max),
      rightWidth: clamp(Number(localStorage.getItem(STORAGE.rightWidth)) || DEFAULTS.rightWidth, getBounds("right").min, getBounds("right").max),
      leftCollapsed: localStorage.getItem(STORAGE.leftCollapsed) === "1",
      rightCollapsed: localStorage.getItem(STORAGE.rightCollapsed) === "1"
    };

    const leftHandle = document.createElement("div"); leftHandle.className = "bagu-resize-handle bagu-resize-left";
    leftHandle.addEventListener("pointerdown", (e) => beginResize(root, "left", e));
    const rightHandle = document.createElement("div"); rightHandle.className = "bagu-resize-handle bagu-resize-right";
    rightHandle.addEventListener("pointerdown", (e) => beginResize(root, "right", e));

    inner.insertBefore(leftHandle, root.querySelector(".md-content")); inner.insertBefore(rightHandle, secondary);

    const leftToggle = document.createElement("button"); leftToggle.className = "bagu-sidebar-toggle bagu-toggle-left";
    leftToggle.addEventListener("click", () => { state.leftCollapsed = !state.leftCollapsed; localStorage.setItem(STORAGE.leftCollapsed, state.leftCollapsed ? "1" : "0"); applyLayoutState(root); });
    primary.appendChild(leftToggle);

    const rightToggle = document.createElement("button"); rightToggle.className = "bagu-sidebar-toggle bagu-toggle-right";
    rightToggle.addEventListener("click", () => { state.rightCollapsed = !state.rightCollapsed; localStorage.setItem(STORAGE.rightCollapsed, state.rightCollapsed ? "1" : "0"); applyLayoutState(root); });
    secondary.appendChild(rightToggle);

    state.leftToggle = leftToggle; state.rightToggle = rightToggle; root.__baguState = state;
    inner.dataset.baguLayoutReady = "1"; applyLayoutState(root);
  }

  // [原有逻辑] TOC 树构建
  function buildTocTree(root) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav || nav.dataset.baguTocReady === "1") return;
    const collapsedState = loadJSON(STORAGE.tocCollapsed, {}); const pageKey = getPageKey(); collapsedState[pageKey] = collapsedState[pageKey] || {};

    nav.querySelectorAll(".md-nav__item").forEach((item, index) => {
      const childNav = item.querySelector(":scope > nav.md-nav"); const link = item.querySelector(":scope > .md-nav__link");
      if (!link) return;
      item.classList.add("bagu-toc-item"); const tocId = link.getAttribute("href") || `toc-${index}`; item.dataset.tocId = tocId;

      const row = document.createElement("div"); row.className = "bagu-toc-row";
      if (childNav) {
        const toggle = document.createElement("button"); toggle.className = "bagu-toc-toggle";
        toggle.innerHTML = collapsedState[pageKey][tocId] ? "▶" : "▼";
        toggle.addEventListener("click", (e) => {
          e.preventDefault(); e.stopPropagation(); const next = !item.classList.contains("bagu-collapsed");
          item.classList.toggle("bagu-collapsed", next); collapsedState[pageKey][tocId] = next;
          toggle.innerHTML = next ? "▶" : "▼"; saveJSON(STORAGE.tocCollapsed, collapsedState);
        });
        row.appendChild(toggle);
      } else {
        const spacer = document.createElement("span"); spacer.className = "bagu-toc-spacer"; row.appendChild(spacer);
      }
      link.parentNode.insertBefore(row, link); row.appendChild(link);
      if (childNav && collapsedState[pageKey][tocId]) item.classList.add("bagu-collapsed");
    });
    nav.dataset.baguTocReady = "1";
  }

  // =========================================
  // [全新逻辑] 核心功能：自动打包字卡 & 控制台
  // =========================================
  function initEducationFeatures(root) {
    const contentInner = root.querySelector('.md-content__inner');
    if (!contentInner || contentInner.dataset.eduReady === "1" || document.body.classList.contains("bagu-home-hero")) return;

    // 1. 注入控制台 (包含阅读进度和折叠开关)
    const h1 = contentInner.querySelector('h1');
    const toolbar = document.createElement('div');
    toolbar.className = 'bagu-toolbar';
    toolbar.innerHTML = `
      <div class="bagu-progress-container"><div class="bagu-progress-bar" id="bagu-progress"></div></div>
      <div class="bagu-toolbar-actions">
        <button id="toggle-cards-btn" class="bagu-tool-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 8h16M4 16h16"/></svg>
          折叠所有答案
        </button>
      </div>
    `;
    // 将工具栏插在 H1 下方
    if (h1) { h1.parentNode.insertBefore(toolbar, h1.nextSibling); } 
    else { contentInner.insertBefore(toolbar, contentInner.firstChild); }

    // 2. 自动 H3 字卡化 (Auto-Flashcards)
    const elements = Array.from(contentInner.children);
    let currentCard = null;
    let currentContent = null;
    let cardCount = 0;

    elements.forEach(el => {
      // 遇到更高级别的标题、或者本身就是控制台，停止当前打包
      if (el.tagName === 'H1' || el.tagName === 'H2' || el.classList.contains('bagu-toolbar')) {
        currentCard = null;
      } else if (el.tagName === 'H3') {
        // 创建新字卡 <details>
        currentCard = document.createElement('details');
        currentCard.className = 'bagu-flashcard';
        currentCard.open = true; // 默认展开

        const summary = document.createElement('summary');
        summary.className = 'bagu-flashcard-title';
        
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'bagu-flashcard-title-text';
        
        // 复制原始 H3 放入 summary，保留样式
        const cloneH3 = el.cloneNode(true);
        titleWrapper.appendChild(cloneH3);
        summary.appendChild(titleWrapper);

        // 创建内容区
        currentContent = document.createElement('div');
        currentContent.className = 'bagu-flashcard-content';

        currentCard.appendChild(summary);
        currentCard.appendChild(currentContent);

        // 插入 DOM：替换原 H3 的位置
        el.parentNode.insertBefore(currentCard, el);
        
        // 保留原 H3 作为一个隐藏锚点，防止右侧目录的 Hash 跳转失效
        el.className = 'bagu-h3-anchor';
        
        cardCount++;
      } else if (currentCard) {
        // 将 H3 之后的内容移动到字卡内容区中
        currentContent.appendChild(el);
      }
    });

    // 3. 绑定全局控制逻辑
    const toggleBtn = document.getElementById('toggle-cards-btn');
    const allCards = document.querySelectorAll('.bagu-flashcard');
    let isAllOpen = true;

    if (cardCount === 0) {
      toggleBtn.style.display = 'none'; // 如果没有H3，隐藏按钮
    }

    toggleBtn.addEventListener('click', () => {
      isAllOpen = !isAllOpen;
      allCards.forEach(card => card.open = isAllOpen);
      toggleBtn.innerHTML = isAllOpen 
        ? `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 8h16M4 16h16"/></svg> 折叠所有答案` 
        : `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="4 14 12 21 20 14"/><polyline points="4 3 12 10 20 3"/></svg> 展开所有答案`;
    });

    // 4. 阅读进度条同步
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      const progressBar = document.getElementById('bagu-progress');
      if (progressBar) progressBar.style.width = scrolled + '%';
    });

    // 5. 监听 Hash 跳转自动展开字卡
    window.addEventListener('hashchange', () => {
      if (location.hash) {
        const targetId = location.hash.slice(1);
        const anchor = document.getElementById(targetId);
        if (anchor && anchor.classList.contains('bagu-h3-anchor')) {
          const card = anchor.previousElementSibling;
          if (card && card.classList.contains('bagu-flashcard')) card.open = true;
        }
      }
    });

    contentInner.dataset.eduReady = "1";
  }

  function init() {
    const root = document;
    document.body.classList.toggle("bagu-home-hero", !!root.querySelector(".hero-shell"));
    ensureLayoutControls(root);
    buildTocTree(root);
    initEducationFeatures(root); // 启动教育增强功能
  }

  document.addEventListener("DOMContentLoaded", init);
  if (typeof document$ !== "undefined" && document$.subscribe) { document$.subscribe(() => { window.setTimeout(init, 0); }); }
  window.addEventListener("resize", () => {
    ensureLayoutControls(document);
    if (!document.__baguState) return;
    document.__baguState.leftWidth = clamp(document.__baguState.leftWidth, getBounds("left").min, getBounds("left").max);
    document.__baguState.rightWidth = clamp(document.__baguState.rightWidth, getBounds("right").min, getBounds("right").max);
    applyLayoutState(document);
  });
})();