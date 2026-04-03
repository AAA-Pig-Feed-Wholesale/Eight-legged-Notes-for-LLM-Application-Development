(function () {
  const STORAGE = {
    leftWidth: "bagu_mkdocs_left_width",
    rightWidth: "bagu_mkdocs_right_width",
    leftCollapsed: "bagu_mkdocs_left_collapsed",
    rightCollapsed: "bagu_mkdocs_right_collapsed",
    tocCollapsed: "bagu_mkdocs_toc_collapsed",
    progressCollapsed: "bagu_mkdocs_progress_collapsed",
    tocCompact: "bagu_mkdocs_toc_compact"
  };

  const DEFAULTS = {
    leftWidth: 300,
    rightWidth: 280
  };

  const LABELS = {
    currentSection: "当前章节",
    currentSectionFallback: "开始阅读",
    collapseAllCards: "收起全部答案",
    expandAllCards: "展开全部答案",
    hideProgress: "收起进度条",
    showProgress: "展开进度条",
    immersiveDeck: "沉浸翻卡",
    closeDeck: "关闭翻卡",
    showAnswer: "显示答案",
    hideAnswer: "隐藏答案",
    previousCard: "上一张",
    nextCard: "下一张"
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getDesktop() {
    return window.matchMedia("(min-width: 992px)").matches;
  }

  function getMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function getBounds(side) {
    if (side === "left") {
      return {
        min: 220,
        max: Math.min(520, Math.floor(window.innerWidth * 0.42))
      };
    }

    return {
      min: 220,
      max: Math.min(460, Math.floor(window.innerWidth * 0.36))
    };
  }

  function ensureSecondaryToc(root, nav) {
    if (!nav || nav.querySelector(".md-nav__item")) {
      return !!(nav && nav.querySelector(".md-nav__item"));
    }

    const empty = nav.querySelector(".bagu-toc-empty");
    if (empty) {
      empty.remove();
    }

    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner) {
      return false;
    }

    const headings = Array.from(contentInner.querySelectorAll("h2, h3, h4, h5, h6"))
      .map((heading) => ({
        element: heading,
        level: Number(heading.tagName.slice(1)),
        label: normalizeText(heading.textContent)
      }))
      .filter((heading) => heading.element.id && heading.label && heading.level >= 2 && heading.level <= 6);

    if (!headings.length) {
      return false;
    }

    let list = nav.querySelector(".md-nav__list");
    if (!list) {
      list = document.createElement("ul");
      list.className = "md-nav__list";
      list.setAttribute("data-md-component", "toc");
      list.setAttribute("data-md-scrollfix", "");
      nav.appendChild(list);
    }

    if (!nav.querySelector(".md-nav__title")) {
      const label = document.createElement("label");
      label.className = "md-nav__title";
      label.setAttribute("for", "__toc");
      label.innerHTML = '<span class="md-nav__icon md-icon"></span>目录';
      nav.insertBefore(label, list);
    }

    const stack = [{ level: 1, list }];

    headings.forEach((heading, index) => {
      while (stack.length && heading.level <= stack[stack.length - 1].level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1] || stack[0];
      const item = document.createElement("li");
      item.className = "md-nav__item";

      const link = document.createElement("a");
      link.className = "md-nav__link";
      link.href = `#${heading.element.id}`;
      link.classList.add(`bagu-toc-level-${heading.level}`);

      const label = document.createElement("span");
      label.className = "md-ellipsis";
      label.textContent = heading.label;
      link.appendChild(label);
      item.appendChild(link);
      parent.list.appendChild(item);

      const nextHeading = headings[index + 1];
      if (nextHeading && nextHeading.level > heading.level) {
        const subNav = document.createElement("nav");
        subNav.className = "md-nav";
        subNav.setAttribute("aria-label", heading.label);

        const subList = document.createElement("ul");
        subList.className = "md-nav__list";

        subNav.appendChild(subList);
        item.appendChild(subNav);
        stack.push({ level: heading.level, list: subList });
      }
    });

    return true;
  }

  function getRightContext(root) {
    const secondary = root.querySelector(".md-sidebar--secondary");
    const toc = secondary ? secondary.querySelector(".md-nav--secondary") : null;
    const enabled = !!(toc && ensureSecondaryToc(root, toc));
    return { secondary, enabled };
  }

  function ensureSidebarChrome(root) {
    if (!getDesktop()) {
      return;
    }

    const primary = root.querySelector(".md-sidebar--primary");
    const secondary = root.querySelector(".md-sidebar--secondary");

    if (primary && root.__baguLayoutState?.leftToggle) {
      setupSidebar(root, primary, "Files", root.__baguLayoutState.leftToggle, true);
    }

    if (secondary && root.__baguLayoutState?.rightToggle) {
      setupSidebar(root, secondary, "Outline", root.__baguLayoutState.rightToggle, false);
    }
  }

  function setupSidebar(root, sidebar, label, toggleButton, withSearch) {
    const inner = sidebar.querySelector(".md-sidebar__inner");
    if (!inner) {
      return;
    }

    let header = inner.querySelector(".bagu-sidebar-top");
    if (!header) {
      header = document.createElement("div");
      header.className = "bagu-sidebar-top";

      const title = document.createElement("p");
      title.className = "bagu-sidebar-label";
      title.textContent = label;

      header.appendChild(title);
      inner.insertBefore(header, inner.firstChild);
    }

    toggleButton.classList.add("bagu-collapse-btn");
    toggleButton.removeAttribute("style");
    if (toggleButton.parentElement !== header) {
      header.appendChild(toggleButton);
    }

    if (withSearch) {
      let search = inner.querySelector(".bagu-nav-search");
      if (!search) {
        search = document.createElement("input");
        search.className = "bagu-nav-search";
        search.type = "search";
        search.placeholder = "搜索文件名";
        header.insertAdjacentElement("afterend", search);

        search.addEventListener("input", () => {
          filterPrimaryNav(root, search.value);
        });
      }
    } else {
      const nav = sidebar.querySelector(".md-nav--secondary");
      if (nav && !nav.querySelector(".bagu-toc-title")) {
        const title = document.createElement("h3");
        title.className = "bagu-toc-title";
        title.textContent = "二级目录";

        const controls = nav.querySelector(".bagu-toc-controls");
        if (controls && controls.nextSibling) {
          nav.insertBefore(title, controls.nextSibling);
        } else {
          nav.insertBefore(title, nav.firstChild);
        }
      }
    }
  }

  function filterPrimaryNav(root, query) {
    const items = Array.from(root.querySelectorAll(".md-sidebar--primary .md-nav__item"));
    const links = Array.from(root.querySelectorAll(".md-sidebar--primary .md-nav__link"));
    const keyword = normalizeText(query).toLowerCase();

    if (!keyword) {
      items.forEach((item) => item.classList.remove("bagu-nav-hidden"));
      return;
    }

    items.forEach((item) => item.classList.add("bagu-nav-hidden"));

    links.forEach((link) => {
      const text = normalizeText(link.textContent).toLowerCase();
      if (!text.includes(keyword)) {
        return;
      }

      let item = link.closest(".md-nav__item");
      while (item) {
        item.classList.remove("bagu-nav-hidden");
        item = item.parentElement ? item.parentElement.closest(".md-nav__item") : null;
      }
    });
  }

  function suppressSearchInitMessage(root) {
    const meta = root.querySelector(".md-search-result__meta");
    if (!meta || meta.__baguSearchObserver) {
      return;
    }

    const update = () => {
      const text = normalizeText(meta.textContent);
      meta.classList.toggle("bagu-search-init", text.includes("正在初始化搜索引擎"));
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(meta, { characterData: true, childList: true, subtree: true });
    meta.__baguSearchObserver = observer;
  }

  function getPageKey() {
    return location.pathname;
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadFlag(key) {
    return localStorage.getItem(key) === "1";
  }

  function saveFlag(key, value) {
    localStorage.setItem(key, value ? "1" : "0");
  }

  function loadFlagWithDefault(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return raw === "1";
  }

  function getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }

  function icon(name) {
    const icons = {
      chevronLeft: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      chevronRight: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      chevronDown: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>',
      progress: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><path d="M4 19h16"></path><path d="M6 16V9"></path><path d="M12 16V5"></path><path d="M18 16v-3"></path></svg>',
      cardsClosed: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><path d="M4 8h16"></path><path d="M4 16h16"></path></svg>',
      cardsOpen: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><polyline points="4 7 12 15 20 7"></polyline><polyline points="4 13 12 21 20 13"></polyline></svg>',
      mobileDeck: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 9h8"></path><path d="M8 13h8"></path><path d="M8 17h5"></path></svg>',
      close: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };

    return icons[name] || "";
  }

  function setButtonLabel(button, iconName, label) {
    if (!button) {
      return;
    }

    button.innerHTML = `${icon(iconName)}<span>${label}</span>`;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  function setIconButton(button, iconName, label) {
    if (!button) {
      return;
    }

    button.innerHTML = icon(iconName);
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  }

  function updateSidebarToggleButton(button, side, collapsed) {
    if (!button) {
      return;
    }

    if (side === "left") {
      setIconButton(button, collapsed ? "chevronRight" : "chevronLeft", collapsed ? "展开左侧栏" : "收起左侧栏");
      return;
    }

    setIconButton(button, collapsed ? "chevronLeft" : "chevronRight", collapsed ? "展开右侧栏" : "收起右侧栏");
  }

  function applyLayoutState(root) {
    const state = root.__baguLayoutState;
    if (!state) {
      return;
    }

    document.body.classList.toggle("bagu-left-collapsed", !!state.leftCollapsed);
    document.body.classList.toggle("bagu-right-collapsed", !!state.rightEnabled && !!state.rightCollapsed);
    document.documentElement.style.setProperty("--bagu-left-width", `${state.leftWidth}px`);
    document.documentElement.style.setProperty("--bagu-right-width", `${state.rightWidth}px`);

    updateSidebarToggleButton(state.leftToggle, "left", !!state.leftCollapsed);
    updateSidebarToggleButton(state.rightToggle, "right", !!state.rightCollapsed);
  }

  function beginResize(root, side, startEvent) {
    if (!getDesktop()) {
      return;
    }

    const state = root.__baguLayoutState;
    if (!state) {
      return;
    }

    if ((side === "left" && state.leftCollapsed) || (side === "right" && (!state.rightEnabled || state.rightCollapsed))) {
      return;
    }

    const handle = startEvent.currentTarget;
    const startX = startEvent.clientX;
    const startWidth = side === "left" ? state.leftWidth : state.rightWidth;
    const bounds = getBounds(side);

    handle.classList.add("is-dragging");
    if (handle.setPointerCapture) {
      handle.setPointerCapture(startEvent.pointerId);
    }

    function onMove(event) {
      const delta = event.clientX - startX;
      const nextWidth = clamp(side === "left" ? startWidth + delta : startWidth - delta, bounds.min, bounds.max);

      if (side === "left") {
        state.leftWidth = nextWidth;
        localStorage.setItem(STORAGE.leftWidth, String(nextWidth));
      } else {
        state.rightWidth = nextWidth;
        localStorage.setItem(STORAGE.rightWidth, String(nextWidth));
      }

      applyLayoutState(root);
    }

    function onUp(event) {
      handle.classList.remove("is-dragging");
      if (handle.releasePointerCapture) {
        try {
          handle.releasePointerCapture(event.pointerId);
        } catch {
        }
      }

      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function ensureLayoutControls(root) {
    if (!getDesktop()) {
      return;
    }

    const inner = root.querySelector(".md-main__inner");
    const primary = root.querySelector(".md-sidebar--primary");
    if (!inner || !primary) {
      return;
    }

    const right = getRightContext(root);
    document.body.classList.toggle("bagu-right-disabled", !right.enabled);

    const state = root.__baguLayoutState || {
      leftWidth: clamp(Number(localStorage.getItem(STORAGE.leftWidth)) || DEFAULTS.leftWidth, getBounds("left").min, getBounds("left").max),
      rightWidth: clamp(Number(localStorage.getItem(STORAGE.rightWidth)) || DEFAULTS.rightWidth, getBounds("right").min, getBounds("right").max),
      leftCollapsed: loadFlag(STORAGE.leftCollapsed),
      rightCollapsed: loadFlag(STORAGE.rightCollapsed)
    };
    state.rightEnabled = right.enabled;

    let leftHandle = inner.querySelector(".bagu-resize-left");
    if (!leftHandle) {
      leftHandle = document.createElement("button");
      leftHandle.type = "button";
      leftHandle.className = "bagu-resize-handle bagu-resize-left";
      leftHandle.setAttribute("aria-label", "拖拽调整左侧栏宽度");
      leftHandle.addEventListener("pointerdown", (event) => beginResize(root, "left", event));
      inner.insertBefore(leftHandle, root.querySelector(".md-content"));
    }

    let rightHandle = inner.querySelector(".bagu-resize-right");
    if (right.enabled) {
      if (!rightHandle) {
        rightHandle = document.createElement("button");
        rightHandle.type = "button";
        rightHandle.className = "bagu-resize-handle bagu-resize-right";
        rightHandle.setAttribute("aria-label", "拖拽调整右侧栏宽度");
        rightHandle.addEventListener("pointerdown", (event) => beginResize(root, "right", event));
        if (right.secondary) {
          inner.insertBefore(rightHandle, right.secondary);
        }
      }
    } else if (rightHandle) {
      rightHandle.remove();
    }

    let leftToggle = primary.querySelector(".bagu-toggle-left");
    if (!leftToggle) {
      leftToggle = document.createElement("button");
      leftToggle.type = "button";
      leftToggle.className = "bagu-sidebar-toggle bagu-toggle-left";
      leftToggle.addEventListener("click", () => {
        state.leftCollapsed = !state.leftCollapsed;
        saveFlag(STORAGE.leftCollapsed, state.leftCollapsed);
        applyLayoutState(root);
      });
      primary.appendChild(leftToggle);
    }

    let rightToggle = right.secondary ? right.secondary.querySelector(".bagu-toggle-right") : null;
    if (right.enabled) {
      if (!rightToggle && right.secondary) {
        rightToggle = document.createElement("button");
        rightToggle.type = "button";
        rightToggle.className = "bagu-sidebar-toggle bagu-toggle-right";
        rightToggle.addEventListener("click", () => {
          state.rightCollapsed = !state.rightCollapsed;
          saveFlag(STORAGE.rightCollapsed, state.rightCollapsed);
          applyLayoutState(root);
        });
        right.secondary.appendChild(rightToggle);
      }
    } else if (rightToggle) {
      rightToggle.remove();
      rightToggle = null;
    }

    state.leftToggle = leftToggle;
    state.rightToggle = rightToggle;
    root.__baguLayoutState = state;

    if (!right.enabled) {
      document.body.classList.remove("bagu-right-collapsed");
    }

    applyLayoutState(root);
  }

  function ensureTocControls(root, nav) {
    if (!nav) {
      return;
    }

    const state = root.__baguTocState || {
      compact: loadFlagWithDefault(STORAGE.tocCompact, true)
    };
    root.__baguTocState = state;
    document.body.classList.toggle("bagu-toc-compact", state.compact);

    let controls = nav.querySelector(".bagu-toc-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "bagu-toc-controls";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "bagu-toc-mode";
      controls.appendChild(button);
      nav.insertBefore(controls, nav.firstChild);

      button.addEventListener("click", () => {
        state.compact = !state.compact;
        saveFlag(STORAGE.tocCompact, state.compact);
        document.body.classList.toggle("bagu-toc-compact", state.compact);
        syncTocCurrent(root);
        updateTocControlLabel(root);
      });
    }

    updateTocControlLabel(root);
  }

  function updateTocControlLabel(root) {
    const state = root.__baguTocState;
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!state || !nav) {
      return;
    }

    const button = nav.querySelector(".bagu-toc-mode");
    if (button) {
      button.textContent = state.compact ? "展开全部目录" : "仅看当前章节";
    }
  }

  function syncTocCurrent(root) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    const currentId = root.__baguEducationState?.currentHeadingId || (location.hash ? location.hash.slice(1) : "");
    const topItems = Array.from(nav.querySelectorAll(":scope > .md-nav__list > .bagu-toc-item"));
    topItems.forEach((item) => item.classList.remove("bagu-toc-current"));

    if (!currentId) {
      return;
    }

    const link = nav.querySelector(`a.md-nav__link[href="#${escapeSelector(currentId)}"]`);
    if (!link) {
      return;
    }

    const topItem = topItems.find((item) => item.contains(link));
    if (topItem) {
      topItem.classList.add("bagu-toc-current");
    }
  }

  function buildTocTree(root) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav || nav.dataset.baguTocReady === "1") {
      return;
    }

    if (!ensureSecondaryToc(root, nav)) {
      return;
    }

    ensureTocControls(root, nav);

    const collapsedState = loadJSON(STORAGE.tocCollapsed, {});
    const pageKey = getPageKey();
    collapsedState[pageKey] = collapsedState[pageKey] || {};

    nav.querySelectorAll(".md-nav__item").forEach((item, index) => {
      const childNav = item.querySelector(":scope > nav.md-nav");
      const link = item.querySelector(":scope > .md-nav__link");
      if (!link) {
        return;
      }

      item.classList.add("bagu-toc-item");
      link.setAttribute("title", normalizeText(link.textContent));

      const tocId = link.getAttribute("href") || `toc-${index}`;
      item.dataset.tocId = tocId;

      const row = document.createElement("div");
      row.className = "bagu-toc-row";

      if (childNav) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "bagu-toc-toggle";
        toggle.setAttribute("aria-label", "展开或收起目录");
        toggle.innerHTML = icon(collapsedState[pageKey][tocId] ? "chevronRight" : "chevronDown");
        toggle.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const nextCollapsed = !item.classList.contains("bagu-collapsed");
          item.classList.toggle("bagu-collapsed", nextCollapsed);
          collapsedState[pageKey][tocId] = nextCollapsed;
          toggle.innerHTML = icon(nextCollapsed ? "chevronRight" : "chevronDown");
          saveJSON(STORAGE.tocCollapsed, collapsedState);
        });
        row.appendChild(toggle);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "bagu-toc-spacer";
        row.appendChild(spacer);
      }

      link.parentNode.insertBefore(row, link);
      row.appendChild(link);

      if (childNav && collapsedState[pageKey][tocId]) {
        item.classList.add("bagu-collapsed");
      }
    });

    nav.dataset.baguTocReady = "1";
    syncTocCurrent(root);
  }

  function buildFlashcards(contentInner) {
    const elements = Array.from(contentInner.children);
    let currentCard = null;
    let currentContent = null;

    elements.forEach((element) => {
      if (element.tagName === "H1" || element.tagName === "H2") {
        currentCard = null;
        currentContent = null;
        return;
      }

      if (element.tagName === "H3") {
        currentCard = document.createElement("details");
        currentCard.className = "bagu-flashcard";
        currentCard.open = true;

        const summary = document.createElement("summary");
        summary.className = "bagu-flashcard-title";

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "bagu-flashcard-title-text";

        const cloneH3 = element.cloneNode(true);
        cloneH3.removeAttribute("id");
        titleWrapper.appendChild(cloneH3);
        summary.appendChild(titleWrapper);

        currentContent = document.createElement("div");
        currentContent.className = "bagu-flashcard-content";

        currentCard.appendChild(summary);
        currentCard.appendChild(currentContent);

        element.parentNode.insertBefore(currentCard, element);
        element.classList.add("bagu-h3-anchor");
        return;
      }

      if (currentCard && currentContent) {
        currentContent.appendChild(element);
      }
    });

    return Array.from(contentInner.querySelectorAll(".bagu-flashcard"));
  }

  function collectHeadings(contentInner) {
    return Array.from(contentInner.querySelectorAll("h2, .bagu-h3-anchor"))
      .map((element) => ({
        element,
        label: normalizeText(element.textContent),
        id: element.id
      }))
      .filter((item) => item.label);
  }

  function resolveCurrentHeading(headings) {
    if (!headings.length) {
      return null;
    }

    const threshold = getScrollTop() + (getMobile() ? 120 : 150);
    let current = headings[0];

    headings.forEach((item) => {
      const top = getScrollTop() + item.element.getBoundingClientRect().top;
      if (top <= threshold) {
        current = item;
      }
    });

    return current;
  }

  function buildToolbar(cardCount) {
    const toolbar = document.createElement("div");
    toolbar.className = "bagu-toolbar";
    toolbar.innerHTML = `
      <div class="bagu-toolbar-main">
        <div class="bagu-toolbar-meta">
          <span class="bagu-toolbar-label">${LABELS.currentSection}</span>
          <strong class="bagu-current-section">${LABELS.currentSectionFallback}</strong>
        </div>
        <div class="bagu-progress-shell">
          <button type="button" class="bagu-progress-toggle bagu-tool-btn bagu-tool-btn--icon"></button>
          <div class="bagu-progress-container">
            <div class="bagu-progress-bar"></div>
          </div>
          <span class="bagu-progress-value">0%</span>
        </div>
      </div>
      <div class="bagu-toolbar-actions">
        <button type="button" class="bagu-tool-btn bagu-cards-toggle"></button>
        <button type="button" class="bagu-tool-btn bagu-mobile-only bagu-open-deck">${icon("mobileDeck")}<span>${LABELS.immersiveDeck}</span></button>
      </div>
    `;

    if (cardCount === 0) {
      toolbar.querySelector(".bagu-cards-toggle").hidden = true;
      toolbar.querySelector(".bagu-open-deck").hidden = true;
    }

    return toolbar;
  }

  function ensureGlobalUi(root) {
    if (root.__baguGlobalUi) {
      return root.__baguGlobalUi;
    }

    const mobileDock = document.createElement("div");
    mobileDock.className = "bagu-mobile-dock";
    mobileDock.hidden = true;
    mobileDock.innerHTML = `
      <div class="bagu-mobile-dock-main">
        <div class="bagu-mobile-dock-copy">
          <span class="bagu-mobile-dock-label">${LABELS.currentSection}</span>
          <strong class="bagu-mobile-current-section">${LABELS.currentSectionFallback}</strong>
        </div>
        <div class="bagu-mobile-dock-actions">
          <button type="button" class="bagu-mobile-chip bagu-mobile-progress-toggle"></button>
          <button type="button" class="bagu-mobile-chip bagu-mobile-open-deck">${icon("mobileDeck")}<span>${LABELS.immersiveDeck}</span></button>
        </div>
      </div>
      <div class="bagu-mobile-progress-container">
        <div class="bagu-mobile-progress-bar"></div>
      </div>
    `;
    document.body.appendChild(mobileDock);

    const deckOverlay = document.createElement("div");
    deckOverlay.className = "bagu-deck-overlay";
    deckOverlay.innerHTML = `
      <div class="bagu-deck-dialog" role="dialog" aria-modal="true" aria-label="${LABELS.immersiveDeck}">
        <div class="bagu-deck-topbar">
          <button type="button" class="bagu-deck-icon bagu-deck-close">${icon("close")}</button>
          <div class="bagu-deck-heading">
            <span>Mobile Flashcards</span>
            <strong class="bagu-deck-counter">1 / 1</strong>
          </div>
          <button type="button" class="bagu-deck-icon bagu-deck-answer"></button>
        </div>
        <div class="bagu-deck-stage"></div>
        <div class="bagu-deck-nav">
          <button type="button" class="bagu-deck-nav-btn bagu-deck-prev">${icon("chevronLeft")}<span>${LABELS.previousCard}</span></button>
          <button type="button" class="bagu-deck-nav-btn bagu-deck-next"><span>${LABELS.nextCard}</span>${icon("chevronRight")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(deckOverlay);

    const ui = {
      mobileDock,
      mobileSection: mobileDock.querySelector(".bagu-mobile-current-section"),
      mobileProgressToggle: mobileDock.querySelector(".bagu-mobile-progress-toggle"),
      mobileProgressBar: mobileDock.querySelector(".bagu-mobile-progress-bar"),
      mobileDeckButton: mobileDock.querySelector(".bagu-mobile-open-deck"),
      deckOverlay,
      deckStage: deckOverlay.querySelector(".bagu-deck-stage"),
      deckCounter: deckOverlay.querySelector(".bagu-deck-counter"),
      deckClose: deckOverlay.querySelector(".bagu-deck-close"),
      deckAnswer: deckOverlay.querySelector(".bagu-deck-answer"),
      deckPrev: deckOverlay.querySelector(".bagu-deck-prev"),
      deckNext: deckOverlay.querySelector(".bagu-deck-next"),
      deckState: null
    };

    ui.mobileProgressToggle.addEventListener("click", () => toggleProgressCollapsed(root));
    ui.mobileDeckButton.addEventListener("click", () => openDeck(root));
    ui.deckClose.addEventListener("click", () => closeDeck(root));
    ui.deckPrev.addEventListener("click", () => moveDeck(root, -1));
    ui.deckNext.addEventListener("click", () => moveDeck(root, 1));
    ui.deckAnswer.addEventListener("click", () => toggleDeckAnswer(root));
    ui.deckOverlay.addEventListener("click", (event) => {
      if (event.target === ui.deckOverlay) {
        closeDeck(root);
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    ui.deckStage.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    ui.deckStage.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      moveDeck(root, deltaX < 0 ? 1 : -1);
    }, { passive: true });

    root.__baguGlobalUi = ui;
    return ui;
  }

  function updateCardsToggle(root) {
    const state = root.__baguEducationState;
    if (!state || !state.cardsToggleButton || !state.cards.length) {
      return;
    }

    const allOpen = state.cards.every((card) => card.open);
    setButtonLabel(state.cardsToggleButton, allOpen ? "cardsClosed" : "cardsOpen", allOpen ? LABELS.collapseAllCards : LABELS.expandAllCards);
  }

  function setProgressControls(root, collapsed) {
    const state = root.__baguEducationState;
    const ui = ensureGlobalUi(root);

    if (state && state.toolbar) {
      state.toolbar.classList.toggle("bagu-progress-collapsed", collapsed);
      setIconButton(state.progressToggleButton, "progress", collapsed ? LABELS.showProgress : LABELS.hideProgress);
      state.progressToggleButton.setAttribute("aria-pressed", collapsed ? "true" : "false");
    }

    ui.mobileDock.classList.toggle("bagu-progress-collapsed", collapsed);
    setButtonLabel(ui.mobileProgressToggle, "progress", collapsed ? "显示进度" : "收起进度");
  }

  function setProgressCollapsed(root, collapsed) {
    saveFlag(STORAGE.progressCollapsed, collapsed);

    if (root.__baguEducationState) {
      root.__baguEducationState.progressCollapsed = collapsed;
    }

    setProgressControls(root, collapsed);
  }

  function toggleProgressCollapsed(root) {
    const current = root.__baguEducationState ? root.__baguEducationState.progressCollapsed : loadFlag(STORAGE.progressCollapsed);
    setProgressCollapsed(root, !current);
  }

  function syncMobileDock(root) {
    const ui = ensureGlobalUi(root);
    const state = root.__baguEducationState;
    const shouldShow = !!state && !document.body.classList.contains("bagu-home-hero") && getMobile();

    ui.mobileDock.hidden = !shouldShow;
    document.body.classList.toggle("bagu-mobile-dock-active", shouldShow && getMobile());
    ui.mobileDeckButton.hidden = !shouldShow || !state.cards.length;
  }

  function updateReadingState(root) {
    const state = root.__baguEducationState;
    const ui = ensureGlobalUi(root);

    if (!state) {
      syncMobileDock(root);
      return;
    }

    const documentElement = document.documentElement;
    const maxScroll = documentElement.scrollHeight - documentElement.clientHeight;
    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (getScrollTop() / maxScroll) * 100)) : 0;
    const progressText = `${Math.round(progress)}%`;
    const currentHeading = resolveCurrentHeading(state.headings);
    const currentSection = currentHeading ? currentHeading.label : LABELS.currentSectionFallback;

    state.currentHeadingId = currentHeading ? currentHeading.id : "";
    state.progressBar.style.width = `${progress}%`;
    state.progressValue.textContent = progressText;
    state.currentSection.textContent = currentSection;

    ui.mobileProgressBar.style.width = `${progress}%`;
    ui.mobileProgressToggle.querySelector("span").textContent = `进度 ${progressText}`;
    ui.mobileSection.textContent = currentSection;

    syncMobileDock(root);
    syncTocCurrent(root);
  }

  function requestReadingUpdate(root) {
    if (root.__baguReadingUpdateRaf) {
      return;
    }

    root.__baguReadingUpdateRaf = window.requestAnimationFrame(() => {
      root.__baguReadingUpdateRaf = 0;
      updateReadingState(root);
    });
  }

  function revealHashTarget(root) {
    if (!location.hash) {
      return;
    }

    const target = document.getElementById(location.hash.slice(1));
    if (!target || !target.classList.contains("bagu-h3-anchor")) {
      return;
    }

    const card = target.previousElementSibling;
    if (card && card.classList.contains("bagu-flashcard")) {
      card.open = true;
      updateCardsToggle(root);
    }
  }

  function clearReadingState(root) {
    root.__baguEducationState = null;
    closeDeck(root);
    syncMobileDock(root);
  }

  function initEducationFeatures(root) {
    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner || contentInner.dataset.eduReady === "1" || document.body.classList.contains("bagu-home-hero")) {
      if (document.body.classList.contains("bagu-home-hero")) {
        clearReadingState(root);
      }
      return;
    }

    const cards = buildFlashcards(contentInner);
    const toolbar = buildToolbar(cards.length);
    const h1 = contentInner.querySelector("h1");

    if (h1) {
      h1.parentNode.insertBefore(toolbar, h1.nextSibling);
    } else {
      contentInner.insertBefore(toolbar, contentInner.firstChild);
    }

    const cardsToggleButton = toolbar.querySelector(".bagu-cards-toggle");
    const progressToggleButton = toolbar.querySelector(".bagu-progress-toggle");
    const progressBar = toolbar.querySelector(".bagu-progress-bar");
    const progressValue = toolbar.querySelector(".bagu-progress-value");
    const currentSection = toolbar.querySelector(".bagu-current-section");
    const deckButton = toolbar.querySelector(".bagu-open-deck");

    cards.forEach((card) => {
      card.addEventListener("toggle", () => updateCardsToggle(root));
    });

    cardsToggleButton.addEventListener("click", () => {
      const allOpen = cards.every((card) => card.open);
      cards.forEach((card) => {
        card.open = !allOpen;
      });
      updateCardsToggle(root);
    });

    progressToggleButton.addEventListener("click", () => toggleProgressCollapsed(root));
    deckButton.addEventListener("click", () => openDeck(root));

    const state = {
      contentInner,
      toolbar,
      cards,
      cardsToggleButton,
      progressToggleButton,
      progressBar,
      progressValue,
      currentSection,
      headings: collectHeadings(contentInner),
      progressCollapsed: loadFlag(STORAGE.progressCollapsed),
      deckCards: cards.map((card) => ({
        title: normalizeText(card.querySelector(".bagu-flashcard-title-text h3")?.textContent || ""),
        html: card.querySelector(".bagu-flashcard-content")?.innerHTML || ""
      }))
    };

    root.__baguEducationState = state;
    contentInner.dataset.eduReady = "1";

    setProgressControls(root, state.progressCollapsed);
    updateCardsToggle(root);
    syncMobileDock(root);
    requestReadingUpdate(root);
    revealHashTarget(root);
  }

  function renderDeck(root) {
    const ui = ensureGlobalUi(root);
    const state = root.__baguEducationState;

    if (!state || !ui.deckState || !state.deckCards.length) {
      return;
    }

    const index = ui.deckState.index;
    const card = state.deckCards[index];
    const isAnswerVisible = ui.deckState.openAnswers.has(index);

    ui.deckCounter.textContent = `${index + 1} / ${state.deckCards.length}`;
    setButtonLabel(ui.deckAnswer, "cardsOpen", isAnswerVisible ? LABELS.hideAnswer : LABELS.showAnswer);
    ui.deckPrev.disabled = index === 0;
    ui.deckNext.disabled = index === state.deckCards.length - 1;

    ui.deckStage.innerHTML = `
      <article class="bagu-deck-card">
        <div class="bagu-deck-card-kicker">Swipe Left / Right</div>
        <h3>${card.title}</h3>
        <div class="bagu-deck-card-answer ${isAnswerVisible ? "is-visible" : ""}">
          ${card.html}
        </div>
      </article>
    `;
  }

  function openDeck(root) {
    const state = root.__baguEducationState;
    if (!state || !state.deckCards.length) {
      return;
    }

    const ui = ensureGlobalUi(root);
    ui.deckState = {
      index: 0,
      openAnswers: new Set([0])
    };

    ui.deckOverlay.dataset.open = "1";
    document.body.classList.add("bagu-deck-open");
    renderDeck(root);
  }

  function closeDeck(root) {
    const ui = ensureGlobalUi(root);
    ui.deckOverlay.dataset.open = "0";
    ui.deckState = null;
    document.body.classList.remove("bagu-deck-open");
  }

  function moveDeck(root, delta) {
    const ui = ensureGlobalUi(root);
    const state = root.__baguEducationState;

    if (!ui.deckState || !state || !state.deckCards.length) {
      return;
    }

    const nextIndex = clamp(ui.deckState.index + delta, 0, state.deckCards.length - 1);
    if (nextIndex === ui.deckState.index) {
      return;
    }

    ui.deckState.index = nextIndex;
    ui.deckState.openAnswers.add(nextIndex);
    renderDeck(root);
  }

  function toggleDeckAnswer(root) {
    const ui = ensureGlobalUi(root);
    if (!ui.deckState) {
      return;
    }

    const index = ui.deckState.index;
    if (ui.deckState.openAnswers.has(index)) {
      ui.deckState.openAnswers.delete(index);
    } else {
      ui.deckState.openAnswers.add(index);
    }
    renderDeck(root);
  }

  function bindGlobalListeners(root) {
    if (root.__baguListenersBound) {
      return;
    }

    window.addEventListener("scroll", () => requestReadingUpdate(root), { passive: true });
    window.addEventListener("resize", () => {
      ensureLayoutControls(root);
      if (root.__baguLayoutState) {
        root.__baguLayoutState.leftWidth = clamp(root.__baguLayoutState.leftWidth, getBounds("left").min, getBounds("left").max);
        root.__baguLayoutState.rightWidth = clamp(root.__baguLayoutState.rightWidth, getBounds("right").min, getBounds("right").max);
        applyLayoutState(root);
      }
      syncMobileDock(root);
      requestReadingUpdate(root);
    });

    window.addEventListener("hashchange", () => {
      revealHashTarget(root);
      requestReadingUpdate(root);
      syncTocCurrent(root);
    });

    window.addEventListener("keydown", (event) => {
      const ui = ensureGlobalUi(root);
      if (ui.deckOverlay.dataset.open !== "1") {
        return;
      }

      if (event.key === "Escape") {
        closeDeck(root);
      } else if (event.key === "ArrowLeft") {
        moveDeck(root, -1);
      } else if (event.key === "ArrowRight") {
        moveDeck(root, 1);
      }
    });

    root.__baguListenersBound = true;
  }

  function updateTocControlLabel(root) {
    const state = root.__baguTocState;
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!state || !nav) {
      return;
    }

    const button = nav.querySelector(".bagu-toc-mode");
    if (button) {
      button.textContent = state.compact ? "展开全部目录" : "仅看当前章节";
    }
  }

  function getActiveTocId(root) {
    return root.__baguTocState?.activeId || root.__baguEducationState?.currentHeadingId || (location.hash ? location.hash.slice(1) : "");
  }

  function setActiveToc(root, id) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    const links = Array.from(nav.querySelectorAll(".md-nav__link"));
    links.forEach((link) => link.classList.remove("md-nav__link--active"));

    const topItems = Array.from(nav.querySelectorAll(":scope > .md-nav__list > .bagu-toc-item"));
    topItems.forEach((item) => item.classList.remove("bagu-toc-current"));

    if (!id) {
      return;
    }

    const link = nav.querySelector(`a.md-nav__link[href="#${escapeSelector(id)}"]`);
    if (!link) {
      return;
    }

    link.classList.add("md-nav__link--active");
    const topItem = topItems.find((item) => item.contains(link));
    if (topItem) {
      topItem.classList.add("bagu-toc-current");
    }

    const collapsedState = loadJSON(STORAGE.tocCollapsed, {});
    const pageKey = getPageKey();
    collapsedState[pageKey] = collapsedState[pageKey] || {};

    let current = link.closest(".bagu-toc-item");
    while (current) {
      if (current.classList.contains("bagu-collapsed")) {
        current.classList.remove("bagu-collapsed");
        const tocId = current.dataset.tocId;
        if (tocId) {
          collapsedState[pageKey][tocId] = false;
        }
        const toggle = current.querySelector(":scope > .bagu-toc-row .bagu-toc-toggle");
        if (toggle) {
          toggle.innerHTML = icon("chevronDown");
        }
      }
      current = current.parentElement ? current.parentElement.closest(".bagu-toc-item") : null;
    }

    saveJSON(STORAGE.tocCollapsed, collapsedState);
  }

  function syncTocCurrent(root) {
    const currentId = getActiveTocId(root);
    setActiveToc(root, currentId);
  }

  function bindTocObserver(root) {
    if (root.__baguTocObserver) {
      root.__baguTocObserver.disconnect();
      root.__baguTocObserver = null;
    }

    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner) {
      return;
    }

    const headings = Array.from(contentInner.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]"));
    if (!headings.length) {
      const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
      if (nav) {
        nav.innerHTML = '<div class="bagu-toc-empty">当前文档没有二级目录</div>';
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const id = visible[0].target.id;
          const state = root.__baguTocState || { compact: loadFlagWithDefault(STORAGE.tocCompact, true) };
          state.activeId = id;
          root.__baguTocState = state;
          setActiveToc(root, id);
        }
      },
      {
        rootMargin: "-18% 0px -72% 0px",
        threshold: [0, 1]
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    root.__baguTocObserver = observer;
  }

  function init() {
    const root = document;
    document.body.classList.toggle("bagu-home-hero", !!root.querySelector(".hero-shell"));

    ensureGlobalUi(root);
    suppressSearchInitMessage(root);
    ensureLayoutControls(root);
    ensureSidebarChrome(root);
    buildTocTree(root);
    bindTocObserver(root);
    bindGlobalListeners(root);
    initEducationFeatures(root);

    if (document.body.classList.contains("bagu-home-hero")) {
      clearReadingState(root);
    }

    requestReadingUpdate(root);
  }

  document.addEventListener("DOMContentLoaded", init);

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(() => {
      window.setTimeout(init, 0);
    });
  }
})();
