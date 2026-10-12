# 队友 B：白乡故事

当前两位队员中，队员 2 负责本模块。先读 [两位队员任务单](../../../../docs/member-tasks.md) 和 [AI coding 指南与提示词](../../../../docs/ai-coding-guide.md)。

## 修改范围与接口

只修改本目录中的局部组件、纯函数和必要的纯函数测试。入口 `StoriesModule.vue` 已接入 `/stories`。

```ts
props: { entries: readonly StoryEntry[]; sources: readonly SourceRef[] }
emit: selectPattern(id: PatternId)
```

共享类型在 `../../shared/types.ts`，样例在 `../../content/entries.ts`。相关模板通过 `selectPattern` 事件交给主系统，模块不直接操作路由或 store。

## 已有样例

最小列表、详情、图片失败反馈、来源列表与模板入口已可运行。故事“一处扎结，一片留白”为原创创作说明；图片是 Demo 的数字作品。不要改称为真实采访、传统实物或传统纹样。

当前正式数据只有一条，配一张数字作品图，关联 flower 模板。无内容、多图、坏图和无关联的浏览器场景需与主开发者配合检查；不能用这一条样例代表全部场景通过。

## 你的任务

完善故事列表与图文详情布局，显示分类、内容性质、图片说明和来源。复用 ContentCard、DetailDialog、ContentImage、SourceList、BaseButton、EmptyState，使用全局样式变量。

允许在本目录新增局部组件、纯函数及必要的 *.test.ts，使用 style scoped 和现有 CSS 变量。公共卡片不够用时，在本目录组合公共组件，不修改 shared。保持 entries、sources props 和 selectPattern 事件，不直接调用内容仓库、router、store 或数据库。

## 验收

- 列表／详情／关闭、无内容、图片失败可用，段落和图片比例正确。
- 相关模板发出正确 `PatternId`，无 store 或路由依赖。
- 手机无溢出；关闭详情恢复焦点，键盘可操作。
- app/ 的类型、测试与构建检查通过，报告实际结果和修改文件。

资料与图片由主开发者提供，人物、历史、寓意和采访不能由 AI 编造。
