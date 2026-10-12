# Bai Indigo · 染见白乡

白族扎染工艺数字体验与创新传播平台。通过网页布置扎结、折叠、浸染、氧化与拆线，生成靛蓝与白色的数字作品。

正式工程位于 app/，使用 Vue 3、TypeScript、Vite、Vue Router、Pinia、Canvas、Web Worker 和 IndexedDB。已实现画布编辑、制作流程、1024×1024 PNG 下载、最近两次会话对比、草稿恢复，以及本地作品自动保存、重命名、删除和继续编辑。demo/ 保留单文件交互原型。

作品与草稿保存在当前浏览器的网站数据中，清除网站数据会删除它们。当前不提供跨设备同步。方案文件导入导出、完整文化内容与正式工程发布仍未完成，状态见 [功能清单](docs/feature-list.md)。

## 本地启动

Node.js 24.11+，pnpm 11.25.0：

```sh
git clone https://github.com/ChadBi/bai-indigo.git
cd bai-indigo/app
pnpm install --frozen-lockfile
pnpm dev
```

在 app/ 执行 pnpm typecheck、pnpm test、pnpm build 检查；具体命令与限制见 [工程说明](app/README.md)。

## 团队协作

- [两位队员任务单](docs/member-tasks.md)：队员 1 染艺寻踪，队员 2 白乡故事。
- [Git 基础与 GitHub 协作](docs/git-basics.md)：clone、分支、提交、PR、同步与冲突处理。
- [AI coding 指南与 Prompt](docs/ai-coding-guide.md)：按模块开发、检查与交付。
- [接手入口](START_HERE.md)、[开发移交](HANDOFF.md)、[架构](docs/architecture.md)。

任务分支通过 PR 交给主开发者审查与合并，不直接向 main 推送。文化事实保留来源，原创体验模板与传统资料区分；参考文件与图片的公开可访问性不代表开放转载授权。
