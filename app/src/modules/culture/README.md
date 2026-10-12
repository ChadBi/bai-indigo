# 队友 A：染艺寻踪

## 修改范围

只修改本目录中的 Vue 组件与约定的组件测试。入口 `CultureModule.vue` 已接入 `/culture`。

## 已有接口

```ts
props: {
  entries: readonly CultureEntry[]
  sources: readonly SourceRef[]
}
```

共享类型在 `../../shared/types.ts`，样例在 `../../content/entries.ts`，由主系统负责读取。模块不直接操作路由、创作状态或存储。当前资料没有相关模板，不能自行补写传统纹样寓意。

现有样例展示 ContentCard、DetailDialog、SourceList 和 EmptyState 的用法，完成了最小列表与详情。

## 你的任务

增加按 `category` 分类筛选、筛选后空状态、详情返回以及图文布局。新增图片只能使用主开发者提供的 `ContentImage`，复用公共 ContentImage 处理图片失败。文化事实与素材许可由主开发者核对，需要更多资料时提出所需数据，不自行编造。

## 验收

- 全部／分类切换、空列表和空筛选结果正常；使用 `entry.id` 作列表 key。
- 详情正文与来源可见，关闭后回到列表并恢复焦点。
- 390px 手机不溢出；按钮和详情关闭可用键盘操作。
- 在 app/ 运行 `pnpm typecheck`、`pnpm test`、`pnpm build`，报告实际结果及修改文件。

可将本 README 和项目 AGENTS.md 一起交给 vibecoding 工具，要求只在本目录工作。
