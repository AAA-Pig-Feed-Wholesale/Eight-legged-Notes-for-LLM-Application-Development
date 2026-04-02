from __future__ import annotations

import argparse
import html
import json
import sys
import urllib.parse
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import markdown as markdown_lib


ROOT_DIR = Path(__file__).resolve().parent
CONTENT_DIR = ROOT_DIR / "content"
POLL_INTERVAL_MS = 2000


HTML_PAGE = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>八股文档站</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f1ea;
      --panel: rgba(255, 252, 246, 0.94);
      --panel-strong: #fffaf2;
      --text: #1f2937;
      --muted: #6b7280;
      --line: rgba(148, 163, 184, 0.32);
      --accent: #a24a2d;
      --accent-soft: rgba(162, 74, 45, 0.12);
      --shadow: 0 18px 50px rgba(68, 39, 24, 0.10);
      --left-width: 300px;
      --left-collapsed-width: 74px;
      --right-width: 280px;
      --right-collapsed-width: 74px;
      --handle-width: 12px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(197, 133, 92, 0.18), transparent 28%),
        radial-gradient(circle at right 10% top 12%, rgba(169, 111, 77, 0.12), transparent 22%),
        linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
    }

    .shell {
      display: grid;
      grid-template-columns: var(--left-width) var(--handle-width) minmax(0, 1fr) var(--handle-width) var(--right-width);
      min-height: 100vh;
    }

    .sidebar {
      background: rgba(252, 248, 240, 0.86);
      backdrop-filter: blur(14px);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: width 0.18s ease, padding 0.18s ease, border-color 0.18s ease;
    }

    .sidebar-left {
      border-right: 1px solid var(--line);
      padding: 20px 18px 18px;
    }

    .sidebar-right {
      border-left: 1px solid var(--line);
      padding: 20px 16px 18px;
    }

    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .sidebar-left .sidebar-top {
      padding: 6px 10px 0;
    }

    .sidebar-right .sidebar-top {
      padding: 6px 4px 0;
    }

    .sidebar-label {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 700;
    }

    .collapse-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.72);
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      transition: 0.16s ease;
    }

    .collapse-btn:hover {
      border-color: rgba(162, 74, 45, 0.40);
      background: var(--accent-soft);
    }

    .brand {
      padding: 6px 10px 10px;
    }

    .eyebrow {
      margin: 0 0 6px;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.15;
    }

    .desc {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .search {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 14px;
      background: rgba(255, 255, 255, 0.72);
      outline: none;
    }

    .search:focus {
      border-color: rgba(162, 74, 45, 0.45);
      box-shadow: 0 0 0 4px rgba(162, 74, 45, 0.08);
    }

    .file-list {
      list-style: none;
      padding: 0;
      margin: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-btn {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 14px;
      background: transparent;
      text-align: left;
      padding: 12px 12px;
      color: inherit;
      cursor: pointer;
      transition: 0.16s ease;
    }

    .file-btn:hover {
      border-color: var(--line);
      background: rgba(255, 255, 255, 0.52);
    }

    .file-btn.active {
      background: var(--accent-soft);
      border-color: rgba(162, 74, 45, 0.18);
      box-shadow: inset 0 0 0 1px rgba(162, 74, 45, 0.12);
    }

    .file-name {
      font-size: 15px;
      font-weight: 600;
      word-break: break-all;
    }

    .file-meta {
      margin-top: 4px;
      font-size: 12px;
      color: var(--muted);
    }

    .sidebar-footer {
      margin-top: auto;
      border-top: 1px solid var(--line);
      padding: 12px 10px 0;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.6;
    }

    .main {
      min-width: 0;
      padding: 28px 20px;
    }

    .resize-handle {
      position: sticky;
      top: 0;
      height: 100vh;
      cursor: col-resize;
      background:
        linear-gradient(
          90deg,
          transparent 0,
          transparent calc(50% - 1px),
          rgba(148, 163, 184, 0.45) calc(50% - 1px),
          rgba(148, 163, 184, 0.45) calc(50% + 1px),
          transparent calc(50% + 1px),
          transparent 100%
        );
      transition: background-color 0.16s ease;
    }

    .resize-handle:hover {
      background-color: rgba(162, 74, 45, 0.08);
    }

    .resize-handle::after {
      content: "";
      position: absolute;
      inset: 0;
    }

    .panel {
      max-width: 980px;
      margin: 0 auto;
      background: var(--panel);
      border: 1px solid rgba(255, 255, 255, 0.62);
      border-radius: 28px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .panel-top {
      padding: 22px 28px 18px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255, 250, 242, 0.96), rgba(255, 255, 255, 0.75));
    }

    .doc-title {
      margin: 0;
      font-size: 30px;
      line-height: 1.2;
    }

    .doc-subtitle {
      margin-top: 8px;
      font-size: 13px;
      color: var(--muted);
    }

    .content-wrap {
      padding: 12px 28px 40px;
    }

    .toc-title {
      margin: 0;
      font-size: 14px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .toc-shell {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 0 4px 4px;
    }

    .toc-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow: auto;
      padding-right: 2px;
    }

    .toc-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toc-row {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .toc-toggle,
    .toc-spacer {
      width: 22px;
      min-width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: var(--muted);
      font-size: 11px;
    }

    .toc-toggle {
      border: 0;
      background: transparent;
      cursor: pointer;
      transition: 0.16s ease;
    }

    .toc-toggle:hover {
      background: rgba(148, 163, 184, 0.12);
      color: var(--text);
    }

    .toc-link,
    .toc-empty {
      width: 100%;
      border: 0;
      background: transparent;
      text-align: left;
      color: inherit;
      padding: 8px 10px;
      border-radius: 10px;
      line-height: 1.45;
      font-size: 13px;
    }

    .toc-link {
      flex: 1;
      min-width: 0;
      cursor: pointer;
      transition: 0.16s ease;
    }

    .toc-link:hover {
      background: var(--accent-soft);
    }

    .toc-link.level-2 {
      font-weight: 600;
    }

    .toc-link.level-3 {
      color: #475569;
    }

    .toc-link.level-4,
    .toc-link.level-5,
    .toc-link.level-6 {
      color: #64748b;
    }

    .toc-link.active {
      background: var(--accent-soft);
      color: var(--accent);
      font-weight: 600;
    }

    .toc-children {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: 14px;
      padding-left: 10px;
      border-left: 1px solid rgba(148, 163, 184, 0.24);
    }

    .toc-item.collapsed > .toc-children {
      display: none;
    }

    .toc-empty {
      color: var(--muted);
      padding-left: 0;
      padding-right: 0;
    }

    body.left-collapsed .shell {
      grid-template-columns: var(--left-collapsed-width) var(--handle-width) minmax(0, 1fr) var(--handle-width) var(--right-width);
    }

    body.right-collapsed .shell {
      grid-template-columns: var(--left-width) var(--handle-width) minmax(0, 1fr) var(--handle-width) var(--right-collapsed-width);
    }

    body.left-collapsed.right-collapsed .shell {
      grid-template-columns: var(--left-collapsed-width) var(--handle-width) minmax(0, 1fr) var(--handle-width) var(--right-collapsed-width);
    }

    body.left-collapsed .sidebar-left,
    body.right-collapsed .sidebar-right {
      padding-left: 10px;
      padding-right: 10px;
    }

    body.left-collapsed .sidebar-left .brand,
    body.left-collapsed .sidebar-left .search,
    body.left-collapsed .sidebar-left .file-list,
    body.left-collapsed .sidebar-left .sidebar-footer,
    body.left-collapsed .sidebar-left .sidebar-label,
    body.right-collapsed .sidebar-right .toc-shell,
    body.right-collapsed .sidebar-right .sidebar-label {
      display: none;
    }

    body.left-collapsed .sidebar-left .sidebar-top,
    body.right-collapsed .sidebar-right .sidebar-top {
      justify-content: center;
      padding-left: 0;
      padding-right: 0;
    }

    body.left-collapsed .sidebar-left .collapse-btn,
    body.right-collapsed .sidebar-right .collapse-btn {
      width: 42px;
      height: 42px;
      border-radius: 14px;
    }

    body.left-collapsed .resize-handle-left,
    body.right-collapsed .resize-handle-right {
      opacity: 0.35;
    }

    .empty,
    .loading,
    .error {
      padding: 56px 28px;
      text-align: center;
      color: var(--muted);
      font-size: 15px;
    }

    #content {
      line-height: 1.85;
      font-size: 16px;
    }

    #content h1,
    #content h2,
    #content h3,
    #content h4 {
      line-height: 1.35;
      margin-top: 1.8em;
      margin-bottom: 0.7em;
      scroll-margin-top: 28px;
    }

    #content h1:first-child,
    #content h2:first-child {
      margin-top: 0.2em;
    }

    #content p,
    #content ul,
    #content ol,
    #content blockquote,
    #content pre,
    #content table {
      margin: 0 0 1.1em;
    }

    #content ul,
    #content ol {
      padding-left: 1.5em;
    }

    #content blockquote {
      border-left: 4px solid rgba(162, 74, 45, 0.28);
      margin-left: 0;
      padding: 0.2em 1em;
      color: #4b5563;
      background: rgba(162, 74, 45, 0.05);
      border-radius: 0 12px 12px 0;
    }

    #content code {
      font-family: Consolas, "SFMono-Regular", monospace;
      background: rgba(148, 163, 184, 0.14);
      padding: 0.12em 0.35em;
      border-radius: 6px;
      font-size: 0.95em;
    }

    #content pre {
      padding: 16px 18px;
      overflow: auto;
      border-radius: 16px;
      background: #1f2937;
      color: #f9fafb;
    }

    #content pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    #content table {
      width: 100%;
      border-collapse: collapse;
      display: block;
      overflow-x: auto;
    }

    #content th,
    #content td {
      border: 1px solid var(--line);
      padding: 10px 12px;
      text-align: left;
      white-space: nowrap;
    }

    #content th {
      background: rgba(148, 163, 184, 0.08);
    }

    #content a {
      color: var(--accent);
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.10);
    }

    @media (max-width: 960px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        height: auto;
        border-left: 0;
        border-right: 0;
        border-bottom: 1px solid var(--line);
        padding-left: 16px;
        padding-right: 16px;
      }

      .main {
        padding: 16px;
      }

      .panel-top,
      .content-wrap {
        padding-left: 18px;
        padding-right: 18px;
      }

      body.left-collapsed .shell,
      body.right-collapsed .shell,
      body.left-collapsed.right-collapsed .shell {
        grid-template-columns: 1fr;
      }

      .resize-handle {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar sidebar-left">
      <div class="sidebar-top">
        <p class="sidebar-label">Files</p>
        <button id="toggleLeftBtn" class="collapse-btn" type="button" aria-label="Collapse file sidebar">&#9664;</button>
      </div>
      <div class="brand">
        <p class="eyebrow">Markdown Live Docs</p>
        <h1>八股文档站</h1>
        <p class="desc">自动读取当前目录下的 Markdown 文件。你保存文档后，页面会自动检查并刷新内容。</p>
      </div>
      <input id="searchInput" class="search" type="search" placeholder="搜索文件名">
      <ul id="fileList" class="file-list"></ul>
      <div class="sidebar-footer">
        <div class="status">自动刷新已开启</div>
        <div>轮询间隔：%POLL_INTERVAL_MS% ms</div>
      </div>
    </aside>
    <div id="leftResizeHandle" class="resize-handle resize-handle-left" role="separator" aria-label="Resize file sidebar"></div>
    <main class="main">
      <section class="panel">
        <div class="panel-top">
          <h2 id="docTitle" class="doc-title">加载中</h2>
          <div id="docMeta" class="doc-subtitle">正在读取文件列表…</div>
        </div>
        <div class="content-wrap">
          <div id="contentState" class="loading">正在加载内容…</div>
          <article id="content" hidden></article>
        </div>
      </section>
    </main>
    <div id="rightResizeHandle" class="resize-handle resize-handle-right" role="separator" aria-label="Resize outline sidebar"></div>
    <aside class="sidebar sidebar-right">
      <div class="sidebar-top">
        <p class="sidebar-label">Outline</p>
        <button id="toggleRightBtn" class="collapse-btn" type="button" aria-label="Collapse outline sidebar">&#9654;</button>
      </div>
      <div class="toc-shell">
        <h3 class="toc-title">二级目录</h3>
        <div id="tocList" class="toc-list">
          <div class="toc-empty">当前文档还没有可用目录</div>
        </div>
      </div>
    </aside>
  </div>

  <script>
    const POLL_INTERVAL_MS = %POLL_INTERVAL_MS%;
    const state = {
      files: [],
      currentFile: null,
      currentMtime: null,
      filter: "",
      tocObserver: null,
      tocCollapsedByFile: {},
      leftWidth: 300,
      rightWidth: 280,
      leftCollapsed: false,
      rightCollapsed: false
    };

    const storageKeys = {
      leftCollapsed: "bagu_left_collapsed",
      rightCollapsed: "bagu_right_collapsed",
      leftWidth: "bagu_left_width",
      rightWidth: "bagu_right_width"
    };

    const fileListEl = document.getElementById("fileList");
    const searchInputEl = document.getElementById("searchInput");
    const docTitleEl = document.getElementById("docTitle");
    const docMetaEl = document.getElementById("docMeta");
    const contentStateEl = document.getElementById("contentState");
    const contentEl = document.getElementById("content");
    const tocListEl = document.getElementById("tocList");
    const toggleLeftBtnEl = document.getElementById("toggleLeftBtn");
    const toggleRightBtnEl = document.getElementById("toggleRightBtn");
    const leftResizeHandleEl = document.getElementById("leftResizeHandle");
    const rightResizeHandleEl = document.getElementById("rightResizeHandle");

    function escapeHtml(text) {
      return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function formatTime(timestamp) {
      return new Date(timestamp * 1000).toLocaleString("zh-CN", { hour12: false });
    }

    function formatSize(size) {
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    }

    function getHashFileName() {
      const raw = window.location.hash.slice(1);
      return raw ? decodeURIComponent(raw) : null;
    }

    function setHashFileName(fileName) {
      const nextHash = `#${encodeURIComponent(fileName)}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, "", nextHash);
      }
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function getWidthBounds(side) {
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

    function applyPanelWidths() {
      document.documentElement.style.setProperty("--left-width", `${state.leftWidth}px`);
      document.documentElement.style.setProperty("--right-width", `${state.rightWidth}px`);
    }

    function applySidebarState() {
      document.body.classList.toggle("left-collapsed", state.leftCollapsed);
      document.body.classList.toggle("right-collapsed", state.rightCollapsed);

      toggleLeftBtnEl.innerHTML = state.leftCollapsed ? "&#9654;" : "&#9664;";
      toggleRightBtnEl.innerHTML = state.rightCollapsed ? "&#9664;" : "&#9654;";

      toggleLeftBtnEl.setAttribute(
        "aria-label",
        state.leftCollapsed ? "Expand file sidebar" : "Collapse file sidebar"
      );
      toggleRightBtnEl.setAttribute(
        "aria-label",
        state.rightCollapsed ? "Expand outline sidebar" : "Collapse outline sidebar"
      );
    }

    function loadSidebarState() {
      const savedLeftWidth = Number(localStorage.getItem(storageKeys.leftWidth));
      const savedRightWidth = Number(localStorage.getItem(storageKeys.rightWidth));
      const leftBounds = getWidthBounds("left");
      const rightBounds = getWidthBounds("right");

      if (Number.isFinite(savedLeftWidth) && savedLeftWidth > 0) {
        state.leftWidth = clamp(savedLeftWidth, leftBounds.min, leftBounds.max);
      }

      if (Number.isFinite(savedRightWidth) && savedRightWidth > 0) {
        state.rightWidth = clamp(savedRightWidth, rightBounds.min, rightBounds.max);
      }

      state.leftCollapsed = localStorage.getItem(storageKeys.leftCollapsed) === "1";
      state.rightCollapsed = localStorage.getItem(storageKeys.rightCollapsed) === "1";
      applyPanelWidths();
      applySidebarState();
    }

    function toggleLeftSidebar() {
      state.leftCollapsed = !state.leftCollapsed;
      localStorage.setItem(storageKeys.leftCollapsed, state.leftCollapsed ? "1" : "0");
      applySidebarState();
    }

    function toggleRightSidebar() {
      state.rightCollapsed = !state.rightCollapsed;
      localStorage.setItem(storageKeys.rightCollapsed, state.rightCollapsed ? "1" : "0");
      applySidebarState();
    }

    function beginResize(side, event) {
      if (window.innerWidth <= 960) {
        return;
      }

      if ((side === "left" && state.leftCollapsed) || (side === "right" && state.rightCollapsed)) {
        return;
      }

      const startX = event.clientX;
      const startWidth = side === "left" ? state.leftWidth : state.rightWidth;
      const bounds = getWidthBounds(side);

      function onMove(moveEvent) {
        const delta = moveEvent.clientX - startX;
        if (side === "left") {
          state.leftWidth = clamp(startWidth + delta, bounds.min, bounds.max);
          localStorage.setItem(storageKeys.leftWidth, String(state.leftWidth));
        } else {
          state.rightWidth = clamp(startWidth - delta, bounds.min, bounds.max);
          localStorage.setItem(storageKeys.rightWidth, String(state.rightWidth));
        }
        applyPanelWidths();
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

    function renderFileList() {
      const keyword = state.filter.trim().toLowerCase();
      const files = state.files.filter((file) => file.name.toLowerCase().includes(keyword));
      fileListEl.innerHTML = "";

      if (!files.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = keyword ? "没有匹配的文件" : "当前目录没有 Markdown 文件";
        fileListEl.appendChild(li);
        return;
      }

      for (const file of files) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `file-btn${file.name === state.currentFile ? " active" : ""}`;
        btn.innerHTML = `
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-meta">${formatSize(file.size)} · ${formatTime(file.mtime)}</div>
        `;
        btn.addEventListener("click", () => loadFile(file.name, true));
        li.appendChild(btn);
        fileListEl.appendChild(li);
      }
    }

    function setStateMessage(kind, title, meta, message) {
      docTitleEl.textContent = title;
      docMetaEl.textContent = meta;
      contentEl.hidden = true;
      contentEl.innerHTML = "";
      tocListEl.innerHTML = '<div class="toc-empty">当前文档还没有可用目录</div>';
      if (state.tocObserver) {
        state.tocObserver.disconnect();
        state.tocObserver = null;
      }
      contentStateEl.hidden = false;
      contentStateEl.className = kind;
      contentStateEl.textContent = message;
    }

    function getCollapsedMap() {
      if (!state.currentFile) {
        return {};
      }

      if (!state.tocCollapsedByFile[state.currentFile]) {
        state.tocCollapsedByFile[state.currentFile] = {};
      }

      return state.tocCollapsedByFile[state.currentFile];
    }

    function buildTocTree(headings) {
      const roots = [];
      const stack = [];

      for (const heading of headings) {
        const node = {
          id: heading.id,
          title: heading.textContent.trim(),
          level: Number(heading.tagName.slice(1)),
          children: []
        };

        while (stack.length && stack[stack.length - 1].level >= node.level) {
          stack.pop();
        }

        if (stack.length) {
          stack[stack.length - 1].children.push(node);
        } else {
          roots.push(node);
        }

        stack.push(node);
      }

      return roots;
    }

    function toggleTocBranch(nodeId) {
      const collapsedMap = getCollapsedMap();
      collapsedMap[nodeId] = !collapsedMap[nodeId];
      const activeLink = tocListEl.querySelector(".toc-link.active");
      const activeId = activeLink ? activeLink.dataset.targetId : null;
      renderToc();
      if (activeId) {
        updateActiveToc(activeId);
      }
    }

    function renderTocNode(node, container, collapsedMap) {
      const item = document.createElement("div");
      item.className = `toc-item level-${node.level}`;
      item.dataset.nodeId = node.id;

      const row = document.createElement("div");
      row.className = "toc-row";

      if (node.children.length) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "toc-toggle";
        toggleBtn.innerHTML = collapsedMap[node.id] ? "&#9656;" : "&#9662;";
        toggleBtn.setAttribute("aria-label", collapsedMap[node.id] ? "Expand section" : "Collapse section");
        toggleBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          toggleTocBranch(node.id);
        });
        row.appendChild(toggleBtn);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "toc-spacer";
        spacer.innerHTML = "&nbsp;";
        row.appendChild(spacer);
      }

      const link = document.createElement("button");
      link.type = "button";
      link.className = `toc-link level-${node.level}`;
      link.textContent = node.title;
      link.dataset.targetId = node.id;
      link.addEventListener("click", () => {
        const heading = contentEl.querySelector(`#${CSS.escape(node.id)}`);
        if (heading) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          updateActiveToc(node.id);
        }
      });
      row.appendChild(link);

      item.appendChild(row);

      if (node.children.length) {
        const children = document.createElement("div");
        children.className = "toc-children";
        for (const child of node.children) {
          renderTocNode(child, children, collapsedMap);
        }
        item.appendChild(children);
      }

      if (collapsedMap[node.id]) {
        item.classList.add("collapsed");
      }

      container.appendChild(item);
    }

    function renderToc() {
      const headings = Array.from(contentEl.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]"));
      tocListEl.innerHTML = "";

      if (!headings.length) {
        tocListEl.innerHTML = '<div class="toc-empty">当前文档没有二级目录</div>';
        return;
      }

      const collapsedMap = getCollapsedMap();
      const tree = buildTocTree(headings);

      for (const node of tree) {
        renderTocNode(node, tocListEl, collapsedMap);
      }

      const firstHeading = headings[0];
      if (firstHeading) {
        updateActiveToc(firstHeading.id);
      }
    }

    function expandTocAncestors(targetId) {
      const collapsedMap = getCollapsedMap();
      let current = null;

      for (const link of tocListEl.querySelectorAll(".toc-link")) {
        if (link.dataset.targetId === targetId) {
          current = link.closest(".toc-item");
          break;
        }
      }

      while (current) {
        const nodeId = current.dataset.nodeId;
        if (collapsedMap[nodeId]) {
          collapsedMap[nodeId] = false;
          current.classList.remove("collapsed");
          const toggle = current.querySelector(":scope > .toc-row .toc-toggle");
          if (toggle) {
            toggle.innerHTML = "&#9662;";
            toggle.setAttribute("aria-label", "Collapse section");
          }
        }

        const parentChildren = current.parentElement;
        current = parentChildren ? parentChildren.closest(".toc-item") : null;
      }
    }

    function updateActiveToc(activeId) {
      expandTocAncestors(activeId);
      const links = tocListEl.querySelectorAll(".toc-link");
      for (const link of links) {
        link.classList.toggle("active", link.dataset.targetId === activeId);
      }
    }

    function bindHeadingObserver() {
      if (state.tocObserver) {
        state.tocObserver.disconnect();
        state.tocObserver = null;
      }

      const headings = Array.from(contentEl.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]"));
      if (!headings.length) {
        return;
      }

      state.tocObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length) {
            updateActiveToc(visible[0].target.id);
          }
        },
        {
          rootMargin: "-18% 0px -72% 0px",
          threshold: [0, 1],
        }
      );

      for (const heading of headings) {
        state.tocObserver.observe(heading);
      }
    }

    async function fetchJson(url) {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }
      return response.json();
    }

    async function refreshFiles(initial = false) {
      const payload = await fetchJson("/api/files");
      const previousCurrent = state.currentFile;
      state.files = payload.files;

      const hashFile = getHashFileName();
      if (initial) {
        state.currentFile = hashFile && state.files.some((file) => file.name === hashFile)
          ? hashFile
          : state.files[0]?.name ?? null;
      } else if (previousCurrent && !state.files.some((file) => file.name === previousCurrent)) {
        state.currentFile = state.files[0]?.name ?? null;
      }

      renderFileList();

      if (!state.currentFile) {
        setStateMessage("empty", "暂无文档", "当前目录未检测到 Markdown 文件", "请把 .md 文件放到该目录后刷新。");
        return;
      }

      if (initial) {
        await loadFile(state.currentFile, false);
        return;
      }

      const latest = state.files.find((file) => file.name === state.currentFile);
      if (!latest) {
        await loadFile(state.currentFile, false);
        return;
      }

      if (state.currentMtime !== latest.mtime) {
        await loadFile(state.currentFile, false);
      }
    }

    async function loadFile(fileName, pushHash) {
      state.currentFile = fileName;
      renderFileList();
      if (pushHash) {
        setHashFileName(fileName);
      }

      setStateMessage("loading", fileName, "正在读取文档…", "正在加载内容…");

      try {
        const payload = await fetchJson(`/api/file?name=${encodeURIComponent(fileName)}`);
        state.currentMtime = payload.mtime;
        docTitleEl.textContent = payload.name;
        docMetaEl.textContent = `最后更新：${formatTime(payload.mtime)} · ${formatSize(payload.size)}`;
        contentEl.innerHTML = payload.html;
        contentStateEl.hidden = true;
        contentEl.hidden = false;
        renderToc();
        bindHeadingObserver();
        renderFileList();
      } catch (error) {
        setStateMessage("error", fileName, "读取失败", error.message || "无法加载文档");
      }
    }

    searchInputEl.addEventListener("input", (event) => {
      state.filter = event.target.value;
      renderFileList();
    });

    toggleLeftBtnEl.addEventListener("click", toggleLeftSidebar);
    toggleRightBtnEl.addEventListener("click", toggleRightSidebar);
    leftResizeHandleEl.addEventListener("pointerdown", (event) => beginResize("left", event));
    rightResizeHandleEl.addEventListener("pointerdown", (event) => beginResize("right", event));

    window.addEventListener("resize", () => {
      const leftBounds = getWidthBounds("left");
      const rightBounds = getWidthBounds("right");
      state.leftWidth = clamp(state.leftWidth, leftBounds.min, leftBounds.max);
      state.rightWidth = clamp(state.rightWidth, rightBounds.min, rightBounds.max);
      applyPanelWidths();
    });

    window.addEventListener("hashchange", async () => {
      const fileName = getHashFileName();
      if (fileName && fileName !== state.currentFile) {
        await loadFile(fileName, false);
      }
    });

    async function boot() {
      loadSidebarState();

      try {
        await refreshFiles(true);
        window.setInterval(() => {
          refreshFiles(false).catch((error) => {
            docMetaEl.textContent = `自动刷新失败：${error.message || error}`;
          });
        }, POLL_INTERVAL_MS);
      } catch (error) {
        setStateMessage("error", "加载失败", "无法读取文件列表", error.message || "请检查本地服务是否正常启动。");
      }
    }

    boot();
  </script>
</body>
</html>
"""


def list_markdown_files() -> list[dict[str, object]]:
    files = []
    for path in CONTENT_DIR.glob("*.md"):
        stat = path.stat()
        files.append(
            {
                "name": path.name,
                "mtime": stat.st_mtime,
                "size": stat.st_size,
            }
        )
    files.sort(key=lambda item: str(item["name"]).lower())
    return files


def resolve_markdown_file(name: str) -> Path:
    candidate = (CONTENT_DIR / name).resolve()
    if candidate.parent != CONTENT_DIR or candidate.suffix.lower() != ".md" or not candidate.is_file():
        raise FileNotFoundError(name)
    return candidate


def render_markdown(content: str) -> str:
    try:
        return markdown_lib.markdown(
            content,
            extensions=[
                "extra",
                "sane_lists",
                "toc",
                "nl2br",
            ],
        )
    except Exception:
        escaped = html.escape(content)
        return f"<pre><code>{escaped}</code></pre>"


class DocsHandler(BaseHTTPRequestHandler):
    server_version = "DocsSite/1.0"

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        route = parsed.path

        if route == "/":
            self._send_html()
            return

        if route == "/api/files":
            self._send_json({"files": list_markdown_files()})
            return

        if route == "/api/file":
            self._send_file(parsed.query)
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def log_message(self, format: str, *args: object) -> None:
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

    def _send_html(self) -> None:
        page = HTML_PAGE.replace("%POLL_INTERVAL_MS%", str(POLL_INTERVAL_MS))
        content = page.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        content = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_file(self, query_string: str) -> None:
        query = urllib.parse.parse_qs(query_string)
        name = query.get("name", [""])[0]

        try:
            path = resolve_markdown_file(name)
        except FileNotFoundError:
            self._send_json({"error": "file not found"}, HTTPStatus.NOT_FOUND)
            return

        stat = path.stat()
        content = path.read_text(encoding="utf-8")
        self._send_json(
            {
                "name": path.name,
                "content": content,
                "html": render_markdown(content),
                "mtime": stat.st_mtime,
                "size": stat.st_size,
            }
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve local Markdown files as a live HTML site.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to. Default: 127.0.0.1")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to. Default: 8000")
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open the browser automatically after startup.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), DocsHandler)
    url = f"http://{args.host}:{args.port}"

    print(f"Serving Markdown docs from: {CONTENT_DIR}")
    print(f"Open: {url}")
    print("Auto-refresh checks for file updates every 2 seconds.")

    if not args.no_browser:
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
