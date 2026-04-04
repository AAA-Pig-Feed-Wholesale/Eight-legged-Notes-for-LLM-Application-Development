(function () {
  const STORAGE = {
    tocCompact: "bagu_toc_compact",
    sectionsCollapsed: "bagu_sections_collapsed"
  };

  const LABELS = {
    nav: "\u5bfc\u822a",
    toc: "\u76ee\u5f55",
    current: "\u5f53\u524d\u7ae0\u8282",
    start: "\u5f00\u59cb\u9605\u8bfb",
    collapse: "\u6536\u8d77",
    expand: "\u5c55\u5f00",
    collapseAll: "\u6536\u8d77\u5168\u90e8",
    expandAll: "\u5c55\u5f00\u5168\u90e8",
    focusToc: "\u76ee\u5f55\u805a\u7126",
    showTocAll: "\u5c55\u5f00\u5168\u90e8\u76ee\u5f55",
    showTocCurrent: "\u4ec5\u770b\u5f53\u524d\u7ae0\u8282",
    learnTitle: "\u5b66\u4e60\u5efa\u8bae",
    learnBody: "\u5efa\u8bae\u5148\u901a\u8bfb\u76ee\u5f55\u7ed3\u6784\uff0c\u518d\u4ece\u5f53\u524d\u7ae0\u8282\u5f00\u59cb\u7cbe\u8bfb\u3002\u9884\u8ba1\u9605\u8bfb\u65f6\u957f\uff1a",
    minutes: "\u5206\u949f",
    tocButton: "\u76ee\u5f55",
    close: "\u5173\u95ed",
    emptyToc: "\u6682\u65e0\u76ee\u5f55"
  };

  function loadFlag(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  }

  function saveFlag(key, value) {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
    }
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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }

  function getPageKey() {
    return location.pathname;
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

  function getHeadings(root) {
    return Array.from(root.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]"));
  }

  function buildSidebarHeader(sidebar, label) {
    const inner = sidebar.querySelector(".md-sidebar__inner");
    if (!inner) {
      return null;
    }

    let header = inner.querySelector(".bagu-sidebar-top");
    if (!header) {
      header = document.createElement("div");
      header.className = "bagu-sidebar-top";
      const title = document.createElement("div");
      title.className = "bagu-sidebar-label";
      title.textContent = label;
      header.appendChild(title);
      inner.insertBefore(header, inner.firstChild);
    }

    return header;
  }

  function initSidebars() {
    const primary = document.querySelector(".md-sidebar--primary");
    const secondary = document.querySelector(".md-sidebar--secondary");
    if (!primary && !secondary) {
      return null;
    }

    document.body.classList.remove("bagu-sidebar-left-collapsed", "bagu-sidebar-right-collapsed");

    if (primary) {
      buildSidebarHeader(primary, LABELS.nav);
    }

    if (secondary) {
      buildSidebarHeader(secondary, LABELS.toc);
    }

    return true;
  }

  function ensureTocControls() {
    const nav = document.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    const state = {
      compact: loadFlag(STORAGE.tocCompact)
    };

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
        updateTocControlLabel(button, state.compact);
      });
    }

    updateTocControlLabel(nav.querySelector(".bagu-toc-mode"), state.compact);
  }

  function updateTocControlLabel(button, compact) {
    if (!button) {
      return;
    }
    button.textContent = compact ? LABELS.showTocAll : LABELS.showTocCurrent;
    button.setAttribute("aria-pressed", compact ? "true" : "false");
  }

  function setActiveToc(id) {
    const nav = document.querySelector(".md-sidebar--secondary .md-nav--secondary");
    if (!nav) {
      return;
    }

    const links = Array.from(nav.querySelectorAll(".md-nav__link"));
    links.forEach((link) => link.classList.remove("md-nav__link--active"));

    const items = Array.from(nav.querySelectorAll(".md-nav__item"));
    items.forEach((item) => item.classList.remove("bagu-toc-current"));

    if (!id) {
      return;
    }

    const link = nav.querySelector(`a.md-nav__link[href="#${escapeSelector(id)}"]`);
    if (!link) {
      return;
    }

    link.classList.add("md-nav__link--active");
    const item = link.closest(".md-nav__item");
    if (item) {
      item.classList.add("bagu-toc-current");
    }
  }

  function bindTocObserver(root) {
    const contentInner = root.querySelector(".md-content__inner");
    if (!contentInner) {
      return;
    }

    const headings = getHeadings(contentInner);
    if (!headings.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          setActiveToc(visible[0].target.id);
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

  function estimateReadingTime(root) {
    const text = normalizeText(root.textContent);
    const chars = text.length;
    return Math.max(1, Math.round(chars / 500));
  }

  function buildLearningHint(root) {
    const h1 = root.querySelector("h1");
    if (!h1 || root.querySelector(".bagu-learning-hint")) {
      return;
    }

    const minutes = estimateReadingTime(root);
    const hint = document.createElement("div");
    hint.className = "bagu-learning-hint";
    hint.innerHTML = `
      <div class="bagu-learning-title">${LABELS.learnTitle}</div>
      <div class="bagu-learning-body">
        ${LABELS.learnBody} ${minutes} ${LABELS.minutes}
      </div>
    `;
    h1.insertAdjacentElement("afterend", hint);
  }

  function wrapSections(root) {
    if (root.dataset.sectionsReady === "1") {
      return;
    }

    const pageKey = getPageKey();
    const collapsedMap = loadJSON(STORAGE.sectionsCollapsed, {});
    collapsedMap[pageKey] = collapsedMap[pageKey] || {};

    const headings = Array.from(root.querySelectorAll("h2"));
    headings.forEach((heading, index) => {
      const sectionId = heading.id || `bagu-section-${index}`;
      heading.dataset.sectionId = sectionId;

      let body = heading.nextElementSibling;
      const wrapper = document.createElement("div");
      wrapper.className = "bagu-section-body";
      while (body && body.tagName !== "H2") {
        const next = body.nextElementSibling;
        wrapper.appendChild(body);
        body = next;
      }
      heading.insertAdjacentElement("afterend", wrapper);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bagu-section-toggle";
      toggle.innerHTML = `<span>${LABELS.collapse}</span>`;
      heading.appendChild(toggle);

      const collapsed = !!collapsedMap[pageKey][sectionId];
      wrapper.classList.toggle("is-collapsed", collapsed);
      toggle.setAttribute("aria-pressed", collapsed ? "true" : "false");
      toggle.querySelector("span").textContent = collapsed ? LABELS.expand : LABELS.collapse;

      toggle.addEventListener("click", () => {
        const isCollapsed = wrapper.classList.toggle("is-collapsed");
        collapsedMap[pageKey][sectionId] = isCollapsed;
        saveJSON(STORAGE.sectionsCollapsed, collapsedMap);
        toggle.setAttribute("aria-pressed", isCollapsed ? "true" : "false");
        toggle.querySelector("span").textContent = isCollapsed ? LABELS.expand : LABELS.collapse;
      });
    });

    root.dataset.sectionsReady = "1";
  }

  function buildToolbar(root) {
    if (root.querySelector(".bagu-toolbar")) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "bagu-toolbar";
    toolbar.innerHTML = `
      <div class="bagu-toolbar-main">
        <div class="bagu-toolbar-meta">
          <span class="bagu-toolbar-label">${LABELS.current}</span>
          <strong class="bagu-current-section">${LABELS.start}</strong>
        </div>
        <div class="bagu-progress-shell">
          <div class="bagu-progress-container">
            <div class="bagu-progress-bar"></div>
          </div>
          <span class="bagu-progress-value">0%</span>
        </div>
      </div>
      <div class="bagu-toolbar-actions">
        <button type="button" class="bagu-toolbar-btn bagu-sections-toggle">${LABELS.collapseAll}</button>
        <button type="button" class="bagu-toolbar-btn bagu-toc-toggle">${LABELS.focusToc}</button>
      </div>
    `;

    const h1 = root.querySelector("h1");
    if (h1) {
      h1.insertAdjacentElement("afterend", toolbar);
    } else {
      root.insertAdjacentElement("afterbegin", toolbar);
    }
  }

  function buildMobileDock() {
    if (document.querySelector(".bagu-mobile-dock")) {
      return;
    }

    const dock = document.createElement("div");
    dock.className = "bagu-mobile-dock";
    dock.innerHTML = `
      <div class="bagu-mobile-main">
        <div class="bagu-mobile-copy">
          <span class="bagu-mobile-label">${LABELS.current}</span>
          <strong class="bagu-mobile-section">${LABELS.start}</strong>
        </div>
        <button type="button" class="bagu-mobile-btn bagu-open-toc">${LABELS.tocButton}</button>
      </div>
      <div class="bagu-mobile-progress">
        <div class="bagu-mobile-progress-bar"></div>
      </div>
    `;
    document.body.appendChild(dock);

    const overlay = document.createElement("div");
    overlay.className = "bagu-toc-overlay";
    overlay.innerHTML = `
      <div class="bagu-toc-panel" role="dialog" aria-modal="true" aria-label="${LABELS.toc}">
        <div class="bagu-toc-panel-head">
          <strong>${LABELS.toc}</strong>
          <button type="button" class="bagu-toc-close">${LABELS.close}</button>
        </div>
        <div class="bagu-toc-panel-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const openBtn = dock.querySelector(".bagu-open-toc");
    const closeBtn = overlay.querySelector(".bagu-toc-close");
    const panelBody = overlay.querySelector(".bagu-toc-panel-body");
    let openedAt = 0;

    function openToc() {
      const nav = document.querySelector(".md-sidebar--secondary .md-nav--secondary");
      panelBody.innerHTML = nav ? nav.innerHTML : `<div class="bagu-toc-empty">${LABELS.emptyToc}</div>`;
      overlay.dataset.open = "1";
      openedAt = Date.now();
    }

    function closeToc() {
      overlay.dataset.open = "0";
    }

    openBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openToc();
    });
    closeBtn.addEventListener("click", closeToc);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay && Date.now() - openedAt > 200) {
        closeToc();
      }
    });
  }

  function updateReadingState(root) {
    const toolbar = root.querySelector(".bagu-toolbar");
    const currentLabel = toolbar?.querySelector(".bagu-current-section");
    const progressBar = toolbar?.querySelector(".bagu-progress-bar");
    const progressValue = toolbar?.querySelector(".bagu-progress-value");

    const dock = document.querySelector(".bagu-mobile-dock");
    const dockLabel = dock?.querySelector(".bagu-mobile-section");
    const dockBar = dock?.querySelector(".bagu-mobile-progress-bar");

    const headings = getHeadings(root);
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;

    let currentHeading = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 120) {
        currentHeading = heading;
      } else {
        break;
      }
    }

    const label = currentHeading ? normalizeText(currentHeading.textContent) : LABELS.start;
    if (currentLabel) currentLabel.textContent = label;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressValue) progressValue.textContent = `${Math.round(progress)}%`;

    if (dockLabel) dockLabel.textContent = label;
    if (dockBar) dockBar.style.width = `${progress}%`;
  }

  function bindToolbarActions(root) {
    const toolbar = root.querySelector(".bagu-toolbar");
    if (!toolbar) {
      return;
    }

    const sectionsToggle = toolbar.querySelector(".bagu-sections-toggle");
    const tocToggle = toolbar.querySelector(".bagu-toc-toggle");

    sectionsToggle.addEventListener("click", () => {
      const bodies = root.querySelectorAll(".bagu-section-body");
      const allCollapsed = Array.from(bodies).every((body) => body.classList.contains("is-collapsed"));
      bodies.forEach((body) => body.classList.toggle("is-collapsed", !allCollapsed));
      sectionsToggle.textContent = allCollapsed ? LABELS.collapseAll : LABELS.expandAll;
    });

    tocToggle.addEventListener("click", () => {
      const compact = !document.body.classList.contains("bagu-toc-compact");
      document.body.classList.toggle("bagu-toc-compact", compact);
      saveFlag(STORAGE.tocCompact, compact);
    });
  }

  function init() {
    const root = document.querySelector(".md-content__inner");
    if (!root) {
      return;
    }

    initSidebars();
    ensureTocControls();

    buildLearningHint(root);
    wrapSections(root);
    buildToolbar(root);
    bindToolbarActions(root);
    buildMobileDock();

    if (window.__baguScrollHandler) {
      window.removeEventListener("scroll", window.__baguScrollHandler);
    }

    const onScroll = () => updateReadingState(root);
    window.__baguScrollHandler = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateReadingState(root);

    if (root.__baguTocObserver) {
      root.__baguTocObserver.disconnect();
    }
    bindTocObserver(document);
  }

  document.addEventListener("DOMContentLoaded", init);
  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(() => {
      window.setTimeout(init, 0);
    });
  }
})();
