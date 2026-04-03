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

  function debounce(fn, wait = 120) {
    let timer = 0;
    return (...args) => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = 0;
        fn(...args);
      }, wait);
    };
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }

  function getDesktop() {
    return window.matchMedia("(min-width: 56em)").matches;
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

  function getPageKey() {
    return location.pathname;
  }

  function loadJSON(key, fallback) {
    try {
      const raw = safeGetItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    safeSetItem(key, JSON.stringify(value));
  }

  function loadFlag(key) {
    return safeGetItem(key) === "1";
  }

  function saveFlag(key, value) {
    safeSetItem(key, value ? "1" : "0");
  }

  function loadFlagWithDefault(key, fallback) {
    const raw = safeGetItem(key);
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

  function getFocusableElements(container) {
    if (!container) {
      return [];
    }
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])'
    ].join(",");
    return Array.from(container.querySelectorAll(selector))
      .filter((element) => element.getClientRects().length > 0);
  }

  function trapFocus(container, event) {
    if (event.key !== "Tab") {
      return;
    }
    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateSidebarToggleButton(button, side, collapsed) {
    if (!button) {
      return;
    }
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    button.setAttribute("aria-pressed", collapsed ? "true" : "false");
    if (side === "left") {
      setIconButton(button, collapsed ? "chevronRight" : "chevronLeft", collapsed ? "展开左侧栏" : "收起左侧栏");
      return;
    }

    setIconButton(button, collapsed ? "chevronLeft" : "chevronRight", collapsed ? "展开右侧栏" : "收起右侧栏");
  }

  function cloneNodeArray(nodes) {
    return nodes.map((node) => node.cloneNode(true));
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

  function ensureSecondaryToc(root, nav) {
    if (!nav) {
      return false;
    }

    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner) {
      return false;
    }

    const empty = nav.querySelector(".bagu-toc-empty");
    if (empty) {
      empty.remove();
    }

    const existingList = nav.querySelector(".md-nav__list");
    if (existingList) {
      existingList.remove();
    }

    const existingTitle = nav.querySelector(".md-nav__title");
    if (existingTitle) {
      existingTitle.remove();
    }

    const headings = Array.from(contentInner.querySelectorAll("h2, h3, h4, h5, h6"))
      .map((heading) => ({
        element: heading,
        level: Number(heading.tagName.slice(1)),
        label: normalizeText(heading.textContent)
      }))
      .filter((heading) => heading.element.id && heading.label && heading.level >= 2 && heading.level <= 6);

    if (!headings.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "bagu-toc-empty";
      emptyMessage.textContent = "当前页面暂无可用目录";
      nav.appendChild(emptyMessage);
      return false;
    }

    const list = document.createElement("ul");
    list.className = "md-nav__list";
    list.setAttribute("data-md-component", "toc");
    list.setAttribute("data-md-scrollfix", "");

    const label = document.createElement("label");
    label.className = "md-nav__title";
    label.setAttribute("for", "__toc");
    label.innerHTML = '<span class="md-nav__icon md-icon"></span>目录';

    nav.appendChild(label);
    nav.appendChild(list);

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

      const text = document.createElement("span");
      text.className = "md-ellipsis";
      text.textContent = heading.label;
      link.appendChild(text);
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
    return { secondary, toc, enabled };
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
        search.setAttribute("aria-label", "Search navigation");
        header.insertAdjacentElement("afterend", search);

        const onSearch = debounce(() => {
          filterPrimaryNav(root, search.value);
        }, 120);
        search.addEventListener("input", onSearch);
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

  function applyLayoutState(root) {
    const state = root.__baguLayoutState;
    if (!state) {
      return;
    }

    document.body.classList.toggle("bagu-left-collapsed", !!state.leftCollapsed);
    document.body.classList.toggle("bagu-right-collapsed", !!state.rightEnabled && !!state.rightCollapsed);
    document.body.classList.toggle("bagu-right-disabled", !state.rightEnabled);

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
        safeSetItem(STORAGE.leftWidth, String(nextWidth));
      } else {
        state.rightWidth = nextWidth;
        safeSetItem(STORAGE.rightWidth, String(nextWidth));
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

    const state = root.__baguLayoutState || {
      leftWidth: clamp(Number(safeGetItem(STORAGE.leftWidth)) || DEFAULTS.leftWidth, getBounds("left").min, getBounds("left").max),
      rightWidth: clamp(Number(safeGetItem(STORAGE.rightWidth)) || DEFAULTS.rightWidth, getBounds("right").min, getBounds("right").max),
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
      rightHandle = null;
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

    applyLayoutState(root);
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
      button.setAttribute("aria-pressed", state.compact ? "true" : "false");
    }
  }

  function setActiveToc(root, id) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    const links = Array.from(nav.querySelectorAll("a.md-nav__link"));
    const items = Array.from(nav.querySelectorAll(".bagu-toc-item"));

    links.forEach((link) => {
      const active = !!id && link.getAttribute("href") === `#${id}`;
      link.classList.toggle("md-nav__link--active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    items.forEach((item) => item.classList.remove("bagu-toc-current"));

    if (!id) {
      return;
    }

    const link = nav.querySelector(`a.md-nav__link[href="#${escapeSelector(id)}"]`);
    if (!link) {
      return;
    }

    const topItems = Array.from(nav.querySelectorAll(":scope > .md-nav__list > .bagu-toc-item"));
    const topItem = topItems.find((item) => item.contains(link));
    if (topItem) {
      topItem.classList.add("bagu-toc-current");
    }

    const parentItems = [];
    let item = link.closest(".bagu-toc-item");
    while (item) {
      parentItems.push(item);
      item = item.parentElement ? item.parentElement.closest(".bagu-toc-item") : null;
    }

    parentItems.forEach((parentItem) => {
      parentItem.classList.remove("bagu-collapsed");
      const toggle = parentItem.querySelector(":scope > .bagu-toc-row > .bagu-toc-toggle");
      if (toggle) {
        toggle.innerHTML = icon("chevronDown");
      }
    });
  }

  function syncTocCurrent(root) {
    const currentId = root.__baguEducationState?.currentHeadingId || (location.hash ? location.hash.slice(1) : "");
    setActiveToc(root, currentId);
  }

  function buildTocTree(root) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    if (!ensureSecondaryToc(root, nav)) {
      nav.dataset.baguTocReady = "0";
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
    const cards = [];
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
        currentCard.__baguQuestionHtml = cloneH3.outerHTML;
        currentCard.__baguAnswerNodes = [];
        cards.push(currentCard);
        return;
      }

      if (currentCard && currentContent) {
        const cloned = element.cloneNode(true);
        currentContent.appendChild(cloned);
        currentCard.__baguAnswerNodes.push(cloned.cloneNode(true));
        element.remove();
      }
    });

    return cards;
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
    deckOverlay.setAttribute("aria-hidden", "true");
    const deckDialog = deckOverlay.querySelector(".bagu-deck-dialog");
    if (deckDialog) {
      deckDialog.setAttribute("tabindex", "-1");
      deckDialog.id = "bagu-deck-dialog";
    }
    document.body.appendChild(deckOverlay);

    const ui = {
      mobileDock,
      mobileSection: mobileDock.querySelector(".bagu-mobile-current-section"),
      mobileProgressToggle: mobileDock.querySelector(".bagu-mobile-progress-toggle"),
      mobileProgressBar: mobileDock.querySelector(".bagu-mobile-progress-bar"),
      mobileDeckButton: mobileDock.querySelector(".bagu-mobile-open-deck"),
      deckOverlay,
      deckDialog,
      deckStage: deckOverlay.querySelector(".bagu-deck-stage"),
      deckCounter: deckOverlay.querySelector(".bagu-deck-counter"),
      deckClose: deckOverlay.querySelector(".bagu-deck-close"),
      deckAnswer: deckOverlay.querySelector(".bagu-deck-answer"),
      deckPrev: deckOverlay.querySelector(".bagu-deck-prev"),
      deckNext: deckOverlay.querySelector(".bagu-deck-next"),
      deckState: null,
      deckFocusHandler: null,
      lastActiveElement: null
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
    ui.mobileDeckButton.setAttribute("aria-haspopup", "dialog");
    ui.mobileDeckButton.setAttribute("aria-controls", "bagu-deck-dialog");

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
    state.cardsToggleButton.setAttribute("aria-pressed", allOpen ? "true" : "false");
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
    ui.mobileProgressToggle.setAttribute("aria-pressed", collapsed ? "true" : "false");
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

    state.progressBar.style.width = progressText;
    state.progressValue.textContent = progressText;
    state.currentSection.textContent = currentSection;

    ui.mobileProgressBar.style.width = progressText;
    ui.mobileSection.textContent = currentSection;

    syncTocCurrent(root);
    syncMobileDock(root);
  }

  function createDeckCard(state, card, index) {
    const wrapper = document.createElement("article");
    wrapper.className = "bagu-deck-card";

    const question = document.createElement("div");
    question.className = "bagu-deck-card-question";
    question.innerHTML = card.__baguQuestionHtml || `<h3>卡片 ${index + 1}</h3>`;

    const answer = document.createElement("div");
    answer.className = "bagu-deck-card-answer";

    const answerNodes = card.__baguAnswerNodes && card.__baguAnswerNodes.length
      ? cloneNodeArray(card.__baguAnswerNodes)
      : Array.from(card.querySelectorAll(".bagu-flashcard-content > *")).map((node) => node.cloneNode(true));

    answerNodes.forEach((node) => answer.appendChild(node));
    answer.hidden = !state.showAnswer;

    wrapper.appendChild(question);
    wrapper.appendChild(answer);

    return { wrapper, answer };
  }

  function renderDeck(root) {
    const ui = ensureGlobalUi(root);
    const state = ui.deckState;
    if (!state || !state.cards.length) {
      ui.deckStage.innerHTML = "";
      ui.deckCounter.textContent = "0 / 0";
      ui.deckPrev.disabled = true;
      ui.deckNext.disabled = true;
      setIconButton(ui.deckAnswer, "cardsOpen", LABELS.showAnswer);
      return;
    }

    const currentCard = state.cards[state.index];
    ui.deckStage.innerHTML = "";

    const { wrapper } = createDeckCard(state, currentCard, state.index);
    ui.deckStage.appendChild(wrapper);

    ui.deckCounter.textContent = `${state.index + 1} / ${state.cards.length}`;
    ui.deckPrev.disabled = state.index <= 0;
    ui.deckNext.disabled = state.index >= state.cards.length - 1;
    setIconButton(ui.deckAnswer, state.showAnswer ? "cardsClosed" : "cardsOpen", state.showAnswer ? LABELS.hideAnswer : LABELS.showAnswer);
  }

  function openDeck(root) {
    const ui = ensureGlobalUi(root);
    const state = root.__baguEducationState;
    if (!state || !state.cards.length) {
      return;
    }

    ui.lastActiveElement = document.activeElement;
    ui.deckState = {
      cards: state.cards,
      index: 0,
      showAnswer: false
    };

    renderDeck(root);
    ui.deckOverlay.classList.add("is-open");
    ui.deckOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!ui.deckFocusHandler) {
      ui.deckFocusHandler = (event) => {
        if (event.key === "Escape") {
          closeDeck(root);
          return;
        }
        trapFocus(ui.deckDialog, event);
      };
    }
    document.addEventListener("keydown", ui.deckFocusHandler);
    window.setTimeout(() => {
      ui.deckDialog?.focus();
    }, 0);
  }

  function closeDeck(root) {
    const ui = ensureGlobalUi(root);
    if (!ui.deckOverlay.classList.contains("is-open")) {
      return;
    }

    ui.deckOverlay.classList.remove("is-open");
    ui.deckOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (ui.deckFocusHandler) {
      document.removeEventListener("keydown", ui.deckFocusHandler);
    }
    ui.deckState = null;

    if (ui.lastActiveElement && typeof ui.lastActiveElement.focus === "function") {
      ui.lastActiveElement.focus();
    }
  }

  function moveDeck(root, delta) {
    const ui = ensureGlobalUi(root);
    const state = ui.deckState;
    if (!state) {
      return;
    }

    const nextIndex = clamp(state.index + delta, 0, state.cards.length - 1);
    if (nextIndex === state.index) {
      return;
    }

    state.index = nextIndex;
    renderDeck(root);
  }

  function toggleDeckAnswer(root) {
    const ui = ensureGlobalUi(root);
    const state = ui.deckState;
    if (!state) {
      return;
    }

    state.showAnswer = !state.showAnswer;
    renderDeck(root);
  }

  function bindTocObserver(root) {
    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner || contentInner.__baguTocObserverBound) {
      return;
    }

    const headings = Array.from(contentInner.querySelectorAll("h2, .bagu-h3-anchor"));
    if (!headings.length) {
      return;
    }

    const state = root.__baguEducationState;
    const observer = new IntersectionObserver((entries) => {
      if (!state) {
        return;
      }

      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visible.length) {
        return;
      }

      const top = visible[0].target;
      state.currentHeadingId = top.id || "";
      syncTocCurrent(root);
    }, {
      root: null,
      rootMargin: "-15% 0px -70% 0px",
      threshold: [0, 1]
    });

    headings.forEach((heading) => observer.observe(heading));
    contentInner.__baguTocObserverBound = true;
    contentInner.__baguTocObserver = observer;
  }

  function initEducationFeatures(root) {
    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner || contentInner.dataset.eduReady === "1") {
      return;
    }

    const cards = buildFlashcards(contentInner);
    const toolbar = buildToolbar(cards.length);
    contentInner.insertBefore(toolbar, contentInner.firstChild);

    const state = {
      toolbar,
      cards,
      headings: collectHeadings(contentInner),
      currentHeadingId: "",
      currentSection: toolbar.querySelector(".bagu-current-section"),
      progressBar: toolbar.querySelector(".bagu-progress-bar"),
      progressValue: toolbar.querySelector(".bagu-progress-value"),
      progressToggleButton: toolbar.querySelector(".bagu-progress-toggle"),
      cardsToggleButton: toolbar.querySelector(".bagu-cards-toggle"),
      deckButton: toolbar.querySelector(".bagu-open-deck"),
      progressCollapsed: loadFlag(STORAGE.progressCollapsed)
    };

    root.__baguEducationState = state;

    state.progressToggleButton.addEventListener("click", () => toggleProgressCollapsed(root));
    state.cardsToggleButton.addEventListener("click", () => {
      const allOpen = state.cards.every((card) => card.open);
      state.cards.forEach((card) => {
        card.open = !allOpen;
      });
      updateCardsToggle(root);
    });
    state.deckButton.addEventListener("click", () => openDeck(root));

    state.cards.forEach((card) => {
      card.addEventListener("toggle", () => updateCardsToggle(root));
    });

    setProgressControls(root, state.progressCollapsed);
    updateCardsToggle(root);

    contentInner.dataset.eduReady = "1";
  }

  function isHomePage(root) {
    const firstHeading = root.querySelector(".md-content__inner > h1");
    if (!firstHeading) {
      return false;
    }
    const text = normalizeText(firstHeading.textContent).toLowerCase();
    return text.includes("home") || text.includes("首页");
  }

  function initHomeHero(root) {
    document.body.classList.toggle("bagu-home-hero", isHomePage(root));
  }

  function cleanupRoot(root) {
    const contentInner = root.querySelector(".md-content__inner");
    if (contentInner && contentInner.__baguTocObserver) {
      contentInner.__baguTocObserver.disconnect();
      contentInner.__baguTocObserver = null;
      contentInner.__baguTocObserverBound = false;
    }
  }

  function init() {
    const root = document.querySelector(".md-main");
    if (!root) {
      return;
    }

    cleanupRoot(root);
    initHomeHero(root);
    initEducationFeatures(root);
    buildTocTree(root);
    bindTocObserver(root);
    ensureLayoutControls(root);
    ensureSidebarChrome(root);
    suppressSearchInitMessage(root);
    updateReadingState(root);
  }

  const debouncedRefresh = debounce(() => {
    init();
  }, 80);

  document.addEventListener("scroll", () => {
    const root = document.querySelector(".md-main");
    if (!root || !root.__baguEducationState) {
      return;
    }
    updateReadingState(root);
  }, { passive: true });

  window.addEventListener("resize", () => {
    const root = document.querySelector(".md-main");
    if (!root) {
      return;
    }

    if (root.__baguLayoutState) {
      const state = root.__baguLayoutState;
      state.leftWidth = clamp(state.leftWidth, getBounds("left").min, getBounds("left").max);
      state.rightWidth = clamp(state.rightWidth, getBounds("right").min, getBounds("right").max);
      applyLayoutState(root);
    }

    syncMobileDock(root);
    debouncedRefresh();
  });

  window.addEventListener("hashchange", () => {
    const root = document.querySelector(".md-main");
    if (!root) {
      return;
    }
    const state = root.__baguEducationState;
    if (state) {
      state.currentHeadingId = location.hash ? location.hash.slice(1) : "";
      syncTocCurrent(root);
      updateReadingState(root);
    }
  });

  document.addEventListener("DOMContentLoaded", init);

  if (document.readyState === "interactive" || document.readyState === "complete") {
    init();
  }

  const bodyObserver = new MutationObserver((mutations) => {
    const shouldRefresh = mutations.some((mutation) => {
      if (mutation.type === "childList") {
        return mutation.addedNodes.length || mutation.removedNodes.length;
      }
      return false;
    });

    if (shouldRefresh) {
      debouncedRefresh();
    }
  });

  if (document.body) {
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();