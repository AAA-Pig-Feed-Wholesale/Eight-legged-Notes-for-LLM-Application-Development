# 八股文档站

这个仓库用于整理大模型应用开发、RAG、微调、Agent、后端与 Python 相关的面试八股和学习笔记。

## 内容导航

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

```bash
pip install -r requirements.txt
python sync_docs.py
mkdocs serve
```

默认访问地址：

```text
http://127.0.0.1:8000
```

## GitHub Pages 发布

1. 把整个目录上传到 GitHub 仓库。
2. 进入仓库的 `Settings -> Pages`。
3. 在 `Build and deployment` 里选择 `GitHub Actions`。
4. 推送代码后，等待 Actions 自动构建和发布。

发布成功后，站点地址通常为：

```text
https://AAA-Pig-Feed-Wholesale.github.io/Eight-legged-Notes-for-LLM-Application-Development/
```

## 说明

构建前会通过 `sync_docs.py` 把根目录 Markdown 同步到 `docs/`，这样既能满足 MkDocs 的目录要求，也不用改你当前在仓库根目录维护文档的习惯。
