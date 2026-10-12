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

直接用浏览器打开 `demo/index.html`，无需构建或服务端。需要 HTTP 预览时，可在项目根目录使用可用的静态文件服务，例如：

```sh
python -m http.server 5173 --directory demo
```

访问 `http://127.0.0.1:5173`。Python 不是 Demo 的业务依赖，仅用于这个可选的预览方式。Codex 环境提供 bundled runtimes 时，先使用依赖定位工具取得运行路径。

**正式 Vue 工程尚未建立。** `demo/` 是可复用的交互原型；`docs/` 是后续工程的规划，不代表已完成功能。

## 在新对话中继续

将整个 `bai-indigo` 文件夹作为工作目录，使用 [CODEX_PROMPT.md](CODEX_PROMPT.md) 中的接手提示。只发送项目书会缺少 Demo 源码、部署目标和开发边界。

包内没有 Git 历史、登录令牌、云端密钥、node_modules、旧预览访问参数或原机器的绝对路径配置。IGA 的非敏感项目 ID 保存在 `deployment/iga-project-reference.json`，没有自动激活的 `.iga/project.json`。

## 文件目录

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
