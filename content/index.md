# 八股文档站

<div class="hero-shell">
  <div class="hero-copy">
    <p class="hero-kicker">Interview Notes / LLM Application Handbook</p>
    <h1>把零散八股整理成一套可检索、可发布、可长期维护的技术手册</h1>
    <p class="hero-lead">
      这里收录大模型应用开发、Prompt、RAG、微调、Agent、后端与 Python 相关笔记。
      页面不是传统博客布局，而是偏向“电子手册”风格，适合按主题查阅，也适合成体系回顾。
    </p>
    <div class="hero-actions">
      <a class="hero-btn primary" href="./大模型应用开发八股总纲.md">先看总纲</a>
      <a class="hero-btn" href="./llm_app_dev_notes_2020_2026_detailed.md">看详细笔记</a>
    </div>
  </div>
  <div class="hero-panel">
    <div class="stat-card">
      <span class="stat-label">内容范围</span>
      <strong>LLM / Prompt / RAG / 微调 / Agent / 后端</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">阅读方式</span>
      <strong>适合碎片化查阅，也适合系统化复习</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">维护方式</span>
      <strong>Markdown 原文维护，MkDocs 静态发布</strong>
    </div>
  </div>
</div>

## 内容地图

<div class="card-grid">
  <a class="note-card" href="./大模型应用开发八股总纲.md">
    <span class="note-tag">Overview</span>
    <h3>大模型应用开发八股总纲</h3>
    <p>先建立总框架，适合作为整套内容的总入口。</p>
  </a>
  <a class="note-card" href="./llm_app_dev_notes_2020_2026_detailed.md">
    <span class="note-tag">Deep Dive</span>
    <h3>详细笔记</h3>
    <p>更适合纵向梳理 2020 到 2026 之间的应用开发脉络。</p>
  </a>
  <a class="note-card" href="./LLM八股.md">
    <span class="note-tag">Core</span>
    <h3>LLM八股</h3>
    <p>模型基础、能力边界、常见面试问题与回答模板。</p>
  </a>
  <a class="note-card" href="./prompt工程八股.md">
    <span class="note-tag">Prompt</span>
    <h3>Prompt工程八股</h3>
    <p>提示词设计、模板组织、鲁棒性与常见坑点。</p>
  </a>
  <a class="note-card" href="./RAG八股.md">
    <span class="note-tag">Retrieval</span>
    <h3>RAG八股</h3>
    <p>检索增强生成的核心链路、评估、工程问题与面试表述。</p>
  </a>
  <a class="note-card" href="./大模型微调八股.md">
    <span class="note-tag">Tuning</span>
    <h3>大模型微调八股</h3>
    <p>SFT、LoRA、QLoRA、偏好对齐与训练评估。</p>
  </a>
  <a class="note-card" href="./Agent八股.md">
    <span class="note-tag">Agent</span>
    <h3>Agent八股</h3>
    <p>工具调用、规划执行、工作流拆解与真实落地方式。</p>
  </a>
  <a class="note-card" href="./前沿Agent生态八股.md">
    <span class="note-tag">Frontier</span>
    <h3>前沿Agent生态八股</h3>
    <p>更偏向生态视角，适合补充平台与产品层面的认知。</p>
  </a>
  <a class="note-card" href="./python八股.md">
    <span class="note-tag">Foundation</span>
    <h3>Python八股</h3>
    <p>语言基础与工程实现，适合作为应用开发底座补充。</p>
  </a>
  <a class="note-card" href="./后端八股.md">
    <span class="note-tag">Backend</span>
    <h3>后端八股</h3>
    <p>接口、服务治理、并发、缓存与常见系统设计问法。</p>
  </a>
</div>

## 本地预览

```bash
pip install -r requirements.txt
python sync_docs.py
mkdocs serve
```

默认访问地址：

```text
http://127.0.0.1:8000
```

## 发布说明

- 站点基于 `MkDocs + Material for MkDocs`
- 构建前会通过 `sync_docs.py` 将根目录 Markdown 同步到 `docs/`
- 若仓库为私有仓库，免费 GitHub 账户通常不能直接启用 Pages
- 推送到 `main` 后，GitHub Actions 会自动构建和部署
