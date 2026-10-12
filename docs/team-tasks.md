# 新生队友任务边界

工程、共享组件、类型和样例现已建立。队友可使用下方对应模块 README 开始，完整筛选和展示完善仍由队友完成，不把核心开发进度绑定在新生模块上。

- A：[culture/README.md](../app/src/modules/culture/README.md)，组件 CultureModule 接收 entries、sources。
- B：[stories/README.md](../app/src/modules/stories/README.md)，组件 StoriesModule 接收 entries、sources，发出 selectPattern(PatternId)。
- C：[learning/glossary/README.md](../app/src/modules/learning/glossary/README.md)，组件 GlossaryModule 接收 terms、faqs、sources。

公共类型位于 app/src/shared/types.ts；样例数据位于 app/src/content/entries.ts；公共组件位于 app/src/shared/components/。数据由主系统读取后传入，队友不用自行连接内容仓库。在 app/ 使用 pnpm install --frozen-lockfile 和 pnpm dev 启动。

| 任务 | 范围 | 需要预先提供 | 完成标准 |
|---|---|---|---|
| A 染艺寻踪展示 | 资料卡片、分类筛选、点击详情、返回 | CultureEntry 类型、核实资料、公共卡片与详情样例 | 正确读取数据；筛选、空结果与返回可用；手机不溢出；来源可见 |
| B 白乡故事展示 | 故事列表、图文详情、相关纹样入口 | StoryEntry 类型、正文、图片、来源、导航事件 | 展示正确，详情可关闭，相关入口发出约定事件，无图片错位 |
| C 术语与常见问题 | 学习页内可展开的解释卡片 | 术语数据、问题与答案、公共折叠组件 | 展开/收起与键盘操作可用，手机布局正常 |

只有两项任务时，A/B 分配给队友，C 由主开发者完成。所有文化事实与素材许可由主开发者核对。

## 共用规则

- 只修改各自模块目录及约定的组件测试。
- 使用已有组件、类型与样式变量，不改依赖、全局 CSS、路由、store、engine 或存储服务。
- 数据从 props 或明确的内容读取接口获得，不直接修改创作状态。
- 导航或选择纹样通过类型明确的事件交给主系统。
- 使用真实提供的数据，不让 AI 编造历史、寓意、人物经历和采访。
- 接入前自行检查列表、详情、空状态、图片失败及手机布局。

## 通用 vibecoding 任务模板

在本项目已建立的 app/ 中完成指定展示模块。先阅读 AGENTS.md、模块说明、共享类型和已有样例。只改分配的目录，复用公共组件和样式变量，按提供的数据展示内容。不要新增依赖，不改路由、全局样式、store、engine 或数据存储。需要跳转或选择纹样时使用约定事件。完成后运行工程检查，并说明实现内容、修改文件和检查结果。

各模块 README 已提供目录、接口、样例位置和验收项，可与上述通用提示一并交给队友。当前最小样例不等于队友任务已经完成。
