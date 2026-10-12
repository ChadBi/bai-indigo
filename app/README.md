# Bai Indigo 正式工程

工程首版：Vue 3 + TypeScript + Vite + Vue Router + Pinia，Canvas 2D 显示、Web Worker 像素计算、IndexedDB 草稿。

## 启动与检查

使用 Node.js 24.11 或以上版本和 pnpm 11.25.0。所有命令在 `app/` 执行：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

默认开发地址 http://127.0.0.1:5173/。端口被占用时 Vite 会选择其他端口，以终端输出为准；自动检查可用 `--port 5173 --strictPort` 固定端口。预览生产构建通常为 http://127.0.0.1:4173/。

## 已实现

- 六个 hash 路由入口，默认进入掌上扎染；作品页如实说明作品库尚未实现。
- 原创四方纹、单花纹、折叠条纹、自由扎结模板；折叠、深浅与统一半径调整。
- Worker 计算 260×260 预览，主线程绘制 Canvas；取消旧任务、过滤旧响应、失败重试和退出清理。
- 参数修改后 500ms 自动保存草稿，可立即保存；同一浏览器刷新恢复，失效草稿保护、重置及存储失败重试。
- 文化、故事、术语的最小展示样例和公共组件。

## 尚未实现

布面加点、拖动、单点调整、删除、撤销、浸染／氧化／拆线动画、两次对比、PNG 导出、作品收藏／命名／删除／重新打开、方案文件导入导出、完整文化与教学内容。完整交互仍可从根目录 `demo/index.html` 运行。

引擎支持最高 1024×1024 计算，但本版本没有 PNG 导出按钮。数据库已有 `works` 对象仓库，但 `WorksRepository` 只有类型契约，没有作品存储适配器或作品 UI。

## 目录与接口

- `src/app/`：路由、统一布局和全局样式；主开发者维护。
- `src/shared/types.ts`：共享类型、版本、Renderer / DraftRepository / WorksRepository / ContentRepository。
- `src/shared/validation.ts`：参数与草稿校验、参数快照。
- `src/engine/`：纯像素引擎和 Worker；算法不依赖 Vue 或 DOM。
- `src/services/`：渲染、草稿及内容适配器。
- `src/stores/`：创作参数、恢复与保存状态。
- `src/content/`：主开发者核对的文化样例及原创模板。
- `src/modules/`：功能页面及队友模块。

## 草稿与版本

数据库名 `bai-indigo`，版本 1；`drafts` 用 `current` 键保存唯一草稿，`works` 为未来作品使用。草稿保存参数、模板选择、默认半径和 ISO 时间戳。算法版本 `demo-resist-v1`，数据版本 1。

加载完成前不启用编辑及自动保存。读取失败或版本不支持时，不覆盖原记录；版本不支持需用户明确点击“重置本地草稿”。读取失败后的编辑留在内存，重试成功时优先保留这些修改。保存事务串行提交，失败后不回滚界面参数。

修改后应等待“草稿已保存”或点击“立即保存草稿”再关闭页面。500ms 防抖尚未提交时立即关闭页面，最后一次修改可能丢失。未实现多标签页冲突合并、跨浏览器或跨设备保存。

## 浏览器检查

根目录 `tests/test-app.cjs` 使用 Playwright。安装方式见 `../docs/verification.md`，启动本工程后运行：

```sh
cd ../tests
npm install
npx playwright install chromium
npm run test:app
```

设置 `APP_URL` 可测试其他本地端口或生产预览；`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 可指定已有 Chromium。路径仅放在运行环境变量中，不能写进源码。

## 队友开始位置

先读根目录 AGENTS.md 和 `../docs/team-tasks.md`，再阅读各自模块 README。只改分配目录，复用 `src/shared/components/`，内容从 props 接收。路由、store、引擎、存储、依赖和全局样式由主开发者维护。

文化依据使用中国非物质文化遗产网《大理周城白族的扎染工艺》，来源在页面显示。样例故事与四个模板为原创；样例 PNG 是项目 Demo 的数字作品，不是传统实物照片。
