# 队友 B：白乡故事

## 修改范围与接口

只修改本目录中的组件与约定测试。入口 `StoriesModule.vue` 已接入 `/stories`。

```ts
props: { entries: readonly StoryEntry[]; sources: readonly SourceRef[] }
emit: selectPattern(id: PatternId)
```

共享类型在 `../../shared/types.ts`，样例在 `../../content/entries.ts`。相关模板通过 `selectPattern` 事件交给主系统，模块不直接操作路由或 store。

## 已有样例

最小列表、详情、图片失败反馈、来源列表与模板入口已可运行。故事“一处扎结，一片留白”为原创创作说明；图片是 Demo 的数字作品。不要改称为真实采访、传统实物或传统纹样。

## 你的任务

完善故事列表与图文详情布局，显示分类、内容性质、图片说明和来源。复用 ContentCard、DetailDialog、ContentImage、SourceList、BaseButton、EmptyState，使用全局样式变量。

## 验收

- 列表／详情／关闭、无内容、图片失败可用，段落和图片比例正确。
- 相关模板发出正确 `PatternId`，无 store 或路由依赖。
- 手机无溢出；关闭详情恢复焦点，键盘可操作。
- app/ 的类型、测试与构建检查通过，报告实际结果和修改文件。

资料与图片由主开发者提供，人物、历史、寓意和采访不能由 AI 编造。
