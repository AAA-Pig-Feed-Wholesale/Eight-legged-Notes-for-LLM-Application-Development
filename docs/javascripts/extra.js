(function () {
  const STORAGE = {
    leftWidth: "bagu_mkdocs_left_width",
    rightWidth: "bagu_mkdocs_right_width",
    leftCollapsed: "bagu_mkdocs_left_collapsed",
    rightCollapsed: "bagu_mkdocs_right_collapsed",
    tocCollapsed: "bagu_mkdocs_toc_collapsed",
    progressCollapsed: "bagu_mkdocs_progress_collapsed"
  };

  const DEFAULTS = {
    leftWidth: 248,
    rightWidth: 272
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
        min: 208,
        max: Math.min(380, Math.floor(window.innerWidth * 0.3))
      };
    }

    return {
      min: 208,
      max: Math.min(400, Math.floor(window.innerWidth * 0.34))
    };
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

  function getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
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
    document.body.classList.toggle("bagu-right-collapsed", !!state.rightCollapsed);
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

    if ((side === "left" && state.leftCollapsed) || (side === "right" && state.rightCollapsed)) {
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
      const nextWidth = clamp(startWidth + delta, bounds.min, bounds.max);

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
    const secondary = root.querySelector(".md-sidebar--secondary");

    if (!inner || !primary || !secondary || inner.dataset.baguLayoutReady === "1") {
      return;
    }

    const state = {
      leftWidth: clamp(Number(localStorage.getItem(STORAGE.leftWidth)) || DEFAULTS.leftWidth, getBounds("left").min, getBounds("left").max),
      rightWidth: clamp(Number(localStorage.getItem(STORAGE.rightWidth)) || DEFAULTS.rightWidth, getBounds("right").min, getBounds("right").max),
      leftCollapsed: loadFlag(STORAGE.leftCollapsed),
      rightCollapsed: loadFlag(STORAGE.rightCollapsed)
    };

    const leftHandle = document.createElement("button");
    leftHandle.type = "button";
    leftHandle.className = "bagu-resize-handle bagu-resize-left";
    leftHandle.setAttribute("aria-label", "拖拽调整左侧栏宽度");
    leftHandle.addEventListener("pointerdown", (event) => beginResize(root, "left", event));

    const rightHandle = document.createElement("button");
    rightHandle.type = "button";
    rightHandle.className = "bagu-resize-handle bagu-resize-right";
    rightHandle.setAttribute("aria-label", "拖拽调整右侧栏宽度");
    rightHandle.addEventListener("pointerdown", (event) => beginResize(root, "right", event));

    inner.insertBefore(leftHandle, root.querySelector(".md-content"));
    inner.insertBefore(rightHandle, secondary);

    const leftToggle = document.createElement("button");
    leftToggle.type = "button";
    leftToggle.className = "bagu-sidebar-toggle bagu-toggle-left";
    leftToggle.addEventListener("click", () => {
      state.leftCollapsed = !state.leftCollapsed;
      saveFlag(STORAGE.leftCollapsed, state.leftCollapsed);
      applyLayoutState(root);
    });
    primary.appendChild(leftToggle);

    const rightToggle = document.createElement("button");
    rightToggle.type = "button";
    rightToggle.className = "bagu-sidebar-toggle bagu-toggle-right";
    rightToggle.addEventListener("click", () => {
      state.rightCollapsed = !state.rightCollapsed;
      saveFlag(STORAGE.rightCollapsed, state.rightCollapsed);
      applyLayoutState(root);
    });
    secondary.appendChild(rightToggle);

    state.leftToggle = leftToggle;
    state.rightToggle = rightToggle;
    root.__baguLayoutState = state;
    inner.dataset.baguLayoutReady = "1";
    applyLayoutState(root);
  }

  function buildTocTree(root) {
    const nav = root.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav || nav.dataset.baguTocReady === "1") {
      return;
    }

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
        label: normalizeText(element.textContent)
      }))
      .filter((item) => item.label);
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

  function resolveCurrentSection(headings) {
    if (!headings.length) {
      return LABELS.currentSectionFallback;
    }

    const threshold = getScrollTop() + (getMobile() ? 120 : 150);
    let current = headings[0].label;

    headings.forEach((item) => {
      const top = getScrollTop() + item.element.getBoundingClientRect().top;
      if (top <= threshold) {
        current = item.label;
      }
    });

    return current;
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
    const currentSection = resolveCurrentSection(state.headings);

    state.progressBar.style.width = `${progress}%`;
    state.progressValue.textContent = progressText;
    state.currentSection.textContent = currentSection;

    ui.mobileProgressBar.style.width = `${progress}%`;
    ui.mobileProgressToggle.querySelector("span").textContent = `进度 ${progressText}`;
    ui.mobileSection.textContent = currentSection;

    syncMobileDock(root);
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

  function init() {
    const root = document;
    document.body.classList.toggle("bagu-home-hero", !!root.querySelector(".hero-shell"));

    ensureGlobalUi(root);
    ensureLayoutControls(root);
    buildTocTree(root);
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
