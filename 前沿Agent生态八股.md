# 前沿Agent生态八股

------

## 1. 这份文档讲什么？

这份文档专门整理 2025 到 2026 年大模型应用和 Agent 方向很容易被问到的新概念：

- MCP
- Skills
- OpenClaw
- A2A
- Computer Use / CUA

如果你去面试大模型应用开发、Agent 平台、AI Infra、AI 产品工程，这些词现在越来越常见。  
截至 **2026-03-24**，这几个方向里最值得先吃透的是：

1. `MCP`：工具与上下文接入协议
2. `Skills`：可复用能力打包方式
3. `OpenClaw`：典型的“自托管、多通道、Agent-native”平台案例
4. `A2A`：Agent 与 Agent 之间的通信协议
5. `Computer Use`：让模型通过 UI 直接操作软件

------

## 2. 先给一张总图：这些概念之间是什么关系？

你可以先记这句话：

> MCP 解决“Agent 怎么接外部能力”，Skills 解决“能力怎么打包复用”，A2A 解决“Agent 怎么彼此通信”，Computer Use 解决“Agent 怎么直接操作界面”，而 OpenClaw 是把这些理念落成产品形态的一类代表。

再拆开看：

- `MCP`：像 AI 应用的 USB-C，统一接工具、数据源、Prompt 模板
- `Skills`：像 AI Agent 的插件包 / playbook
- `A2A`：像 Agent 与 Agent 之间的应用层协议
- `Computer Use`：像模型的“眼睛 + 鼠标 + 键盘”
- `OpenClaw`：像一个把消息通道、工具、Skills、路由、会话都串起来的自托管 Agent Gateway

------

## 3. MCP：现在最该会的新协议

### 3.1 什么是 MCP？

> MCP，全称 Model Context Protocol，是一个开放协议，用来把 AI 应用和外部系统连接起来。  
> 官方文档直接把它类比成 AI 应用的 USB-C，这个比喻非常好记。

你面试里可以这样答：

> MCP 的本质是标准化“模型如何访问外部世界”。以前每接一个工具、数据库、知识库都要单独造轮子；MCP 试图把这件事变成统一协议。

------

### 3.2 MCP 为什么重要？

它重要不是因为“名字火”，而是因为它解决了真实工程问题：

- 工具接入方式统一
- 不同宿主和不同服务器之间可以复用
- 工具、资源、Prompt 可以标准化暴露
- 生态更容易形成 marketplace 和 registry

一句话：

> MCP 想解决的，是 Agent 生态过去“每家框架都一套私有工具协议”的碎片化问题。

------

### 3.3 MCP 的核心架构怎么讲？

官方规范里最常见的三类角色是：

- `Host`：真正承载 LLM 应用的宿主，比如 ChatGPT、Claude、IDE、Agent 平台
- `Client`：Host 内部负责和 MCP Server 通信的连接器
- `Server`：暴露能力的一方，比如文件系统、数据库、GitHub、搜索、知识库服务

面试里可以用一句更口语的话：

> Host 是使用者，Client 是适配层，Server 是能力提供方。

------

### 3.4 MCP 里最重要的 3 个 server primitives 是什么？

根据官方规范，Server 主要暴露三类能力：

- `Resources`：上下文和数据
- `Prompts`：模板化消息和工作流
- `Tools`：可执行函数

这是最容易考的点。

你可以这么解释：

- `Resources` 更像“可读的数据源”
- `Prompts` 更像“可参数化的提示模板”
- `Tools` 更像“真正会做事的动作”

另外规范里还提到客户端可以给服务端提供 `Sampling` 能力，也就是 server 可以向 host 请求模型采样，这会带来更强的递归式 agent 行为。

------

### 3.5 MCP 和普通 function calling 有什么区别？

这是高频题。

> Function calling 更像“这次请求里，我把几个函数签名临时告诉模型”；MCP 更像“我把一个完整能力系统通过标准协议挂到模型边上”。

具体区别：

- function calling 更偏单次调用时的工具暴露
- MCP 更偏长期、标准化、可发现、可治理的能力接入
- MCP 不止有 tools，还有 resources 和 prompts
- MCP 更适合做通用工具生态和跨宿主复用

一句话总结：

> function calling 是工具调用机制，MCP 是工具生态协议。

------

### 3.6 MCP 常见传输方式有哪些？

从当前官方 SDK 和接入文档看，常见 transport 包括：

- `stdio`
- `SSE`
- `Streamable HTTP`

理解方式：

- `stdio`：本地进程式接入，适合本地 server
- `SSE / HTTP`：远程 server 接入，适合网络服务化部署

面试里不用死背所有 transport 细节，但最好知道：

> MCP 不只是“本地插件协议”，它已经很明确在往远程服务协议发展。

------

### 3.7 MCP Registry 是什么？

截至当前官方文档，MCP 已经有官方 Registry 和标准化元数据格式。

它的作用是：

- 发布 MCP server 元数据
- 提供统一发现入口
- 做 namespace 验证
- 为 downstream marketplace 提供基础索引

这里很容易出一个加分点：

> 官方 Registry 不等于最终用户直接使用的商店，它更像基础设施层的元数据仓库；真正给用户看的，往往还是上层 aggregator / marketplace。

------

### 3.8 OpenAI 里的 Connectors 和 Remote MCP Server 是什么关系？

OpenAI 当前文档把这件事讲得很清楚：

- `Connectors`：OpenAI 维护的 MCP wrapper
- `Remote MCP server`：任何实现了远程 MCP 协议的第三方服务

也就是说：

> Connectors 本质上可以理解为“官方托管/维护版的 MCP 能力接入”。

这类题你可以这样答：

> 如果我要更稳定、常见的第三方服务接入，会优先看 Connectors；如果要接自定义能力或服务商自己的官方 MCP server，就走 Remote MCP。

------

### 3.9 MCP 最大的工程价值是什么？

我建议你答这三点：

1. 标准化接入，降低集成成本
2. 能力可复用，减少重复造轮子
3. 更容易做治理、审批、过滤、审计

比“能调更多工具”更高级的一种说法是：

> MCP 让 Agent 系统更像现代软件系统，而不是一堆散装 prompt 加函数。

------

### 3.10 MCP 最大的风险是什么？

这个题现在非常重要。

MCP 官方规范和 OpenAI 的相关文档都反复强调了风险：

- 任意数据访问
- 任意代码执行
- prompt injection
- 数据外泄
- 工具行为变化导致不可控
- 第三方 server 不可信

所以标准回答应该带这几句：

> MCP 不是天然安全的。它只是统一了接入方式，不会自动解决信任问题。  
> 真正落地时，要做 server 信任管理、工具 allowlist、审批流、日志留存和数据最小化暴露。

------

### 3.11 面试里怎么一句话讲清 MCP？

> MCP 是把模型接工具、接数据、接 Prompt 模板这件事标准化的开放协议。它比单纯 function calling 更像一层能力接入总线，适合做 Agent 平台、企业内部工具生态和跨应用复用，但前提是你要把安全治理做好。

------

## 4. Skills：为什么它正在变成 Agent 时代的能力打包方式

### 4.1 Skills 是什么？

OpenAI 官方文档和 `openai/skills` 仓库给出的定义已经很清楚了：

> Skill 是一个带版本的文件 bundle，核心是一个 `SKILL.md` manifest，再加脚本、资源、辅助文件。

用更工程化的话说：

> Skill 是把“这件事怎么做”打包成一个可复用能力单元。

------

### 4.2 Skills 为什么重要？

因为很多流程不是一个 tool 就能解决，而是一整套：

- 何时触发
- 用什么命令
- 读哪些文件
- 遇到什么情况停下
- 有哪些惯例和边界

如果这些东西每次都靠大模型临场发挥，稳定性会很差。

所以 Skills 的价值是：

- 把经验固化
- 把流程复用
- 把团队规范显式化
- 让 agent 不只是“会想”，还“知道你们团队平时怎么做”

------

### 4.3 一个 Skill 通常长什么样？

最核心的是：

- `SKILL.md`

里面通常包含：

- 名称
- 描述
- 何时使用
- 怎么使用
- 附带脚本/资源引用

OpenAI 当前文档里把 Skill 定义成：

> versioned bundle of files + `SKILL.md` manifest

这就是面试里最稳的表述。

------

### 4.4 Skills 和 Prompt 有什么区别？

> Prompt 更像一次对话里的临时指令；Skill 更像持久化、可版本化、可复用的能力包。

换句话说：

- Prompt 更偏“这次你怎么回答”
- Skill 更偏“以后遇到这类任务，你按这套方法做”

所以 Skill 本质上是把 Prompt 工程产品化了。

------

### 4.5 Skills 和 Tools 有什么区别？

这也是高频题。

> Tool 是能力接口，Skill 是能力使用说明书和流程打包。

比如：

- Tool：`run_sql(query)`
- Skill：什么情况下该查数据库、查询前先确认什么、查完后如何总结、哪些查询不要做

一句话：

> Tool 是手，Skill 是手册。

------

### 4.6 Skills 和 MCP 是什么关系？

> MCP 解决“能力如何暴露给模型”，Skill 解决“模型拿到能力后怎么更稳地用”。

更具体地说：

- MCP 更像协议层
- Skill 更像工作流层/知识层

两者不是替代关系，而是常常叠加：

> 先通过 MCP 把能力接进来，再用 Skill 教模型如何正确使用这些能力。

------

### 4.7 OpenAI 当前的 Skills 机制有哪些关键点？

根据官方文档，当前要记住这些点：

- Skills 可以上传和版本管理
- 可以挂载到 hosted shell 环境
- 平台会把 skill 的 `name`、`description`、`path` 暴露到 prompt context
- 模型会自行决定是否读取 `SKILL.md`
- 支持显式指定 `default_version` / `latest_version`

这里有一个很重要的面试点：

> Skill instructions 在 OpenAI 当前实现里属于 user prompt input，而不是 system prompt input，所以它不是绝对最高优先级的硬规则。

这个点非常加分，因为很多人不知道。

------

### 4.8 Skills 有什么风险？

官方文档已经明确提醒：

- prompt injection
- 数据外泄
- 恶意自动化
- 版本漂移
- 开放 skill catalog 带来的供应链风险

所以你可以这样答：

> Skills 的风险不在“它是 markdown”，而在它把可执行流程和指令一起引进了运行环境。如果 skill 来源不可信，它就可能把 Agent 带偏，甚至诱导它执行危险操作。

------

### 4.9 OpenAI Skills、OpenClaw Skills、Agent Skills Open Standard 是什么关系？

可以这样理解：

- `Agent Skills open standard`：开放规范
- `OpenAI Skills`：官方产品化实现
- `OpenClaw Skills`：另一套平台里的能力包实现

也就是说：

> “Skill” 不是某一家独有概念，它正在变成 Agent 生态里相对通用的一种能力封装思想。

------

### 4.10 面试里怎么一句话讲清 Skills？

> Skill 是把 instructions、scripts、resources 打包成一个带版本、可复用的能力单元。它比单次 Prompt 更稳定，比单独 Tool 更完整，适合把团队经验、工作流规范和自动化能力沉淀下来。

------

## 5. OpenClaw：为什么它值得知道？

### 5.1 OpenClaw 是什么？

按 OpenClaw 官方文档的说法，它是一个：

> self-hosted gateway，把 WhatsApp、Telegram、Discord、iMessage 等消息通道接到 AI Agent 上。

如果用面试语言来说：

> OpenClaw 是一个自托管、多通道、Agent-native 的 Gateway 平台，让你可以在自己的机器或服务器上跑一个常驻 Agent，然后从各种聊天入口去调用它。

------

### 5.2 OpenClaw 为什么火？

因为它踩中了几个很强的需求：

- 自托管
- 多通道接入
- 个人 AI 助手常驻化
- 能接 skills、tools、workspace
- 更接近“生活中的 Agent”，不是只在 IDE 里工作

如果说 Claude Code / Codex / Cursor 更像“IDE 内 agent”，那 OpenClaw 更像：

> “分布式入口 + 常驻代理 + 个人操作系统层助手”

------

### 5.3 OpenClaw 的核心架构怎么讲？

根据官方文档和仓库说明，最关键的是：

- `Gateway`：系统中心，负责 sessions、routing、channels
- `Channels`：WhatsApp、Telegram、Discord 等消息入口
- `Workspace`：agent 的工作目录
- `Skills`：能力包
- `Sessions`：每个用户/每个 agent/每个 sender 的隔离上下文
- `Nodes`：移动端或其他设备节点能力

一句话：

> OpenClaw 不是单一 Agent，而是一个把入口、路由、上下文、能力包和设备控制整合起来的 Agent 操作底座。

------

### 5.4 OpenClaw 和普通 Agent 框架有什么区别？

普通 Agent 框架更常见的是：

- 单应用
- 单入口
- 更偏开发者工作流

OpenClaw 的区别在于：

- 多聊天通道统一接入
- Gateway 是长期运行服务
- 会话和路由是核心能力
- 更强调自托管和日常生活入口

所以它更像“Agent Gateway / Agent OS”，而不是纯框架。

------

### 5.5 OpenClaw 和 Skills 的关系是什么？

官方仓库和文档里已经把 Skills 作为非常核心的一层。

可以这样理解：

> OpenClaw 把 Skill 当成平台一级能力，而不是附属小功能。

它的 workspace 下就有 skills 目录，而且文档里专门提到：

- injected prompt files：`AGENTS.md`、`SOUL.md`、`TOOLS.md`
- skills：`~/.openclaw/workspace/skills/<skill>/SKILL.md`

这说明它的能力组织方式已经不是单纯“工具列表”，而是“人格设定 + 工具说明 + skill bundle”组合。

------

### 5.6 OpenClaw 的优势是什么？

面试里可以讲这几条：

- 自托管，控制权强
- 多通道统一接入，使用场景自然
- session 和 routing 是平台级能力
- 易于接入 skill 和工具生态
- 更接近日常工作和生活里的常驻 Agent

------

### 5.7 OpenClaw 的局限和风险是什么？

这个必须会讲，不然只像在吹概念。

主要问题：

- 平台复杂度高
- 宿主机权限风险大
- 多通道意味着更大的攻击面
- 技能市场和第三方插件会带来供应链风险
- 群聊、多用户、多 session 的隔离做不好就容易出事

官方仓库也明确写了安全模型相关内容，比如：

- 主 session 默认工具直接跑在 host
- 群组/频道建议用 sandbox
- allowlist / denylist 要配置

所以更成熟的回答是：

> OpenClaw 很强，但越接近“真实世界操作系统入口”，越不能把它当成普通聊天机器人去看，权限治理是第一优先级。

------

### 5.8 面试里怎么评价 OpenClaw？

> 我会把 OpenClaw 看成 2025-2026 这波“Agent 走向真实入口”的典型代表。它说明 Agent 正从 IDE 和网页 demo 走向常驻化、多通道、自托管和个人操作系统级集成，但也把安全、权限和治理问题一并放大了。

------

## 6. A2A：Agent 跟 Agent 怎么说话

### 6.1 A2A 是什么？

> A2A，全称 Agent2Agent Protocol，是 Google 推动的 Agent 间通信开放协议，目标是让不同框架、不同组织的 Agent 能互相协作。

你可以把它理解成：

> MCP 更像 Agent 接工具，A2A 更像 Agent 接 Agent。

------

### 6.2 A2A 解决什么问题？

多 Agent 系统越来越多以后，会遇到一个问题：

- 一个 agent 会规划
- 一个 agent 会写代码
- 一个 agent 会查知识库
- 一个 agent 会做审批

如果它们之间没有统一协议，协作就很碎片化。

所以 A2A 想做的是：

- agent 发现彼此
- agent 交换任务
- agent 共享结果
- agent 协调执行

------

### 6.3 A2A 和 MCP 有什么区别？

这个问题特别值得准备。

> MCP 面向的是“模型/Agent 与工具/数据源”的连接；A2A 面向的是“Agent 与 Agent”的连接。

更直白一点：

- MCP：我去调用日历、文件、数据库
- A2A：我去委托另一个 agent 帮我干活

所以二者不是竞争关系，而是层级不同。

------

### 6.4 为什么 A2A 也是加分点？

因为它反映了一个趋势：

> Agent 生态正在从“单体 Agent”走向“可互操作的 agent mesh”。

这和过去微服务的发展很像：

- 早期是单体
- 后来是服务化
- 再后来才有服务间标准化治理

Agent 现在也在走这条路。

------

## 7. Computer Use / CUA：让模型直接操作界面

### 7.1 什么是 Computer Use？

OpenAI 当前官方文档的表述很直接：

> Computer use lets a model operate software through the user interface.

翻成面试语言：

> Computer Use 就是让模型通过截图理解当前界面，再返回点击、输入、滚动等动作，由你的执行环境真正去操作浏览器或桌面。

------

### 7.2 CUA 是什么？

CUA 一般指 Computer-Using Agent。OpenAI 的公开研究介绍里把它描述成：

> 一个可以通过 GUI 和数字世界交互的通用接口。

它背后的关键思想是：

- 模型看屏幕
- 模型决定动作
- 外部 harness 执行动作
- 再把新截图喂回模型

本质上是一种“视觉闭环 agent”。

------

### 7.3 Computer Use 为什么重要？

因为很多软件世界并没有干净的 API。

所以如果你只能靠 API，就做不了这些事：

- 点击网页
- 填表
- 操作遗留系统
- 使用企业内部老旧后台
- 在真实图形界面里完成任务

所以 Computer Use 解决的是：

> “没有 API，或者 API 不够时，Agent 怎么像人一样直接操作界面。”

------

### 7.4 Computer Use 的风险为什么比普通 tool calling 大？

官方文档反复强调几件事：

- 要跑在隔离环境里
- 对高风险动作保持 Human-in-the-Loop
- 把页面内容视为不可信输入
- 做域名 allowlist 和动作限制

这是因为：

- 页面可以 prompt inject 你
- 点击和输入会直接产生真实世界副作用
- 购物、支付、删除、发邮件都可能出事故

一句话：

> Computer Use 是最接近“执行权”的 agent 能力，所以也最需要权限边界。

------

### 7.5 Computer Use 和 OpenClaw 有什么关系？

不是严格绑定关系，但它们在方向上很像：

- 都在把 Agent 从纯文本拉向真实世界操作
- 都强调运行环境、安全边界、可执行动作
- 都比普通 chat agent 更接近“代理人”

如果面试官想听趋势判断，你可以说：

> OpenClaw 代表的是多入口自托管 Agent 平台化，Computer Use 代表的是 Agent 执行动作能力增强，它们是同一波“Agent 真正开始做事”的不同侧面。

------

## 8. Guardrails：Agent 真正上线前一定会被问到

### 8.1 Guardrails 是什么？

> Guardrails 本质上就是“护栏”。它的目标不是让模型更聪明，而是让模型别越界。

从 OpenAI Agents SDK 和 Guardrails Python 的官方文档看，Guardrails 常见作用包括：

- 检查输入是否合规
- 检查输出是否合规
- 拦截危险工具调用
- 在触发条件时直接中止流程

你可以把它理解成：

> 如果 Prompt 是软约束，Guardrails 就更像硬约束或半硬约束。

------

### 8.2 Guardrails 为什么现在特别重要？

因为 Agent 已经不只是聊天，而是会：

- 查内部数据
- 调工具
- 发消息
- 触发工作流
- 甚至操作 GUI

这意味着仅靠 Prompt 写一句“请注意安全”已经不够了。

真正成熟的系统必须有：

- 输入 guardrails
- 输出 guardrails
- 工具 guardrails
- 高风险动作审批

------

### 8.3 Guardrails 常见分层怎么讲？

最稳的答法是分三层：

1. 输入层
   - 是否涉敏
   - 是否越狱
   - 是否命中黑名单
2. 推理/工具层
   - 是否允许调用该工具
   - 参数是否合法
   - 是否需要人工确认
3. 输出层
   - 是否泄露敏感信息
   - 是否违反格式/合规要求
   - 是否包含危险建议

一句话：

> Guardrails 不是单点过滤器，而是要贯穿整条 agent 执行链。

------

### 8.4 OpenAI Agents SDK 里的 Guardrails 有什么特点？

根据官方文档，当前 SDK 里你至少要知道这些点：

- 有 input / output / tool guardrails
- 工具 guardrails 只适用于通过 `function_tool` 暴露的函数工具
- handoff 不走普通工具 guardrail pipeline
- 一旦触发 tripwire，会立刻中止 agent 执行

这几个点在面试里很加分，因为说明你不是只知道概念。

------

### 8.5 面试里怎么一句话讲清 Guardrails？

> Guardrails 是对 Agent 输入、输出和动作边界的系统化约束层。它不是替代 Prompt，而是在 Prompt 之外再加一层可执行、可审计、可中止的安全与合规控制。

------

## 9. Handoffs：多 Agent 时代的任务交接

### 9.1 Handoffs 是什么？

OpenAI Agents SDK 官方文档的定义很直接：

> Handoffs allow an agent to delegate tasks to another agent.

翻成面试语言：

> Handoff 就是一个 Agent 把任务转交给另一个更合适的 Agent。

------

### 9.2 Handoff 和普通 tool call 有什么区别？

> Tool call 更像“我去调用一个函数”；Handoff 更像“我把控制权或子任务委托给另一个 Agent”。

本质区别：

- tool 调用后控制权通常还在当前 agent
- handoff 后，新的 agent 会接着思考和执行

所以 handoff 更像 agent 编排，而不只是工具调用。

------

### 9.3 为什么 Handoffs 会成为高频概念？

因为现在很多系统已经不是“一个万能 agent”，而是：

- 客服 agent
- 报销 agent
- SQL agent
- Code agent
- 审批 agent

一旦你把系统拆成角色分工，handoff 就成为平台的核心能力。

------

### 9.4 Handoffs 的价值是什么？

- 专业化分工
- 降低单 agent 提示复杂度
- 更容易治理和评估
- 每个 agent 可以有独立 tools / policies / memory

这和微服务拆分的逻辑很像。

------

### 9.5 Handoffs 的风险是什么？

- 任务边界不清，来回踢皮球
- 成本和延迟上升
- 上下文丢失或失真
- 责任归属难追踪

所以面试时最好补一句：

> Handoff 不等于“多 Agent 就更强”，只有角色边界清晰时才值得做。

------

### 9.6 面试里怎么一句话讲清 Handoffs？

> Handoff 是多 Agent 系统里的任务委派机制。它解决的是“哪个 Agent 最适合处理当前子任务”，本质上比普通 tool call 更接近控制权转移和角色协作。

------

## 10. Tracing：为什么 Agent 平台必须有可观测性

### 10.1 Tracing 是什么？

OpenAI Agents SDK 官方文档把 tracing 定义为：

> 记录 agent 运行过程中 LLM generations、tool calls、handoffs、guardrails 和 custom events 的完整事件链。

换句话说：

> Trace 是一次 agent 工作流的完整轨迹，span 是其中的每个步骤。

------

### 10.2 为什么 Agent 特别需要 Tracing？

普通接口慢了，你看日志大概还能猜；

Agent 慢了，你可能根本不知道是：

- 模型想太久
- 工具慢
- handoff 太多
- guardrail 反复触发
- 某一步循环跑飞

所以 Agent 没有 tracing，基本就等于没有 debug 能力。

------

### 10.3 Trace 里最值得记录什么？

我建议你记这几个字段：

- workflow_name
- trace_id / group_id
- agent 名称
- 模型名
- tool 调用参数与耗时
- handoff 轨迹
- guardrail 命中情况
- token / cost
- 最终状态

------

### 10.4 OpenAI Agents SDK 当前 tracing 有哪些特点？

官方文档明确提到：

- tracing 默认开启
- 会自动跟踪 run、agent、generation、tool、guardrail、handoff 等 span
- 支持 custom trace processors
- ZDR 场景下 tracing 不可用

这说明 tracing 在官方设计里不是附加功能，而是默认能力。

------

### 10.5 面试里怎么一句话讲清 Tracing？

> Tracing 是 Agent 平台的可观测性底座，用来记录一次工作流从模型生成到工具调用、handoff、guardrail 的完整轨迹。没有 tracing，Agent 系统几乎没法稳定 debug 和治理。

------

## 11. Memory：Agent 为什么不能只有聊天历史

### 11.1 Memory 和“聊天上下文”有什么区别？

> 聊天上下文更像短期工作记忆；Memory 是更广义的长期状态。

也就是说：

- 当前会话的几轮对话，是短期上下文
- 用户偏好、历史任务结果、可复用事实，是 memory

------

### 11.2 Agent Memory 常见怎么分？

一个比较好答的框架是：

- `Working memory`：当前任务的临时状态
- `Semantic memory`：长期事实和知识
- `Episodic memory`：过去做过什么任务、结果如何
- `Procedural memory`：这类任务通常怎么做，接近 skill / policy

如果你能这样分，面试官通常会觉得你对 Agent 不是泛理解。

------

### 11.3 为什么 Memory 是前沿重点？

因为没有 memory，Agent 很难成为：

- 长期助手
- 个性化助手
- 持续学习型助手

LangGraph 当前官方文档也把 comprehensive memory 当成 agent orchestration 的核心能力之一。

------

### 11.4 Memory 最大的工程难点是什么？

- 写什么，不写什么
- 如何检索 memory
- 如何避免污染和幻觉传播
- 如何控制过期和版本
- 如何做隐私和删除

一句话：

> Memory 不是“多存点对话记录”，而是“设计状态如何沉淀、如何读回、如何过期”。

------

### 11.5 面试里怎么一句话讲清 Memory？

> Agent 的 memory 是跨步骤、跨会话保存状态和事实的机制。它和普通聊天历史不同，目标是让 agent 具备持续性、个性化和任务延续能力，但也会带来检索、污染、隐私和版本治理问题。

------

## 12. Durable Execution：为什么 Agent 需要“断点续跑”

### 12.1 Durable Execution 是什么？

LangGraph 官方文档把它定义得很清楚：

> 工作流在关键点保存进度，之后即使中断，也能从上次位置恢复执行。

如果换成面试语言：

> Durable execution 就是给 agent 工作流做“断点续跑”。

------

### 12.2 为什么它在 Agent 场景里很重要？

因为很多 Agent 任务是：

- 长时间运行
- 中途要人工审批
- 可能会失败或超时
- 不适合同步一口气完成

比如：

- 深度研究
- 报告生成
- 审批流
- 多工具长链任务

如果没有 durable execution，一挂就要从头再来，体验和成本都很差。

------

### 12.3 Durable Execution 的关键要求是什么？

根据 LangGraph 官方文档，要想真正做好 durable execution，至少要注意：

- 有 persistence / checkpointer
- 每个 workflow 有 thread id 或 execution id
- 设计成 deterministic + idempotent
- 把副作用操作包进 task 边界

这几个词是面试加分关键词。

------

### 12.4 Durable Execution 和普通重试有什么区别？

> 普通重试是“整个步骤再来一遍”；Durable execution 是“从保存点恢复，而不是全部重跑”。

这差别在长链 agent 里很大。

------

### 12.5 面试里怎么一句话讲清 Durable Execution？

> Durable execution 是让 Agent 工作流具备可暂停、可恢复、可跨故障续跑的能力，特别适合长任务、审批流和 Human-in-the-Loop 场景。

------

## 13. Background Mode + Webhooks：长任务 Agent 的产品化能力

### 13.1 Background Mode 是什么？

OpenAI 当前官方文档的定义非常明确：

> Background mode enables you to execute long-running tasks asynchronously, without having to worry about timeouts.

你可以这样答：

> Background mode 就是把长任务从同步请求改成异步执行，客户端之后再轮询或接回调。

------

### 13.2 为什么它重要？

因为现在很多推理模型和 agent 任务确实会跑很久。

典型场景：

- 深度研究
- 长报告生成
- 多阶段工具调用
- 大规模文档处理

如果还用同步接口硬扛，就容易：

- 超时
- 连接断开
- 前端体验差

------

### 13.3 Background Mode 现在的关键点有哪些？

根据 OpenAI 当前官方文档：

- 创建请求时可设置 `background=true`
- 可以轮询 response status
- 可以 cancel
- 也可以 background + stream 结合
- 需要 `store=true`
- background mode 不是 ZDR 兼容能力

这些都是现在能直接拿来回答的点。

------

### 13.4 Webhooks 在这里的作用是什么？

> Webhook 是“任务结束后我主动通知你”，不是让客户端一直轮询。

所以 background mode + webhooks 往往是更完整的组合：

- 后台异步执行
- 完成后回调
- 前端或业务系统再更新状态

------

### 13.5 面试里怎么一句话讲清 Background Mode？

> Background mode 是长任务 Agent 的异步执行能力，让深度推理和长链流程不再依赖单次同步连接。它和 polling / webhook 一起构成更适合生产环境的任务运行模式。

------

## 14. Realtime / Voice Agents：Agent 不再只靠文本交互

### 14.1 Realtime Agent 是什么？

> Realtime agent 就是能在低延迟事件流里持续接收音频、文本和中断信号，并实时响应的 agent。

和普通 chat completion 最大的区别不是“会说话”，而是：

- 实时双向流
- 可中断
- 持续会话状态
- 更接近电话和语音助手

------

### 14.2 为什么它重要？

因为很多未来 Agent 的主入口不是文本框，而是：

- 电话
- 语音助手
- 实时客服
- 陪练
- 辅助驾驶/控制台

所以 Realtime 本质上是在扩展 Agent 的入口形态。

------

### 14.3 Realtime 和普通流式输出有什么区别？

> 普通流式输出一般只是服务端持续吐文本 token；Realtime 是更完整的事件流，包含输入、输出、中断、状态和多模态流。

一句话：

> streaming 只是输出模式，realtime 更像交互协议。

------

### 14.4 Realtime Agent 的工程难点是什么？

- 中断处理
- turn-taking
- 语音延迟
- 状态同步
- 工具调用和语音体验的平衡

尤其语音场景里，一个 agent 如果工具调用太慢，就会显得“像死机”。

------

### 14.5 面试里怎么一句话讲清 Realtime Agent？

> Realtime agent 是面向实时事件流和语音交互的 agent 形态，它强调低延迟、可中断和持续状态管理，不只是把文本模型接个 TTS 那么简单。

------

## 15. Context Engineering：为什么它比 Prompt Engineering 更像下一阶段

### 15.1 什么是 Context Engineering？

虽然这不是单一官方标准名词，但它已经越来越常被用来概括下一阶段的 Prompt 工程实践。

你可以这样讲：

> Prompt Engineering 更多是在改一句提示词；Context Engineering 更像是在设计“模型这次到底能看到什么、按什么顺序看到、哪些内容能被缓存和复用”。

------

### 15.2 它为什么重要？

因为今天真实的模型上下文早就不只是一段 user prompt，而是：

- system instructions
- tools
- skills
- retrieval context
- memory
- UI state
- cached prefixes

所以：

> 现在真正影响效果的，往往不是某一句 prompt 写得妙不妙，而是整个上下文供给系统是否设计得合理。

------

### 15.3 Prompt Caching 为什么是 Context Engineering 的典型例子？

OpenAI 当前官方文档明确提到，缓存命中依赖 prompt 前缀一致。

这意味着：

- 静态前缀尽量稳定
- 变化内容尽量后置
- 工具说明和固定示例适合放前面

这已经不是单纯“写文案”，而是在做上下文架构设计。

------

### 15.4 面试里怎么一句话讲清 Context Engineering？

> Context engineering 是对模型输入上下文的系统性设计，包括 instructions、memory、retrieval、tools、skills 和缓存结构。它是 Prompt Engineering 的扩展版，也是 Agent 平台化之后更真实的工程问题。

------

## 16. 这些新概念怎么一起背？

建议你记成这套对应关系：

- `MCP`：能力接入协议
- `Skills`：能力打包方式
- `Guardrails`：安全约束层
- `Handoffs`：任务交接机制
- `Tracing`：可观测性底座
- `Memory`：持续状态能力
- `Durable Execution`：断点续跑能力
- `Background Mode`：长任务异步执行
- `Realtime`：实时交互能力
- `A2A`：Agent 协作协议
- `Computer Use`：界面操作能力
- `OpenClaw`：Agent Gateway / 平台化落地案例

再压缩成一句：

> MCP 让 Agent 接得上世界，Skills 让 Agent 学得会流程，Guardrails 和 Tracing 让 Agent 可控可查，Memory 和 Durable Execution 让 Agent 更持续，Background 和 Realtime 让 Agent 更像真实产品，A2A 让 Agent 彼此能协作，Computer Use 让 Agent 真能动手，OpenClaw 则说明这些能力开始进入常驻、多通道、自托管平台阶段。

------

## 17. 面试高频比较题

### 17.1 MCP vs Function Calling

> Function calling 是单次请求里的工具机制，MCP 是长期可复用的能力接入协议。

### 17.2 MCP vs Skills

> MCP 管“怎么接”，Skills 管“怎么用”。

### 17.3 Skills vs Prompt

> Prompt 偏一次性，Skill 偏版本化和复用。

### 17.4 A2A vs MCP

> A2A 是 Agent 对 Agent，MCP 是 Agent 对工具/数据。

### 17.5 OpenClaw vs 普通 Agent 框架

> 普通框架偏开发形态，OpenClaw 更偏常驻 Gateway 和多通道平台。

### 17.6 Computer Use vs Browser Automation

> Browser Automation 是脚本直接控制页面；Computer Use 是模型看界面、决策动作，再由执行器落地。

------

## 18. 这几个方向未来最可能怎么发展？

我建议你面试里这样判断，会比较像真正理解生态：

### 18.1 MCP 会继续平台化

- registry
- approval
- auth
- namespace
- governance

这些都会越来越重要。

### 18.2 Skills 会走向标准化和市场化

- 标准 manifest
- skill marketplace
- 版本管理
- 企业内部私有 skill 仓库

### 18.3 A2A 会推动 agent mesh

- Agent 不再只是单体
- 会开始像服务网格一样协作

### 18.4 Computer Use 会从实验走向受控生产

- 强隔离
- 人工审批
- 结构化动作
- 高风险域限制

### 18.5 OpenClaw 这类平台会把“个人 AI 助手”推向真实入口

- 手机消息入口
- 自托管
- 多设备
- 常驻化

但前提一定是安全治理跟上。

------

## 19. 最适合背的 16 句话

- MCP 是 Agent 接工具和数据的标准协议。
- MCP 不只是 tools，还有 resources 和 prompts。
- function calling 是机制，MCP 是生态协议。
- Skills 是带 `SKILL.md` 的能力 bundle。
- Skill 解决的是复用和流程固化，不只是提示词增强。
- Skills 和 MCP 经常一起用，一个管接入，一个管使用规范。
- Guardrails 是 Agent 的护栏层，不是单条 Prompt。
- Handoffs 解决的是多 Agent 之间的任务转交。
- Tracing 是 Agent 平台的可观测性底座。
- Memory 让 Agent 从会话机器人变成持续助手。
- Durable execution 让 Agent 可以暂停、恢复、续跑。
- Background mode 让长任务不必绑死在同步连接上。
- Realtime agent 面向实时事件流，不只是文本流式输出。
- Context engineering 是 Prompt engineering 的系统化升级。
- OpenClaw 是自托管、多通道、Agent-native 的 Gateway 平台。
- OpenClaw 代表 Agent 从 IDE 走向常驻化和现实入口。
- A2A 是 Agent 与 Agent 的通信协议。
- Computer Use 让模型通过 UI 直接操作软件。
- 能执行真实动作的 Agent，安全永远比能力更重要。
- 这些协议和平台的共同趋势，是让 Agent 生态从“散装 demo”变成“可互操作系统”。

------

## 20. 参考资料

### MCP

- MCP 介绍：<https://modelcontextprotocol.io/docs/getting-started/intro>
- MCP 规范：<https://modelcontextprotocol.io/specification/2024-11-05/index>
- MCP Registry：<https://modelcontextprotocol.io/registry/about>
- MCP Python SDK：<https://py.sdk.modelcontextprotocol.io/>

### OpenAI MCP / Skills / Agents / Computer Use

- OpenAI Agents：<https://developers.openai.com/api/docs/guides/agents>
- OpenAI MCP and Connectors：<https://developers.openai.com/api/docs/guides/tools-connectors-mcp>
- OpenAI Skills：<https://developers.openai.com/api/docs/guides/tools-skills>
- OpenAI Agents SDK MCP：<https://openai.github.io/openai-agents-python/mcp/>
- OpenAI Agents SDK Guardrails：<https://openai.github.io/openai-agents-python/guardrails/>
- OpenAI Agents SDK Handoffs：<https://openai.github.io/openai-agents-python/handoffs/>
- OpenAI Agents SDK Tracing：<https://openai.github.io/openai-agents-python/tracing/>
- OpenAI Guardrails Python：<https://openai.github.io/openai-guardrails-python/>
- OpenAI Background mode：<https://platform.openai.com/docs/guides/background>
- OpenAI Webhooks：<https://platform.openai.com/docs/guides/webhooks>
- OpenAI Realtime：<https://openai.github.io/openai-agents-python/realtime/guide/>
- OpenAI Computer Use：<https://developers.openai.com/api/docs/guides/tools-computer-use>
- OpenAI CUA 研究介绍：<https://openai.com/index/computer-using-agent/>
- OpenAI Prompt caching：<https://platform.openai.com/docs/guides/prompt-caching>

### Skills / OpenClaw / A2A

- OpenAI Skills 仓库：<https://github.com/openai/skills>
- OpenClaw 文档：<https://docs.openclaw.ai/index>
- OpenClaw 仓库：<https://github.com/openclaw/openclaw>
- A2A 规范：<https://google-a2a.github.io/A2A/specification/>

### RAG / Agent 前沿补充

- LangGraph 概览：<https://docs.langchain.com/oss/python/langgraph>
- LangGraph Memory：<https://docs.langchain.com/oss/python/langgraph/memory>
- LangGraph Durable Execution：<https://docs.langchain.com/oss/python/langgraph/durable-execution>
- Self-RAG：<https://arxiv.org/abs/2310.11511>
- Microsoft GraphRAG 介绍：<https://www.microsoft.com/en-us/research/blog/graphrag-new-tool-for-complex-data-discovery-now-on-github/>
