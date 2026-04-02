
# 大模型应用开发详细模型笔记（增强版，2020—2026）

> 版本：2026-04-01  
> 这版相对上一稿，重点补强了**各模型的“模型卡式介绍”**：定位、上下文、模态、公开参数/架构、适用场景、短板、工程接入注意点。  
> **重要说明**：很多闭源商用模型（尤其是 OpenAI、Anthropic、Google、国内部分商用 API 型号）**不会公开精确参数量、层数、训练语料和底座细节**。这不是整理遗漏，而是厂商未披露。本文会明确标注为 **“未公开”**，避免把传闻当事实。  
> 若你后续还要继续扩写，我建议优先把这份文档当作**“模型手册 + 选型笔记”**，而不是普通综述。

---

# 目录

1. [先看懂：大模型“参数”到底该怎么看](#sec-1)
2. [2020—2026：模型代际演进脉络](#sec-2)
3. [国际主流平台：重点模型详细介绍](#sec-3)
4. [国内主流平台：重点模型详细介绍](#sec-4)
5. [应用开发相关的其他模型能力](#sec-5)
6. [工程选型：如何在项目里真正选模型](#sec-6)
7. [典型组合方案](#sec-7)
8. [高频误区](#sec-8)
9. [一页式总结](#sec-9)
10. [官方参考链接](#sec-10)

---

# 1. 先看懂：大模型“参数”到底该怎么看 { #sec-1 }

很多人一上来就问：
- 这个模型多少 B？
- 是不是参数越大越强？
- 为什么有些模型根本查不到参数？

这部分一定先搞清楚。

## 1.1 参数量（Parameters）是什么
参数量是模型中可训练权重的规模，常见单位：
- **B** = Billion = 十亿
- **T** = Trillion = 万亿

比如：
- 7B：70 亿参数
- 72B：720 亿参数
- 671B：6710 亿参数
- 2.4T：2.4 万亿参数

## 1.2 为什么“参数大”不等于“实际更强”
影响模型效果的不只是参数量，还包括：
- 数据质量
- 训练策略
- 对齐方式
- 推理时的思考预算
- 是否使用 MoE（Mixture of Experts，混合专家）
- 是否原生多模态
- 是否针对工具调用、代码、Agent 做专项优化

所以：
> **参数量是参考项，不是最终结论。**

## 1.3 Dense 和 MoE 的区别
### Dense（稠密模型）
每次推理都会激活几乎全部参数。

特点：
- 逻辑简单
- 部署直观
- 训练和推理成本高

### MoE（Mixture of Experts，混合专家）
模型总参数可能很大，但每次推理只激活一部分专家。

特点：
- **总参数大，但激活参数少**
- 更容易在“高能力 + 相对可控推理成本”之间取得平衡
- 现在很多强模型都走这条路线

工程上你经常会看到两种数字：
- **总参数（total parameters）**
- **激活参数（active parameters）**

## 1.4 为什么很多闭源模型查不到底座参数
因为闭源厂商通常不会完整公开：
- 总参数量
- 层数
- hidden size
- expert 数量
- tokenizer 细节
- 训练数据配比
- RLHF / RLAIF / reasoning stack 细节

这类模型你真正能稳定拿到的，通常只有：
- 上下文窗口
- 输入/输出模态
- 是否支持工具调用
- 是否支持结构化输出
- 是否支持思考模式
- 价格档位
- 官方推荐场景

所以，闭源模型的“认识方式”应当是：
> **以能力定位 + 官方接口规格 + 实际工程表现为主**，而不是死磕参数。

## 1.5 你以后看一个模型，最该记哪些信息
对应用开发者来说，最重要的不是背论文，而是记住下面这张“模型卡”。

### 模型卡最核心字段
1. 模型名称  
2. 发布时间 / 当前代际  
3. 定位（旗舰 / 平衡 / 低成本 / 推理 / 多模态 / 代码）  
4. 是否闭源 / 开源 / 开放权重  
5. 公开参数信息  
6. 上下文窗口  
7. 输入模态 / 输出模态  
8. 是否支持工具调用  
9. 是否支持 JSON / structured output  
10. 强项  
11. 短板  
12. 适合的项目  
13. 不适合的项目  

---

# 2. 2020—2026：模型代际演进脉络 { #sec-2 }

## 2.1 第一阶段：2020—2021
核心关键词：
- GPT-3
- few-shot
- completion
- Codex
- InstructGPT 思路萌芽

这一阶段重点解决：
- 大模型是否具备通用迁移能力
- 是否能在不专门训练每个任务的情况下完成多任务

## 2.2 第二阶段：2022—2023
核心关键词：
- ChatGPT
- GPT-4
- Claude
- PaLM 2
- Llama / Llama 2
- Qwen / ChatGLM / 文心等国内平台兴起

这一阶段重点解决：
- 交互方式从 completion 变成 chat
- 模型对齐能力显著增强
- 企业开始把 LLM 当作产品能力，而不是实验玩具

## 2.3 第三阶段：2024
核心关键词：
- 多模态
- 长上下文
- RAG 工程化
- Tool Use
- Agent 工作流

## 2.4 第四阶段：2025—2026
核心关键词：
- reasoning / thinking
- mini / flash / nano / lite
- realtime
- structured outputs
- agentic workflow
- multimodal native

---

# 3. 国际主流平台：重点模型详细介绍 { #sec-3 }

## 3.1 OpenAI

## 3.1.1 GPT-5.4
### 一句话定位
OpenAI 当前主力旗舰模型，强调 **agentic workflow、复杂推理、编码、专业任务**。

### 公开信息
- 是否闭源：**是**
- 参数量：**未公开**
- 架构细节：**未公开**
- 上下文窗口：**1M**
- 最大输出：**128K**
- 工具：支持

### 强项
- 编码能力强
- 工具调用和长任务衔接好
- 对复杂 instruction 的遵循稳定
- 适合作为系统中的“主决策模型”

### 短板 / 注意点
- 成本高于 mini / nano
- 不适合所有请求都直接走旗舰
- 在简单分类、清洗、标签任务上属于能力过剩

### 适合场景
- Agent 主模型
- 复杂代码任务
- 文档 + 表格 + 工具组合工作流
- 高质量复杂问答

## 3.1.2 GPT-5.4 Pro
### 一句话定位
GPT-5.4 的更高计算预算版本，强调**更高质量、更高精度、更强复杂任务能力**。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 架构：未公开
- 能力标签：更聪明、更精准，但更慢

### 适合场景
- 高价值复杂任务
- 关键报告生成
- 复杂代码修复
- 重要自动化审批前的高质量判断

## 3.1.3 GPT-5.4 Mini
### 一句话定位
OpenAI 当前“最强 mini 档”，适合**高吞吐、低成本、较强代码和工具场景**。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 定位：strong mini model for coding, computer use, subagents

### 适合场景
- 分类、抽取、改写
- 中等复杂工具调用
- 大规模线上 Copilot
- 子 Agent / 辅助 Agent

## 3.1.4 GPT-5.4 Nano
### 一句话定位
最低成本、高并发、轻任务模型。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 官方定位：simple high-volume tasks

### 适合做什么
- 标签分类
- 路由判断
- 简单规则抽取
- 预处理、清洗、标准化输出

## 3.1.5 GPT-4.1
### 一句话定位
OpenAI 当前重要的**非 reasoning 长上下文通用模型**。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 上下文窗口：**1,047,576**
- 输入：文本、图像
- 输出：文本

### 模型特点
- 非 reasoning
- 低延迟
- 1M 上下文
- 工具能力仍然很强

### 适合场景
- 长文档分析
- 低延迟大上下文工作流
- 不需要重 reasoning 的复杂工具任务

## 3.1.6 OpenAI 总结
OpenAI 最值得学的不只是单模型，而是：
- 旗舰 / mini / nano 分层
- image / embeddings / moderation / realtime / structured outputs
- Responses API 与 agentic workflow 的整体工程成熟度

---

## 3.2 Anthropic / Claude

## 3.2.1 Claude Opus 4.6
### 一句话定位
Anthropic 当前最强模型，面向**高难度 coding、agents、enterprise workflows**。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 上下文：**1M（beta）**

### 强项
- 代码与代码库任务
- 长上下文推理
- 长时 Agent 任务
- 代码 review / debugging
- 企业流程类知识工作

### 适合场景
- 编程 Agent
- 复杂企业知识工作流
- 多工具长链路任务
- 高质量文档/报告分析

## 3.2.2 Claude Sonnet 4.6
### 一句话定位
Claude 当前最值得重点掌握的“平衡型主力”，能力很强，但比 Opus 更实用。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 上下文：**1M（beta）**
- 特点：coding、computer use、long-reasoning、agent planning、knowledge work、design

### 适合场景
- 企业主力 Agent
- 代码开发助手
- 报告生成
- 搜索 + 工具 + 引用工作流

## 3.2.3 Claude Haiku 4.5
### 一句话定位
轻量、快、便宜，适合作为 Claude 体系里的低成本入口。

### 适用任务
- 摘要
- 标签
- 初筛
- 路由
- 简单对话
- 简单抽取

## 3.2.4 Claude 总结
Claude 体系特别适合你从“单模型问答”迈向“企业级 Agent 工作流”。

---

## 3.3 Google / Gemini

## 3.3.1 Gemini 2.5 Pro
### 一句话定位
Google 当前高能力旗舰之一，特别强调**complex reasoning、coding、multimodal、agentic challenges**。

### 公开信息
- 是否闭源：是
- 参数量：未公开
- 上下文：**1M**
- 能力：adaptive thinking、complex reasoning、coding、multimodal

### 适合场景
- 多模态助手
- 文档 / 视频理解
- 视觉问答
- 多模态 RAG
- 高质量 reasoning

## 3.3.2 Gemini 2.5 Flash
### 一句话定位
Google 当前高性价比主力，强调**速度、低延迟、可控 thinking budget**。

### 公开信息
- 是否闭源：是
- 参数量：未公开

### 适配场景
- 多模态客服
- 实时问答
- 中等复杂度助手
- 线上高并发服务

## 3.3.3 Gemini 3.1 Pro
### 一句话定位
Google 更新一代的高端能力线，强调更强 reasoning 与开发者控制能力。

### 工程建议
- preview 适合试能力
- production 仍应优先选择官方稳定推荐线

## 3.3.4 Gemini Embedding 2
### 一句话定位
Google 当前非常值得关注的 embedding 线，重点在于**原生多模态 embedding**。

### 工程意义
未来多模态 RAG 可以真正做统一语义检索。

## 3.3.5 Gemini 总结
Gemini 体系很适合做：
- 看图
- 看 PDF
- 看视频
- 实时互动

---

## 3.4 Meta / Llama

## 3.4.1 Llama 4 Scout
### 一句话定位
Meta 新一代 Llama 4 里的高效率开放权重模型，强调**natively multimodal + 超长上下文 + MoE**。

### 公开信息
- 是否开放权重：**是**
- 架构：**MoE**
- 公开参数：**17B parameter model with 16 experts**

### 强项
- 开放权重
- 原生多模态
- 适合私有化与二次开发

## 3.4.2 Llama 4 Maverick
### 一句话定位
Llama 4 系列里更强的一档，强调低成本下的高能力多模态理解。

### 公开信息
- 是否开放权重：是
- 架构：MoE
- 公开参数：**17B parameter model with 128 experts**

### 适合场景
- 私有多模态助手
- 企业内网视觉问答
- 本地多模态 RAG

## 3.4.3 Llama 总结
Llama 的价值不在 API，而在：
- 可私有化
- 可微调
- 可量化
- 社区生态大

---

# 4. 国内主流平台：重点模型详细介绍 { #sec-4 }

## 4.1 阿里｜Qwen / 百炼

## 4.1.1 Qwen3-Max
### 一句话定位
阿里百炼当前旗舰，适合**复杂任务，能力最强**。

### 公开信息
- 参数量：**未公开**
- 上下文：**262,144**

### 适合场景
- 中文高质量问答
- 复杂 Agent
- 企业流程自动化
- 复杂分析

## 4.1.2 Qwen3.5-Plus
### 一句话定位
阿里当前最实用的平衡型主力，**文本、图像、视频输入都支持**，纯文本表现接近 Qwen3-Max，但更快更便宜。

### 公开信息
- 参数量：未公开
- 上下文：**1,000,000**
- 输入模态：文本、图像、视频

### 适合场景
- 长文档分析
- 中文多模态助手
- 企业知识问答
- 视觉+文本结合应用

## 4.1.3 Qwen3.5-Flash
### 一句话定位
阿里体系里的高速低成本档，适合简单任务和高并发。

### 公开信息
- 参数量：未公开
- 上下文：**1,000,000**

### 适合做什么
- 分类
- 摘要
- 改写
- 路由
- 轻量问答

## 4.1.4 Qwen3.5-Omni
### 一句话定位
Qwen 的全模态路线节点，支持文本、图片、音频、音视频理解与交互。

### 公开信息
- 参数量：未公开
- 形态：全模态

## 4.1.5 Qwen 总结
Qwen 是国内最值得重点掌握的一条线，因为它同时覆盖：
- 开源生态
- 商用平台
- 中文应用
- Agent / RAG / 多模态

---

## 4.2 DeepSeek

## 4.2.1 deepseek-chat
### 一句话定位
DeepSeek-V3.2 的非 thinking 模式，适合常规对话与一般任务。

### 公开信息
- API 模型名：`deepseek-chat`
- 对应版本：**DeepSeek-V3.2**
- 上下文：**128K**

### 适合场景
- 通用对话
- 一般代码任务
- 常规工作流
- 不需要深思考的工具调用

## 4.2.2 deepseek-reasoner
### 一句话定位
DeepSeek-V3.2 的 thinking 模式，适合复杂推理、代码、Agent 长链路任务。

### 公开信息
- API 模型名：`deepseek-reasoner`
- 对应版本：**DeepSeek-V3.2**
- 上下文：**128K**

### 适合场景
- 数学推理
- 代码与修复
- 工程 Agent
- 复杂任务拆解

## 4.2.3 DeepSeek-R1
### 一句话定位
DeepSeek 推理路线的标志性节点，是理解 DeepSeek“为什么在 reasoning 赛道上存在感这么强”的关键模型。

### 说明
生产里你可能直接调的是 `deepseek-reasoner`，但认知层面必须知道 R1 路线的意义。

## 4.2.4 DeepSeek 总结
DeepSeek 最大特点：
- chat / reasoner 分工清晰
- 推理与代码标签很强
- 很适合做复杂任务升级模型

---

## 4.3 智谱｜GLM

## 4.3.1 GLM-5
### 一句话定位
智谱面向 **Agentic Engineering** 打造的旗舰基座模型。

### 公开信息
- 参数量：未公开
- 上下文：**200K**
- 最大输出：**128K**
- 输入/输出：文本
- 支持：思考模式、流式输出、Function Call、上下文缓存、结构化输出、MCP

### 适合场景
- 编程 Agent
- 复杂工具调用
- 企业流程自动化
- 通用 Agent 助手

## 4.3.2 GLM-5-Turbo
### 一句话定位
面向 OpenClaw / 长链路 Agent 场景优化的基座模型。

### 公开信息
- 参数量：未公开
- 上下文：**200K**
- 最大输出：**128K**

### 适合场景
- Coding agent
- 定时与持续任务
- 长链工具执行
- 工程工作流

## 4.3.3 GLM-5.1
### 一句话定位
智谱当前更新一代主线之一，实际使用时应视为重点现役型号。

### 说明
5.1、5-Turbo、5、4.7、4.6、4.5-Air 构成了当前分层体系。

## 4.3.4 GLM 总结
关键词：
- Agentic Engineering
- Coding
- MCP
- 结构化输出
- Context cache

---

## 4.4 月之暗面｜Kimi / Moonshot

## 4.4.1 Kimi K2.5
### 一句话定位
Kimi 当前重点主力，强调**万亿参数、256K 上下文、多模态理解、Tool Calling、代码与视觉推理**。

### 公开信息
- 参数量：**万亿参数级（官方表述）**
- 上下文：**256K**
- 能力：多模态理解、Tool Calling、代码生成、视觉推理

### 适合场景
- 多文件长文档问答
- 论文 / 研报分析
- 中文知识工作流
- 长上下文 Agent

## 4.4.2 kimi-k2-thinking
### 一句话定位
Kimi 的深思考模型，适合复杂推理、代码、长工具链任务。

## 4.4.3 kimi-k2-thinking-turbo
### 一句话定位
thinking 线的高速版，适合既要深度推理又要较快响应的场景。

### 说明
部分开发接入资料中可见约 **262,114 tokens** context 信息，但应以官方最新文档为准。

## 4.4.4 Kimi 总结
Kimi 已经从“长文档助手”扩展成：
- 长上下文
- 推理
- 代码
- 多模态
- Agent

---

## 4.5 火山引擎｜豆包 / 方舟

## 4.5.1 Doubao-Seed-1.8 / 豆包大模型 1.8
### 一句话定位
火山引擎当前重点展示的主力能力线之一，强调**更强模型、全模态、企业场景接入**。

### 公开信息
- 参数量：未公开
- 平台特点：多模态、智能客服、图像/视频生成、企业集成

## 4.5.2 多模态深度思考（豆包系列）
### 一句话定位
火山当前很值得关注的方向：**对图片、视频、文本进行深度思考并输出结构化文本**。

### 公开信息
- 支持图片 / 视频 / 文本输入
- 支持 reasoning_content
- 支持 thinking_type（enabled / disabled / auto）

## 4.5.3 Seedance 2.0
### 一句话定位
火山引擎当前重点视频生成能力线。

### 公开信息
- 可实现：文生视频、图生视频、参考素材生视频
- 典型方式：API / SDK 异步调用

## 4.5.4 火山总结
火山更适合理解为：
- 豆包模型族
- 方舟平台
- 图像 / 视频 / 智能体工具链  
的组合。

---

## 4.6 百度｜文心 / 千帆

## 4.6.1 ERNIE-5.0
### 一句话定位
百度当前旗舰之一，是文心路线的新一代节点。

### 公开信息
- 参数量：严格以百度官方正式文档为准；若写正式材料，不建议仅凭外部二手说法断言

## 4.6.2 ERNIE-5.0-Thinking-Preview
### 一句话定位
百度更前沿的推理预览型号，适合高质量中文 reasoning 任务。

## 4.6.3 ERNIE-X1.1
### 一句话定位
百度当前重点深度推理模型之一。

### 公开信息
- 能力：问答、工具调用、智能体、指令遵循、逻辑推理、数学、代码

## 4.6.4 ERNIE-4.5-Turbo-128K / VL
### 一句话定位
百度现役高性价比与多模态重要档位。

## 4.6.5 百度总结
百度值得掌握的不只是 ERNIE 本身，而是：
- 文心自研模型
- 千帆平台生态
- 推理 + VL + Turbo 分层

---

## 4.7 腾讯｜混元

## 4.7.1 混元生文
### 一句话定位
腾讯混元的文本主线能力。

### 公开信息
- 参数量：未公开
- 能力：高质量内容创作、数理逻辑、代码生成、多轮对话

## 4.7.2 混元多模态
### 一句话定位
腾讯体系中的视觉 / 多模态理解能力线。

## 4.7.3 混元生图 / 生视频 / 生 3D
### 一句话定位
腾讯把混元做成了完整的内容生成产品族，而不只是文本模型。

## 4.7.4 腾讯总结
腾讯混元的特点是：
- 文本
- 多模态
- 生图
- 生视频
- 生 3D
- 联网插件
形成完整产品族。

---

# 5. 应用开发相关的其他模型能力 { #sec-5 }

## 5.1 Embedding 模型
作用：
- RAG
- 语义搜索
- 推荐
- 聚类
- 去重

## 5.2 Rerank 模型
作用：
对第一阶段检索结果重新排序。

## 5.3 Moderation / 安全模型
作用：
负责输入输出审核、内容安全、越狱防护前置。

## 5.4 语音模型：ASR / TTS / Realtime
你要会区分：
- ASR
- TTS
- Realtime
- Speech-to-Speech

## 5.5 图像 / 视频生成模型
你要会区分：
- 文生图
- 图生图
- 图像编辑
- 文生视频
- 图生视频
- 视频编辑

## 5.6 Structured Output / JSON
让模型真正接数据库、工单系统、流程系统。

## 5.7 Tool Use / Function Calling / MCP
你要会区分：
- function calling
- tool use
- MCP

---

# 6. 工程选型：如何在项目里真正选模型 { #sec-6 }

## 6.1 先问任务，再问模型
正确顺序：
1. 任务是什么  
2. 是否需要多模态  
3. 是否需要复杂 reasoning  
4. 是否需要工具调用  
5. 是否需要长上下文  
6. 是否需要低成本  
7. 是否要私有化部署  

## 6.2 一个实用选型框架
### 简单分类 / 标签 / 抽取
优先：
- mini / flash / nano / turbo 类

### 复杂 Agent
优先：
- GPT-5.4
- Claude Sonnet / Opus
- DeepSeek reasoner
- GLM-5
- Kimi thinking

### 中文长文档
优先：
- Kimi K2.5
- Qwen3.5-Plus
- GPT-4.1 / GPT-5.4
- Gemini 2.5 Pro

### 多模态理解
优先：
- Gemini 2.5 Pro
- Qwen3.5-Plus / Omni
- 豆包多模态深思考
- 混元多模态

### 私有化部署
优先：
- Llama
- Qwen 开源线
- DeepSeek 开源线
- 其他开放权重模型

## 6.3 各平台重点模型工程字段速查表

> **使用说明（截至 2026-04-02）：**
> 1. **参数规模 / 上下文长度 / 开源协议**优先写官方公开值；官方没披露就明确写 **“未公开”**。  
> 2. **中英文能力 / 指令跟随 / 推理能力 / 推理速度 / 部署成本** 是面向应用开发的**相对评级**，便于快速选型，不是官方打分。  
> 3. **闭源 API 模型**的“部署成本”更多指 `API 单价 + 延迟 + 吞吐`；**开放权重模型**的“部署成本”更多指 `显存、机器、推理框架、运维成本`。  
> 4. 文中部分型号名称是**产品线写法**或**代际写法**，如果与你接入时的 API 型号名不完全一致，应以当日官方模型页、计费页和 SDK 文档为准。

### 6.3.1 OpenAI

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPT-5.4 | 未公开；闭源旗舰线 | 未单独公开 | 英文极强；中文强 | 很强 | 很强 | 中 | 高 | 闭源 API / 商用条款 |
| GPT-5.4 Pro | 未公开；更高计算预算档 | 未单独公开 | 英文极强；中文强 | 很强 | 极强 | 偏慢 | 很高 | 闭源 API / 商用条款 |
| GPT-5.4 Mini | 未公开；mini 档 | 未单独公开 | 英文强；中文强 | 强 | 中上 | 快 | 中 | 闭源 API / 商用条款 |
| GPT-5.4 Nano | 未公开；nano 档 | 未单独公开 | 英文中上；中文中上 | 中上 | 中 | 很快 | 低 | 闭源 API / 商用条款 |
| GPT-4.1 | 未公开 | 1,047,576 | 英文极强；中文强 | 强 | 中上 | 中 | 中高 | 闭源 API / 商用条款 |

### 6.3.2 Anthropic / Claude

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Opus 4.6 | 未公开；闭源旗舰线 | 200K（Claude 高端线常见规格） | 英文极强；中文中上 | 很强 | 极强 | 偏慢 | 很高 | 闭源 API / 商用条款 |
| Claude Sonnet 4.6 | 未公开；主力平衡档 | 200K（Claude 主力线常见规格） | 英文极强；中文中上 | 很强 | 很强 | 中 | 高 | 闭源 API / 商用条款 |
| Claude Haiku 4.5 | 未公开；轻量低延迟档 | 200K（轻量线常见规格） | 英文强；中文中上 | 中上 | 中 | 快 | 中低 | 闭源 API / 商用条款 |

### 6.3.3 Google / Gemini

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gemini 2.5 Pro | 未公开 | 1M | 英文极强；中文强 | 很强 | 很强 | 中 | 中高 | 闭源 API / 商用条款 |
| Gemini 2.5 Flash | 未公开 | 1M | 英文强；中文强 | 强 | 中上 | 快 | 中低 | 闭源 API / 商用条款 |
| Gemini 3.1 Pro | 未公开；预览高端线 | 预览规格，以模型页为准 | 英文极强；中文强 | 很强 | 很强 | 中 | 中高 | 闭源 API / 预览型号 |
| Gemini Embedding 2 | 未公开；向量模型 | N/A（Embedding） | 中英都强 | N/A | N/A | 快 | 低 | 闭源 API / 向量服务 |

### 6.3.4 Meta / Llama

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Llama 4 Scout | 109B 总参数 / 17B 激活 / 16 Experts，MoE | 10M | 英文强；中文中上 | 中上 | 中上 | 快 | 中高 | Llama 4 Community License / 开放权重 |
| Llama 4 Maverick | 400B 总参数 / 17B 激活 / 128 Experts，MoE | 1M | 英文很强；中文中上 | 强 | 中上到强 | 中 | 高 | Llama 4 Community License / 开放权重 |

### 6.3.5 阿里｜Qwen / 百炼

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Qwen3-Max | 未公开；旗舰商用线 | 262,144 | 中文极强；英文强 | 很强 | 很强 | 中 | 高 | 闭源 API / 百炼商用条款 |
| Qwen3.5-Plus | 未公开；主力平衡档 | 1,000,000 | 中文极强；英文强 | 很强 | 中上到强 | 中 | 中 | 闭源 API / 百炼商用条款 |
| Qwen3.5-Flash | 未公开；高速低成本档 | 1,000,000 | 中文强；英文中上 | 强 | 中 | 很快 | 低 | 闭源 API / 百炼商用条款 |
| Qwen3.5-Omni | 未公开；全模态路线 | 官方以模型页为准 | 中文强；英文中上 | 强 | 中上 | 中 | 中高 | 闭源 API / 多模态商用服务 |

### 6.3.6 DeepSeek

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| deepseek-chat | API 侧未单独披露；对应 DeepSeek-V3.2 chat 模式 | 128K | 中文很强；英文强 | 强 | 中上 | 快 | 低 | API 接入；同家族有开放权重路线 |
| deepseek-reasoner | API 侧未单独披露；对应 DeepSeek-V3.2 reasoning 模式 | 128K | 中文很强；英文强 | 强 | 很强 | 中偏慢 | 中低 | API 接入；同家族有开放权重路线 |
| DeepSeek-R1 | 671B 总参数 / 37B 激活，MoE | 128K | 中文很强；英文强 | 强 | 极强 | 偏慢 | 自部署很高 / API 中低 | MIT License / 开放权重 |

### 6.3.7 智谱｜GLM

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GLM-5 | 未公开；旗舰 Agent 基座 | 200K | 中文极强；英文中上 | 很强 | 很强 | 中 | 中高 | 闭源 API / 商用条款 |
| GLM-5-Turbo | 未公开；Agent 工程优化档 | 200K | 中文极强；英文中上 | 很强 | 中上到强 | 快 | 中 | 闭源 API / 商用条款 |
| GLM-5.1 | 未公开；更新一代主线 | 未单独公开 | 中文极强；英文中上 | 很强 | 很强 | 中 | 中高 | 闭源 API / 商用条款 |

### 6.3.8 月之暗面｜Kimi / Moonshot

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kimi K2.5 | 万亿参数级（官方表述）；多模态主力线 | 256K | 中文极强；英文强 | 很强 | 很强 | 中 | 中高 | 闭源 API / 商用条款 |
| kimi-k2-thinking | 未公开；深思考线 | 256K（按家族规格理解） | 中文极强；英文强 | 很强 | 极强 | 偏慢 | 高 | 闭源 API / 商用条款 |
| kimi-k2-thinking-turbo | 未公开；thinking 高速档 | 约 262K，最终以模型页为准 | 中文极强；英文强 | 很强 | 很强 | 中偏快 | 中高 | 闭源 API / 商用条款 |

### 6.3.9 火山引擎｜豆包 / 方舟

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Doubao-Seed-1.8 / 豆包大模型 1.8 | 未公开；豆包主力能力线 | 官方以模型页为准 | 中文很强；英文中上 | 强 | 中上到强 | 中 | 中 | 闭源 API / 方舟商用条款 |
| 多模态深度思考（豆包系列） | 未公开；多模态 reasoning 路线 | 官方以模型页为准 | 中文很强；英文中上 | 很强 | 很强 | 中偏慢 | 中高 | 闭源 API / 多模态服务 |
| Seedance 2.0 | 未公开；视频生成模型 | N/A（视频生成） | N/A | N/A | N/A | 慢 | 高 | 闭源 API / 视频生成服务 |

### 6.3.10 百度｜文心 / 千帆

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ERNIE-5.0 | 未公开；百度旗舰线 | 官方以模型页为准 | 中文极强；英文中上 | 很强 | 很强 | 中 | 中高 | 闭源 API / 千帆商用条款 |
| ERNIE-5.0-Thinking-Preview | 未公开；推理预览线 | 官方以模型页为准 | 中文极强；英文中上 | 很强 | 极强 | 偏慢 | 高 | 闭源 API / 预览型号 |
| ERNIE-X1.1 | 未公开；深度推理线 | 官方以模型页为准 | 中文极强；英文中上 | 很强 | 很强 | 中 | 中高 | 闭源 API / 千帆商用条款 |
| ERNIE-4.5-Turbo-128K | 未公开；高性价比文本档 | 128K | 中文极强；英文中上 | 强 | 中上 | 快 | 中 | 闭源 API / 千帆商用条款 |
| ERNIE-4.5-Turbo-VL | 未公开；多模态档 | 32K（VL 线常见规格） | 中文极强；英文中上 | 强 | 中上 | 中 | 中高 | 闭源 API / 多模态服务 |

### 6.3.11 腾讯｜混元

| 模型 | 参数规模 / 架构 | 上下文长度 | 中英文能力 | 指令跟随能力 | 推理能力 | 推理速度 | 部署成本 | 开源协议 / 可用方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 混元生文 | 未公开；文本主线 | 官方以模型页为准 | 中文极强；英文中上 | 强 | 中上到强 | 中 | 中 | 闭源 API / 商用条款 |
| 混元多模态 | 未公开；视觉理解线 | 官方以模型页为准 | 中文强；英文中上 | 强 | 中上 | 中 | 中高 | 闭源 API / 多模态服务 |
| 混元生图 / 生视频 / 生 3D | 未公开；生成内容产品族 | N/A（生成模型） | N/A | N/A | N/A | 慢 | 高 | 闭源 API / 内容生成服务 |

---

# 7. 典型组合方案 { #sec-7 }

## 7.1 知识库问答
- embedding
- rerank
- 主聊天模型
- citation / 引用展示

## 7.2 编程 Agent
- 主推理模型
- repo 检索
- 运行 / 测试工具
- diff 与 patch 工具

## 7.3 语音助手
- ASR
- chat / reasoning model
- TTS
- realtime transport

## 7.4 多模态 Copilot
- 多模态理解模型
- 检索
- structured output
- 工具执行

---

# 8. 高频误区 { #sec-8 }

## 8.1 误区：只看参数量
错。闭源模型很多参数不公开；公开了也不代表更适合你的任务。

## 8.2 误区：只选最强旗舰
错。线上绝大多数请求不值得用最贵档。

## 8.3 误区：长上下文就不需要 RAG
错。长上下文和检索增强解决的问题不同。

## 8.4 误区：会 function call 就等于会做 Agent
错。Agent 还涉及规划、状态、权限、重试、终止条件、日志与评测。

## 8.5 误区：开源就一定更便宜
错。还要算 GPU、运维、安全、监控、升级和评测成本。

---

# 9. 一页式总结 { #sec-9 }

1. **先区分模型类型**：旗舰 / 平衡 / 低成本 / 推理 / 多模态 / 开放权重。  
2. **闭源模型很多底座参数不公开**，这很正常；工程上更该看上下文、模态、工具能力、价格和真实任务表现。  
3. **OpenAI / Claude / Gemini** 更像完整平台生态。  
4. **Qwen / DeepSeek / GLM / Kimi** 是国内最值得重点掌握的几条主线。  
5. **Llama** 最重要的不是 API，而是私有化与开放权重生态。  
6. 真正项目里，通常是**多模型协同**，不是一个聊天模型包打天下。  
7. 模型选型不是问“谁最强”，而是问“谁最适合当前任务 + 预算 + 延迟 + 安全要求”。  

---

# 10. 官方参考链接 { #sec-10 }

## OpenAI
- Models Overview: https://developers.openai.com/api/docs/models
- GPT-5.4: https://developers.openai.com/api/docs/models/gpt-5.4
- GPT-4.1: https://developers.openai.com/api/docs/models/gpt-4.1
- All models: https://developers.openai.com/api/docs/models/all

## Anthropic
- Claude Models: https://docs.anthropic.com/en/docs/about-claude/models
- Claude Sonnet 4.6: https://www.anthropic.com/claude/sonnet
- Claude Opus 4.6: https://www.anthropic.com/claude/opus

## Google
- Gemini Models: https://ai.google.dev/gemini-api/docs/models
- Vertex AI Models: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models
- Gemini 3.1 Pro: https://deepmind.google/models/gemini/pro/
- Gemini Embeddings: https://ai.google.dev/gemini-api/docs/embeddings

## Meta
- Llama 4 overview: https://www.llama.com/models/llama-4/
- Llama 4 model cards: https://www.llama.com/docs/model-cards-and-prompt-formats/llama4/
- Meta official HF model page (Scout): https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E

## 阿里 / Qwen
- 百炼模型列表： https://help.aliyun.com/zh/model-studio/models
- 国际版模型列表： https://www.alibabacloud.com/help/zh/model-studio/models
- 百炼控制台： https://bailian.console.aliyun.com/

## DeepSeek
- API Docs： https://api-docs.deepseek.com/
- Models & Pricing： https://api-docs.deepseek.com/quick_start/pricing
- DeepSeek-V3.2 Release： https://api-docs.deepseek.com/news/news251201

## 智谱
- GLM-5： https://docs.bigmodel.cn/cn/guide/models/text/glm-5
- GLM-5-Turbo： https://docs.bigmodel.cn/cn/guide/models/text/glm-5-turbo
- 套餐/模型总览： https://docs.bigmodel.cn/cn/coding-plan/overview

## Kimi / Moonshot
- 开放平台： https://platform.moonshot.cn/
- Kimi K2.5： https://platform.kimi.com/docs/guide/kimi-k2-5-quickstart
- 编程工具接入： https://platform.moonshot.ai/docs/guide/agent-support
- Kimi K2 Thinking： https://moonshotai.github.io/Kimi-K2/thinking.html

## 火山引擎
- 豆包： https://www.volcengine.com/product/doubao
- Seedance 2.0： https://www.volcengine.com/docs/82379/1366799
- 多模态深度思考： https://www.volcengine.com/docs/6492/2165109?lang=zh

## 百度千帆
- 模型中心： https://console.bce.baidu.com/qianfan/modelcenter/model/buildIn/list
- 计费与服务： https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya

## 腾讯混元
- 产品页： https://cloud.tencent.com/product/tclm
- 产品概述： https://cloud.tencent.com/document/product/1729/104753
- 官网： https://hunyuan.tencent.com/
