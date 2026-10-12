# 主开发者：工艺术语与常见问题

当前两位队员分别负责 culture 和 stories，本辅助区由主开发者完成，详见 [两位队员任务单](../../../../../docs/member-tasks.md)。

只修改本目录中的组件与约定测试。入口 `GlossaryModule.vue` 已嵌入 `/learning`，不新增大型独立系统。

```ts
props: {
  terms: readonly GlossaryEntry[]
  faqs: readonly FaqEntry[]
  sources: readonly SourceRef[]
}
```

共享类型在 `../../../shared/types.ts`，样例在 `../../../content/entries.ts`。通过 props 展示，模块不读写创作状态或数据库。

现有样例使用公共 Disclosure（原生 details/summary，Enter 和 Space 可展开收起）及 SourceList。

完善术语和问题的分组排版、空状态及手机布局。内容由主开发者核对；产品问题标为原创说明，文化解释保留来源。不要增加依赖、修改公共组件或全局样式。

验收：所有条目可展开收起，来源正确，空列表正常，Tab／Enter／Space 可操作，390px 不溢出。app/ 中运行 `pnpm typecheck`、`pnpm test`、`pnpm build` 并说明实际结果和修改文件。
