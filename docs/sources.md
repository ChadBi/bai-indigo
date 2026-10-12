# 材料与技术依据

## 项目资料

- 中文项目名与六个模块来自本项目的前期讨论及最终项目书。
- `reference/project-brief.docx` 与 `.pdf` 是用户要求的 10 页最终修订版，可编辑 Word 文件与其对应预览。
- `reference/competition-guide-2026.pdf` 是用户补充的原始参赛指南。“民族文化 创新表达”作品赛项在 PDF 第 12 页／正文第 7 页。PDF 为图像内容，查阅时使用页面渲染，不依赖文本提取结果。
- 演示截图与导出作品由本项目的运行检查生成，不是传统扎染实物档案。
- 中国非物质文化遗产网《大理周城白族的扎染工艺》：https://www.ihchina.cn/news_1_details/11139.html
- 2026-10-12 核对该页面后，正式工程仅摘述周城、蓝白主色、扎花防染及色晕；未使用文章图片或其中医疗功效等说法。来源通过 SourceList 在文化详情和学习页显示。
- app/src/content/entries.ts 的“一处扎结，一片留白”是原创数字创作说明；展示的 PNG 来自本项目 Demo，非传统实物照片。四个模板均标注 original。

## 技术文档

- Vue 状态管理：https://vuejs.org/guide/scaling-up/state-management.html
- Vite：https://vite.dev/guide/
- Vue Router history 模式：https://router.vuejs.org/guide/essentials/history-mode.html
- IndexedDB：https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Web Workers：https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- Canvas toBlob：https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- IGA Pages 部署管理：https://docs.volcengine.com/docs/Station-wideacceleration/ManageIGAPagesDeployment?lang=zh
- 全站加速缓存刷新：https://docs.volcengine.com/docs/Station-wideacceleration/Cacherefresh-1?lang=zh

选择新的依赖版本或执行平台操作前，查阅当前环境与官方文档；本材料包不锁定尚未创建的正式 Vue 工程版本。
