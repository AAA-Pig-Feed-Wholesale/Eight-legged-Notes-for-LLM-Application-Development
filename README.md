# 八股文档站

这个仓库用于整理大模型应用开发相关的面试八股和学习笔记，当前已经同时支持：

- 本地动态预览站
- MkDocs 静态文档站
- GitHub Pages 自动部署

## 目录结构

```text
.
├─ content/                  # 源 Markdown，平时只改这里
├─ docs/                     # MkDocs 使用目录
│  ├─ javascripts/
│  └─ stylesheets/
├─ site/                     # MkDocs 构建产物
├─ .github/workflows/        # GitHub Actions
├─ docs_site.py              # 本地动态预览服务
├─ mkdocs.yml                # MkDocs 配置
└─ sync_docs.py              # content -> docs 同步脚本
```

## Markdown 是否可复用

可以。现在的 `md` 只保留一份源文件，在 `content/` 目录里：

- 本地动态站由 `docs_site.py` 直接读取 `content/`
- MkDocs 构建前由 `sync_docs.py` 把 `content/` 同步到 `docs/`
- GitHub Pages 也是基于同一份源文件构建

也就是说，后续你只需要维护 `content/` 里的 Markdown，不需要再管根目录和 `docs/` 的重复副本。

## 本地预览

安装依赖：

```bash
pip install -r requirements.txt
```

启动 MkDocs：

```bash
python sync_docs.py
python -m mkdocs serve
```

启动本地动态站：

```bash
python docs_site.py
```

默认访问地址：

```text
http://127.0.0.1:8000
```

## GitHub Pages

仓库已包含 GitHub Actions 工作流。推送到 `main` 后会自动构建并部署。

如果仓库满足 Pages 条件，部署地址通常是：

```text
https://AAA-Pig-Feed-Wholesale.github.io/Eight-legged-Notes-for-LLM-Application-Development/
```

## 说明

- 平时编辑：`content/*.md`
- 页面样式：`docs/stylesheets/extra.css`
- 页面交互：`docs/javascripts/extra.js`
- 构建前同步：`python sync_docs.py`
