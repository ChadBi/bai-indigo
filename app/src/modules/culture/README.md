# 队友 A：染艺寻踪

当前两位队员中，队员 1 负责本模块。先读 [两位队员任务单](../../../../docs/member-tasks.md) 和 [AI coding 指南与提示词](../../../../docs/ai-coding-guide.md)。

## 修改范围

只修改本目录中的局部组件、纯函数和必要的纯函数测试。入口 `CultureModule.vue` 已接入 `/culture`。

## 已有接口

```ts
props: {
  entries: readonly CultureEntry[]
  sources: readonly SourceRef[]
}
```

共享类型在 `../../shared/types.ts`，样例在 `../../content/entries.ts`，由主系统负责读取。模块不直接操作路由、创作状态或存储。当前资料没有相关模板，不能自行补写传统纹样寓意。

现有样例展示 ContentCard、DetailDialog、SourceList 和 EmptyState 的用法，完成了最小列表与详情。

当前正式数据只有一条、一个分类，images 为空。先实现通用分类与展示逻辑；多分类纯逻辑测试使用本目录测试条目，不添加虚构文化内容。需要浏览器空列表、多分类或图片场景时，向主开发者提出临时验收数据需求。

## 你的任务

增加按 `category` 分类筛选、筛选后空状态、详情返回以及图文布局。图片数据由主开发者按 ContentImage 类型提供，展示复用 `shared/components/ContentImage.vue` 的图片失败反馈。文化事实与素材许可由主开发者核对，需要更多资料时提出所需数据，不自行编造。

允许在本目录新增局部组件、纯函数及必要的 *.test.ts，使用 style scoped 和现有 CSS 变量。公共卡片不满足分类或图文排版时，在本目录组合公共组件，不修改 shared。保持 entries、sources 接口，不直接调用 router、store、内容仓库或数据库。

## 验收

- 全部／分类切换、空列表和空筛选结果正常；使用 `entry.id` 作列表 key。
- 详情正文与来源可见，关闭后回到列表并恢复焦点。
- 390px 手机不溢出；按钮和详情关闭可用键盘操作。
- 在 app/ 运行 `pnpm typecheck`、`pnpm test`、`pnpm build`，报告实际结果及修改文件。

可将本 README 和项目 AGENTS.md 一起交给 vibecoding 工具，要求只在本目录工作。
