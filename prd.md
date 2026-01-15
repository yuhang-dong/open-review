# PRD：AI × Human Review Comments Layer（MVP）

## 1. 背景与动机

vibe coding 工具让“生成/修改代码”更快，但缺少一个统一的 **Review 工作流层** 来管理：

* 人类产生的 comments（需求、问题、风险、review 意见）
* AI 的解决回复（方案、步骤、注意事项）
* 人类的验收、复审、迭代

当前痛点：

* comments 零散、缺少批量流转与状态管理
* AI 输出与 comments 缺少结构化绑定（很难追踪“哪条问题 AI 回答了什么”）
* 没有统一的验收闭环（Resolve / Reopen / 追问）

---

## 2. 产品目标

### MVP 一句话

一个 VS Code 插件 + MCP Server：
**专注 comments 的创建、批量派发、AI 通过 MCP 回写、人与 AI 的验收闭环**。
（**不负责写代码、不负责 patch、也不 apply diff**。）

### MVP 不做

* 不生成/解析/apply patch
* 不接管 Cursor/Cline 的改代码入口
* 不承诺 comment 永久精准绑定语义（采用 git diff 心智）

---

## 3. 目标用户

* 使用 Cursor / Cline / Claude Code / Kiro 等 vibe coding 工具的开发者
* 熟悉 git diff / PR review 心智
* 想把 AI 当“执行者”，自己当“Reviewer/验收者”

---

## 4. 核心用户流程（MVP）

### 场景 1：创建 Comment（人 → 系统）

1. 用户在代码里选中 snippet 或停在某行
2. 执行 `Add Comment`
3. 右侧 Review Panel 生成一条 comment card（status=open）

**Comment 绑定策略：snippet anchor（git diff 心智）**

* 插入/删除其他行不影响有效性
* snippet 找不到则标记 outdated

---

### 场景 2：批量派发给 AI（人 → AI）

1. 用户在 Panel 里多选 comments → `Create Batch`
2. 点击 `Send Batch to AI`
3. 插件不再要求 copy/paste，而是：

   * 生成一个 “Batch 资源视图”（Resource）
   * AI 客户端可通过 MCP 读取该 batch（list + 每条 snippet/context）

> 也就是：**AI 从 MCP 读任务，不靠 prompt 粘贴。**

---

### 场景 3：AI 回写解决方案（AI → 系统）

1. AI 客户端通过 MCP 获取 batch / comments 内容
2. AI 为每条 comment 生成回复（解决思路、修改建议、实施步骤、风险点、验证建议等）
3. AI 通过 MCP tool 写回到对应 comment 的 thread：

* `post_ai_reply(commentId, content, fields…)`
* comment 状态自动从 `open/in_progress` → `needs_review`

**注意：MVP 的“AI 回复”是文本/结构化建议，不是 patch。**

---

### 场景 4：验收与迭代（人 ↔ AI）

* 用户查看 thread：

  * ✅ 满意 → `Resolve`
  * ❌ 不满意 → `Reply`（补充要求/指出问题）

    * 状态自动回 `open`（或 `in_progress`，取决于你是否自动派发）
* AI 读取新的 reply，再次回写，形成多轮 thread

---

## 5. MVP 功能范围

### 5.1 Review Panel（VS Code 右侧 UI）

* 列表视图（支持按 status/tag/batch 筛选）
* comment 详情视图：

  * snippet / 定位跳转
  * thread（human/ai/system messages）
  * 操作：Resolve / Reply / Reopen / Mark outdated
* 批量操作：

  * Create Batch
  * Send Batch to AI（本质是让 batch 可被 MCP 读取，并标记状态）

---

### 5.2 Comment 数据模型（MVP）

字段最小集合：

* `id`
* `uri`
* `anchor.snippet` + `anchor.normalized` + `anchorStatus(active/moved/outdated/ambiguous)`
* `status`: `open | in_progress | needs_review | resolved | outdated`
* `batchId?`
* `thread[]`: `{role: human|ai|system, content, ts}`

---

### 5.3 Batch（批次）

* `batchId`, `title`, `commentIds`, `status(draft|sent|done)`
* panel 支持 batch 分组与筛选
* “Send” 后可被 MCP 读取（Resources）

---

### 5.4 MCP Server（MVP 的关键交付）

#### Resources（AI 读取任务）

* `comments://open`
* `comments://batch/<batchId>`
* `comments://comment/<commentId>`
* `comments://file?uri=...`（可选）

#### Tools（AI 写回与改状态）

* `list_comments({status?, batchId?, uri?, tags?})`
* `post_ai_reply({commentId, content, meta?})`
* `set_comment_status({commentId, status})`
* `post_human_reply({commentId, content})`（可选：让 AI 也能代写 human note）
* `create_batch({title, commentIds})`（可选）

> MVP 最小闭环只要：`list/open|batch` + `post_ai_reply` + `set_status`。

---

## 6. MCP 一键安装（Onboarding）

### 目标

用户安装插件后可一键把 “yourtool-comments MCP server” 写入常用 vibe coding 工具的 MCP 配置：

* Cline
* Cursor
* Kiro
* Claude Code
* VS Code / Copilot MCP（如适用）

### MVP 实现方式

* 插件内命令：`Install MCP Everywhere`
* 自动探测配置文件位置 → 合并 `mcpServers` → 备份 → 写入
* 输出安装结果 summary（哪些成功、哪些缺配置文件/需创建、需重启提示）

---

## 7. 非功能性要求（NFR）

* 不修改用户源码
* comments 默认存 workspace 内（可 gitignore）
* 所有失败状态可解释：

  * outdated（上下文不匹配）≠ 数据丢失
* MCP 写入操作有可追踪记录（thread/system msg）

---

## 8. MVP 成功标准

* 用户能在 VS Code 内完成：

  * 创建一批 comments
  * 一键暴露给 AI（通过 MCP 读取）
  * AI 自动回写 replies
  * 用户 resolve / reply / reopen 的闭环
* 用户感知的核心价值：

  * “AI 改代码我用 Cursor/Cline”
  * “但所有 review 和验收都在这里统一管理”

---

# 9. 未来拓展点（Post-MVP 展望）

## 9.1 Patch 联动（明确非 MVP）

* AI 回写可附带 unified diff 作为 attachment
* Preview / Apply / Reject
* 与 comment 状态联动（applied → needs_review）

## 9.2 更强 Anchor（减少 outdated）

* symbol-level anchor（LSP/AST）
* git commit 级 anchor（与 blame/rename detection 联动）

## 9.3 多人协作

* comments 同步与权限
* 分配、@mention、reviewer 模式
* audit trail / approvals

## 9.4 AI Review Agent（自动生成 comments）

* AI 扫描仓库生成初始 review items
* 基于历史 resolve/reopen 学习团队偏好

## 9.5 可观测与度量

* batch throughput、平均迭代轮次
* 哪类 comment 最常 reopen（提示需求不清/提示质量问题）
