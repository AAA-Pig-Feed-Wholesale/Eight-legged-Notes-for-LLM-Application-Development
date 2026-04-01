(function () {
  const STORAGE = {
    leftWidth: "bagu_mkdocs_left_width",
    rightWidth: "bagu_mkdocs_right_width",
    leftCollapsed: "bagu_mkdocs_left_collapsed",
    rightCollapsed: "bagu_mkdocs_right_collapsed",
    tocCollapsed: "bagu_mkdocs_toc_collapsed"
  };

  const DEFAULTS = {
    leftWidth: 248,
    rightWidth: 272
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getDesktop() {
    return window.matchMedia("(min-width: 992px)").matches;
  }

  function getBounds(side) {
    if (side === "left") {
      return { min: 200, max: Math.min(360, Math.floor(window.innerWidth * 0.28)) };
    }
    return { min: 220, max: Math.min(380, Math.floor(window.innerWidth * 0.3)) };
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

  function applyLayoutState(root) {
    const state = root.__baguState;
    if (!state) return;
    document.body.classList.toggle("bagu-left-collapsed", !!state.leftCollapsed);
    document.body.classList.toggle("bagu-right-collapsed", !!state.rightCollapsed);
    document.documentElement.style.setProperty("--bagu-left-width", `${state.leftWidth}px`);
    document.documentElement.style.setProperty("--bagu-right-width", `${state.rightWidth}px`);

    if (state.leftToggle) {
      state.leftToggle.innerHTML = state.leftCollapsed ? "&#9654;" : "&#9664;";
      state.leftToggle.setAttribute("aria-label", state.leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar");
    }
    if (state.rightToggle) {
      state.rightToggle.innerHTML = state.rightCollapsed ? "&#9664;" : "&#9654;";
      state.rightToggle.setAttribute("aria-label", state.rightCollapsed ? "Expand right sidebar" : "Collapse right sidebar");
    }
  }

  function beginResize(root, side, startEvent) {
    if (!getDesktop()) return;
    const state = root.__baguState;
    if ((side === "left" && state.leftCollapsed) || (side === "right" && state.rightCollapsed)) return;

    const startX = startEvent.clientX;
    const startWidth = side === "left" ? state.leftWidth : state.rightWidth;
    const bounds = getBounds(side);

    function onMove(event) {
      const delta = event.clientX - startX;
      if (side === "left") {
        state.leftWidth = clamp(startWidth + delta, bounds.min, bounds.max);
        localStorage.setItem(STORAGE.leftWidth, String(state.leftWidth));
      } else {
        state.rightWidth = clamp(startWidth - delta, bounds.min, bounds.max);
        localStorage.setItem(STORAGE.rightWidth, String(state.rightWidth));
      }
      applyLayoutState(root);
    }

    function onUp() {
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

  function teardownLayoutControls(root) {
    const inner = root.querySelector(".md-main__inner");
    if (inner) {
      inner.querySelectorAll(".bagu-resize-handle").forEach((node) => node.remove());
      delete inner.dataset.baguLayoutReady;
    }

    root.querySelectorAll(".bagu-sidebar-toggle").forEach((node) => node.remove());
    document.body.classList.remove("bagu-left-collapsed", "bagu-right-collapsed");
    document.documentElement.style.removeProperty("--bagu-left-width");
    document.documentElement.style.removeProperty("--bagu-right-width");
    delete root.__baguState;
  }

  function ensureLayoutControls(root) {
    if (!getDesktop()) {
      teardownLayoutControls(root);
      return;
    }

    const inner = root.querySelector(".md-main__inner");
    const primary = root.querySelector(".md-sidebar--primary");
    const content = root.querySelector(".md-content");
    const secondary = root.querySelector(".md-sidebar--secondary");

    if (!inner || !primary || !content || !secondary) return;
    if (inner.dataset.baguLayoutReady === "1") return;

    const state = {
      leftWidth: clamp(Number(localStorage.getItem(STORAGE.leftWidth)) || DEFAULTS.leftWidth, getBounds("left").min, getBounds("left").max),
      rightWidth: clamp(Number(localStorage.getItem(STORAGE.rightWidth)) || DEFAULTS.rightWidth, getBounds("right").min, getBounds("right").max),
      leftCollapsed: localStorage.getItem(STORAGE.leftCollapsed) === "1",
      rightCollapsed: localStorage.getItem(STORAGE.rightCollapsed) === "1"
    };

    const leftHandle = document.createElement("div");
    leftHandle.className = "bagu-resize-handle bagu-resize-left";
    leftHandle.setAttribute("role", "separator");
    leftHandle.setAttribute("aria-label", "Resize left sidebar");
    leftHandle.addEventListener("pointerdown", (event) => beginResize(root, "left", event));

    const rightHandle = document.createElement("div");
    rightHandle.className = "bagu-resize-handle bagu-resize-right";
    rightHandle.setAttribute("role", "separator");
    rightHandle.setAttribute("aria-label", "Resize right sidebar");
    rightHandle.addEventListener("pointerdown", (event) => beginResize(root, "right", event));

    inner.insertBefore(leftHandle, content);
    inner.insertBefore(rightHandle, secondary);

    const leftToggle = document.createElement("button");
    leftToggle.className = "bagu-sidebar-toggle bagu-toggle-left";
    leftToggle.type = "button";
    leftToggle.addEventListener("click", () => {
      state.leftCollapsed = !state.leftCollapsed;
      localStorage.setItem(STORAGE.leftCollapsed, state.leftCollapsed ? "1" : "0");
      applyLayoutState(root);
    });
    primary.appendChild(leftToggle);

    const rightToggle = document.createElement("button");
    rightToggle.className = "bagu-sidebar-toggle bagu-toggle-right";
    rightToggle.type = "button";
    rightToggle.addEventListener("click", () => {
      state.rightCollapsed = !state.rightCollapsed;
      localStorage.setItem(STORAGE.rightCollapsed, state.rightCollapsed ? "1" : "0");
      applyLayoutState(root);
    });
    secondary.appendChild(rightToggle);

    state.leftToggle = leftToggle;
    state.rightToggle = rightToggle;
    root.__baguState = state;
    inner.dataset.baguLayoutReady = "1";
    applyLayoutState(root);
  }

  function expandTocAncestors(item) {
    let current = item;
    const collapsedState = loadJSON(STORAGE.tocCollapsed, {});
    const pageKey = getPageKey();
    collapsedState[pageKey] = collapsedState[pageKey] || {};

    while (current) {
      const parent = current.parentElement?.closest(".bagu-toc-item");
      if (!parent) break;
      parent.classList.remove("bagu-collapsed");
      const key = parent.dataset.tocId;
      if (key) collapsedState[pageKey][key] = false;
      current = parent;
    }
    saveJSON(STORAGE.tocCollapsed, collapsedState);
  }

  function getHeadingText(heading) {
    const clone = heading.cloneNode(true);
    clone.querySelectorAll(".headerlink").forEach((node) => node.remove());
    return clone.textContent.trim();
  }

  function collectFallbackHeadings(root) {
    const content = root.querySelector(".md-content__inner");
    if (!content) return [];

    return [...content.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")]
      .map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        id: heading.id,
        text: getHeadingText(heading),
        isFirstTitle: heading.matches(".md-content__inner > h1:first-of-type")
      }))
      .filter((item) => item.id && item.text && !item.isFirstTitle && item.text !== "目录");
  }

  function buildHeadingTree(headings) {
    const root = { level: 0, children: [] };
    const stack = [root];

    headings.forEach((heading) => {
      const node = { ...heading, children: [] };
      while (stack.length > 1 && heading.level <= stack[stack.length - 1].level) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    });

    return root.children;
  }

  function renderHeadingTree(nodes) {
    const list = document.createElement("ul");
    list.className = "md-nav__list";

    nodes.forEach((node) => {
      const item = document.createElement("li");
      item.className = "md-nav__item";

      const link = document.createElement("a");
      link.className = "md-nav__link";
      link.href = `#${node.id}`;
      link.textContent = node.text;
      item.appendChild(link);

      if (node.children.length) {
        const nav = document.createElement("nav");
        nav.className = "md-nav";
        nav.appendChild(renderHeadingTree(node.children));
        item.appendChild(nav);
      }

      list.appendChild(item);
    });

    return list;
  }

  function ensureFallbackToc(root) {
    const secondary = root.querySelector(".md-sidebar--secondary");
    if (!secondary) return;

    const nav = secondary.querySelector(".md-nav--secondary");
    if (!nav || nav.querySelector(".md-nav__link")) return;

    const headings = collectFallbackHeadings(root);
    if (!headings.length) return;

    const title = document.createElement("label");
    title.className = "md-nav__title";
    title.textContent = "目录";

    nav.replaceChildren(title, renderHeadingTree(buildHeadingTree(headings)));
  }

  function buildTocTree(root) {
    const secondary = root.querySelector(".md-sidebar--secondary");
    if (!secondary) return;
    const nav = secondary.querySelector(".md-nav--secondary");
    if (!nav || nav.dataset.baguTocReady === "1") return;

    const collapsedState = loadJSON(STORAGE.tocCollapsed, {});
    const pageKey = getPageKey();
    collapsedState[pageKey] = collapsedState[pageKey] || {};

    nav.querySelectorAll(".md-nav__item").forEach((item, index) => {
      const childNav = item.querySelector(":scope > nav.md-nav");
      const link = item.querySelector(":scope > .md-nav__link");
      if (!link) return;
      item.classList.add("bagu-toc-item");
      const tocId = link.getAttribute("href") || `toc-${index}`;
      item.dataset.tocId = tocId;

      const row = document.createElement("div");
      row.className = "bagu-toc-row";

      if (childNav) {
        const toggle = document.createElement("button");
        toggle.className = "bagu-toc-toggle";
        toggle.type = "button";
        toggle.innerHTML = collapsedState[pageKey][tocId] ? "&#9656;" : "&#9662;";
        toggle.setAttribute("aria-label", collapsedState[pageKey][tocId] ? "Expand section" : "Collapse section");
        toggle.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const next = !item.classList.contains("bagu-collapsed");
          item.classList.toggle("bagu-collapsed", next);
          collapsedState[pageKey][tocId] = next;
          toggle.innerHTML = next ? "&#9656;" : "&#9662;";
          toggle.setAttribute("aria-label", next ? "Expand section" : "Collapse section");
          saveJSON(STORAGE.tocCollapsed, collapsedState);
        });
        row.appendChild(toggle);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "bagu-toc-spacer";
        spacer.innerHTML = "&nbsp;";
        row.appendChild(spacer);
      }

      link.parentNode.insertBefore(row, link);
      row.appendChild(link);

      if (childNav && collapsedState[pageKey][tocId]) {
        item.classList.add("bagu-collapsed");
      }

      if (link.classList.contains("md-nav__link--active")) {
        expandTocAncestors(item);
      }
    });

    nav.dataset.baguTocReady = "1";
  }

  function syncActiveToc(root) {
    const activeLink = root.querySelector(".md-sidebar--secondary .md-nav--secondary .md-nav__link--active");
    const activeItem = activeLink?.closest(".bagu-toc-item");
    if (activeItem) {
      expandTocAncestors(activeItem);
    }
  }

  function init() {
    const root = document;
    document.body.classList.toggle("bagu-home-hero", !!root.querySelector(".hero-shell"));
    ensureLayoutControls(root);
    ensureFallbackToc(root);
    buildTocTree(root);
    syncActiveToc(root);
  }

  document.addEventListener("DOMContentLoaded", init);

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(() => {
      window.setTimeout(init, 0);
    });
  }

  window.addEventListener("resize", () => {
    ensureLayoutControls(document);
    if (!document.__baguState) return;
    const state = document.__baguState;
    state.leftWidth = clamp(state.leftWidth, getBounds("left").min, getBounds("left").max);
    state.rightWidth = clamp(state.rightWidth, getBounds("right").min, getBounds("right").max);
    applyLayoutState(document);
  });
})();
