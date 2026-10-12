# 给新 Codex 对话的接手提示

以下正文可以直接作为新对话的第一条消息。

---

继续开发“染见白乡——白族扎染工艺数字体验与创新传播平台”，英文品牌名暂用 Bai Indigo，工程标识 bai-indigo。当前工作目录就是解压后的 bai-indigo 文件夹。

先阅读 AGENTS.md、START_HERE.md、HANDOFF.md、docs/architecture.md、docs/product-scope.md、docs/team-tasks.md 和 docs/demo-notes.md，再查看 demo/index.html。reference/ 中有最终 10 页项目书、竞赛原始指南、截图和导出的作品示例。

Demo 保留，正式 app/ 已实现完整编辑、制作、1024 PNG、两次会话对比、Worker、草稿及本地“我的作品”。每次完成自动保存，可重命名、删除、查看及继续编辑；继续制作另存新 ID。会话对比及未成功保存的结果刷新清空，已保存作品和草稿保留。Git main 已有基线和开发提交，没有远端。

团队已组齐，主要开发由我和你完成。给大一队友留两到三个独立小模块：染艺寻踪的资料展示、白乡故事的图文展示、工艺术语与常见问题区。你负责先搭好统一工程、公共组件、数据类型和样例，让他们能用 vibecoding 完成自己目录中的模块。核心引擎、状态、作品库、全局样式、路由与集成由我们完成。

按上一轮提出的架构基线推进：Vue 3 + TypeScript + Vite + Vue Router + Pinia，Canvas 扎染引擎，Web Worker 计算，结构化文化资料，IndexedDB 本地作品库，IGA Pages 静态部署。第一版围绕六个已确定模块完成创作与文化体验。

现在继续实现方案文件导入导出与备份，复用已实现的 Renderer、DraftRepository、WorksRepository 和公共组件，保留草稿异常保护及新制作另存规则。队友按 README 完善展示。不重新选题、重写项目书或开发登录、商城、社区、AI 对话、3D/VR。

我们重视靛蓝与白色的视觉、直观的制作过程和清楚的文化解释。正文直接介绍产品，避免“面向某某读者”“阅读重点”“待验证”等提示性文案。文化资料需有出处，不把原创体验模板冒充传统纹样。

当前 IGA 项目 ID 是 bvpmpkiedf；它的历史名为 pinanjia-demo，我已在控制台改名为 demo；域名是 https://demo.chaina1.com/。另一个 n7ph8ajy22 不是这个域名的发布目标。此次先做本地工程和验证，发布时再核对目标与域名缓存。

请先简短确认现状，然后继续本地开发与验证，及时说明已完成内容和剩余工作。
