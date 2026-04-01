# 八股文档站

这个仓库用于整理大模型应用开发相关的面试八股和学习笔记，内容涵盖：

- LLM 基础
- Prompt 工程
- RAG
- 大模型微调
- Agent
- 后端与 Python

仓库已经配置为可直接发布到 `GitHub Pages` 的静态文档站。

## 主要内容

- [大模型应用开发八股总纲](./大模型应用开发八股总纲.md)
- [llm_app_dev_notes_2020_2026_detailed](./llm_app_dev_notes_2020_2026_detailed.md)
- [LLM八股](./LLM八股.md)
- [prompt工程八股](./prompt工程八股.md)
- [RAG八股](./RAG八股.md)
- [大模型微调八股](./大模型微调八股.md)
- [Agent八股](./Agent八股.md)
- [前沿Agent生态八股](./前沿Agent生态八股.md)
- [python八股](./python八股.md)
- [后端八股](./后端八股.md)

## 本地预览

先安装依赖：

```bash
pip install -r requirements.txt
```

启动本地文档站：

```bash
mkdocs serve
```

默认访问地址：

```text
http://127.0.0.1:8000
```

## GitHub Pages 发布

仓库内已经包含 GitHub Actions 工作流，推送到 `main` 分支后即可自动构建和部署。

使用前请先修改 [mkdocs.yml](./mkdocs.yml) 里的仓库配置：

- `site_url`
- `repo_url`
- `repo_name`

然后到 GitHub 仓库中执行：

1. 打开 `Settings -> Pages`
2. 在 `Build and deployment` 中选择 `GitHub Actions`
3. 推送代码到 `main` 分支

部署完成后，站点地址通常为：

```text
https://<你的用户名>.github.io/<你的仓库名>/
```

## 说明

- 当前仓库采用 `MkDocs + Material for MkDocs`
- 文档内容以 Markdown 形式维护
- 修改 Markdown 后需要重新推送，GitHub Pages 才会更新线上内容
