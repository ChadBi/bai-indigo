# Bai Indigo 接手入口

中文名：染见白乡——白族扎染工艺数字体验与创新传播平台。

建议英文品牌名：**Bai Indigo**。完整英文标题：**Bai Indigo — A Digital Tie-Dye Experience of Bai Culture**。代码目录与项目标识使用 `bai-indigo`。英文名是本次移交采用的建议名称。

移交日期：2026-10-12。用户希望继续完成正式项目开发，并留出两到三个适合大一队友使用 vibecoding 完成的小模块。

## 先读这些文件

1. [HANDOFF.md](HANDOFF.md)：完成状态、用户要求、部署目标、接下来做什么。
2. [docs/architecture.md](docs/architecture.md)：正式系统的架构与实现顺序。
3. [docs/product-scope.md](docs/product-scope.md)：模块、页面与功能边界。
4. [docs/team-tasks.md](docs/team-tasks.md)：队友任务及合并要求。
5. [demo/index.html](demo/index.html)：可直接运行的掌上扎染 Demo。

项目书位于 `reference/project-brief.docx` 和 `reference/project-brief.pdf`。二者均为最终修订的 10 页版本。竞赛原始指南位于 `reference/competition-guide-2026.pdf`。

## 当前可以运行什么

正式工程位于 `app/`，已接通六个页面入口、完整画布编辑／制作流程、1024×1024 PNG 下载、两次染作对比、Worker 预览和 IndexedDB 草稿保存／恢复。在 `app/` 使用 Node.js 24.11+、pnpm 11.25.0：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

启动与检查详见 [app/README.md](app/README.md)。成品自动保存到本浏览器的“我的作品”，可重命名、删除、查看和继续编辑；继续制作另存新作品。两次会话对比刷新清空，已保存作品及草稿仍可恢复。保存失败的成品留在内存待保存列表，可重试或下载，刷新会丢失。队友从 [docs/team-tasks.md](docs/team-tasks.md) 和各模块 README 开始。

直接用浏览器打开 `demo/index.html`，无需构建或服务端。需要 HTTP 预览时，可在项目根目录使用可用的静态文件服务，例如：

```sh
python -m http.server 5173 --directory demo
```

访问 `http://127.0.0.1:5173`。Python 不是 Demo 的业务依赖，仅用于这个可选的预览方式。Codex 环境提供 bundled runtimes 时，先使用依赖定位工具取得运行路径。

`demo/` 保留完整交互原型；正式工程完成状态以 [HANDOFF.md](HANDOFF.md) 和实际检查记录为准，后续功能规划不代表已实现。

## 在新对话中继续

将整个 `bai-indigo` 文件夹作为工作目录，使用 [CODEX_PROMPT.md](CODEX_PROMPT.md) 中的接手提示。只发送项目书会缺少 Demo 源码、部署目标和开发边界。

原移交包没有 Git 历史。本地现已建立 `main` 分支，保留移交基线及后续工程提交；没有创建远端或推送。登录令牌、云端密钥、node_modules、构建及测试产物均不提交。IGA 的非敏感项目 ID 保存在 `deployment/iga-project-reference.json`，没有自动激活的 `.iga/project.json`。

## 文件目录

以下为原移交材料目录；新增正式工程在 `app/`，浏览器检查在 `tests/test-app.cjs`。`FILE_MANIFEST.json` 仅记录 2026-10-12 原移交包的文件哈希，不是当前仓库清单。

```text
bai-indigo/
  START_HERE.md
  HANDOFF.md
  CODEX_PROMPT.md
  AGENTS.md
  demo/index.html
  docs/architecture.md
  docs/product-scope.md
  docs/team-tasks.md
  docs/demo-notes.md
  docs/verification.md
  docs/sources.md
  deployment/iga-project-reference.json
  tests/package.json
  tests/test-demo.cjs
  reference/project-brief.docx
  reference/project-brief.pdf
  reference/competition-guide-2026.pdf
  reference/sample-dye-export.png
  reference/screenshots/
  FILE_MANIFEST.json
```
