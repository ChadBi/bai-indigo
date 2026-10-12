# Git 基础与 GitHub 协作

团队仓库：[ChadBi/bai-indigo](https://github.com/ChadBi/bai-indigo)，公开可读。队员 1 负责 culture，队员 2 负责 stories，任务见 [member-tasks.md](member-tasks.md)。以下 Git 命令在 clone 后的工程根目录执行；pnpm 命令在 app/ 执行。

## 1. 先认识这些概念

| 名称 | 含义 | 在本项目中的例子 |
|---|---|---|
| Git | 在电脑上记录代码版本的工具 | 查看改动、提交、分支与合并 |
| GitHub | 托管远端仓库和协作记录的网站 | ChadBi/bai-indigo |
| 仓库 repository | 项目文件及 Git 历史 | clone 后的 bai-indigo 文件夹 |
| 工作区 | 正在编辑的文件 | 修改 CultureModule.vue |
| 暂存区 stage | 准备放进下一次提交的改动 | git add 自己的目录 |
| 提交 commit | 一次带说明的版本记录 | “增加文化分类筛选” |
| 分支 branch | 一条独立的开发记录 | main、member-culture |
| origin | 本地对远端仓库的简称 | 指向团队 GitHub 仓库 |
| origin/main | 本地最近获取到的远端 main 记录 | fetch 后更新，不是实时远端 |
| push | 将本地提交上传到远端分支 | 上传 member-culture |
| Pull Request（PR） | 请求审查并合并一个分支的改动 | member-culture → main |
| merge | 将另一条分支的改动合入当前分支 | 主开发者合并已审查 PR |

保存文件不会自动形成 commit，commit 也不会自动上传。通常顺序为：编辑文件 → add → commit → push → 创建 PR → 审查 → 合并。

main 放团队已集成的代码。队员在自己的任务分支开发，push 不会自动把该分支合并进 main。GitHub PR 与 git pull 是两件事：PR 用于协作审查，pull 用于获取并整合远端更新。

## 2. 首次准备

安装 Git，并准备自己的 GitHub 账号。Git 安装来源：[git-scm.com](https://git-scm.com/downloads)。Node.js 与 pnpm 版本及启动方法见 [AI coding 指南](ai-coding-guide.md)。

主开发者先邀请两位队员为仓库协作者，队员接受邀请后才能推送分支。公开仓库无需邀请即可 clone，但推送需要写入权限。本教程采用同仓库分支流程，不要求队员另建仓库或 fork。

在你存放项目的父目录执行，现有 bai-indigo 文件夹不覆盖：

```sh
git clone https://github.com/ChadBi/bai-indigo.git
cd bai-indigo
git status
git remote -v
```

确认 origin 的地址为 `https://github.com/ChadBi/bai-indigo.git`。clone 只做一次，之后通过更新命令同步，不每天重新下载 ZIP，也不在 app/ 内重新 git init。

提交需要作者姓名和邮箱，在仓库根目录配置，只影响本仓库。下面是示例，替换为自己的信息再执行：

```sh
git config user.name "你的名字或 GitHub 用户名"
git config user.email "你的提交邮箱"
```

提交邮箱可能出现在公开历史中；可使用 GitHub 账号提供的 noreply 邮箱，从自己的账号邮箱设置中复制完整地址，不照抄他人的地址。作者配置不等于登录认证。

首次 push 时按 Git Credential Manager 的登录提示完成认证；凭据保存在认证工具中。不要把密码或令牌放进远端 URL、脚本、AI 提示词或代码。如果认证失败，保留不含凭据的报错，请主开发者协助确认账号和权限。

## 3. 创建自己的任务分支

先检查工作区。`git status --short` 无输出表示没有待提交的改动；有输出时先理解并保存自己的改动，不直接切换或清理。

工作区干净后，更新 main：

```sh
git switch main
git pull --ff-only origin main
```

`--ff-only` 要求本地 main 能直接前进到远端记录，避免意外产生合并提交。如果失败，先检查原因，不去掉选项“试到成功”，也不强制重置。

队员 1 的首项任务：

```sh
git switch -c member-culture
```

队员 2 的首项任务：

```sh
git switch -c member-stories
```

每人只执行自己对应的命令。`-c` 表示创建并切换；分支已经存在且属于当前未完成任务时，用 `git switch member-culture` 或 `git switch member-stories` 返回它，不重新创建。

用下面的命令确认当前位置，再让 AI 开发：

```sh
git branch --show-current
git status --short
```

开始开发后继续在任务分支工作。不要每天从 main 重建同名分支，也不要在 main 上写功能。

## 4. 做一个小改动并提交

一次 commit 记录一个能解释清楚的小步骤，例如“增加文化分类筛选”或“修复故事图片布局”。避免把无关改动混在一起，也不需要每改一行都提交。

先在 app/ 检查，再回根目录：

```sh
cd app
pnpm typecheck
pnpm test
pnpm build
cd ..
```

再查看改动：

```sh
git status --short
git diff --stat
git diff
```

status 中常见的 M 是修改、?? 是未跟踪的新文件、A 是新增、D 是删除。普通 diff 查看未暂存的已跟踪文件改动；新文件还要打开检查，不能只看 diff 判断内容。暂存后的内容用 `git diff --cached` 查看。

队员 1 只暂存 culture：

```sh
git add app/src/modules/culture/
git diff --cached --stat
git diff --cached
git commit -m "feat: 增加文化资料分类筛选"
```

队员 2 使用自己的 stories 目录：

```sh
git add app/src/modules/stories/
git diff --cached --stat
git diff --cached
git commit -m "feat: 完善故事图文详情"
```

先核对暂存内容，再执行 commit。不要使用 `git add .` 把环境或他人的改动一起纳入。add 后又修改文件，需要再次 add 才会将新修改放入该提交。

项目 .gitignore 已忽略 node_modules、app/dist、测试输出、.env 和 .iga 等文件，锁文件正常保留。忽略规则不会让已被 Git 跟踪的文件自动消失，也不能清除历史中的秘密；发现不应上传的文件先停止推送，交给主开发者处理。

## 5. 推送并创建 PR

队员 1 首次推送：

```sh
git push -u origin member-culture
```

队员 2 首次推送：

```sh
git push -u origin member-stories
```

`-u` 建立本地任务分支与远端同名分支的关联。之后在该分支可执行 `git push`。推送前检查当前分支与远端，避免上传到错误目标；不推送 main、不使用 --force。

进入仓库的 Pull requests 页面，新建 PR，base 选择 main，compare 选择自己的任务分支。检查 Files changed 只包含分配目录；尚未完成可建立 Draft PR。

标题写具体功能，例如“完善染艺寻踪分类与详情”。正文可复制以下模板，并填写真实结果：

```text
完成的功能：
修改范围：
验证命令与实际结果：
浏览器检查（桌面、390px、键盘）：
截图：
资料来源／图片许可或需要主开发者补充的数据：
未完成项：
```

请求主开发者审查，不自行合并。收到反馈后在同一任务分支修改、检查、commit、push，原 PR 自动更新，不为一次修复另开 PR。只有新增的独立任务才使用新分支与新 PR。

目前本地检查不等于 GitHub 自动检查；项目尚未配置 GitHub Actions，不写“CI 已通过”。PR 合并后的整体回归由主开发者负责。以上流程采用 [GitHub 官方分支与 PR 协作说明](https://docs.github.com/en/get-started/using-github/github-flow)。

## 6. 开发中怎样同步 main

队友的 PR 合并后，你的任务分支不会自动得到那部分代码。需要同步时，先提交自己已完成的改动，确认工作区干净，然后在自己的任务分支执行：

```sh
git fetch origin
git merge origin/main
```

fetch 下载远端记录，不改变工作区；merge 将最新 main 合入当前任务分支。先确认自己仍在任务分支，合并后检查并推送自己的分支。如果主开发者还没有合并任何新代码，不必反复同步。

本团队初学阶段使用 merge，不要求 rebase。不要把同步误写为 `git merge member-stories`，也不要在未读报错时强制覆盖远端。

## 7. 遇到冲突

两边修改同一处，Git 无法自动判断时会出现冲突。先执行 git status，确认冲突文件。文件可能含有如下标记：

| 标记 | 含义 |
|---|---|
| `<<<<<<< HEAD` | 后面是当前任务分支的内容 |
| `=======` | 两边内容的分界 |
| `>>>>>>> origin/main` | 来自 main 的内容在这里结束 |

先理解两边的功能，再整理为正确的完整内容并删除标记，不机械地选“全部保留我的”。冲突在共享类型、全局样式、路由、数据或另一个队员目录时，请主开发者协助，不自行决定丢弃哪一方。

自己的目录中解决冲突后，逐个暂存已确认的冲突文件，例如：

```sh
git add app/src/modules/culture/CultureModule.vue
git diff --cached
git status
```

其他冲突文件也要逐个处理。随后在 app/ 重跑检查，回根目录执行 `git commit -m "merge: 同步 main 并解决文化模块冲突"`，再 push 自己的分支。队员 2 替换为实际冲突文件和提交说明。

如果这次 merge 开始前工作区干净，想放弃本次冲突合并、返回合并前，可执行 `git merge --abort`。它会撤回此次合并及期间的冲突解决编辑；先备份需要保留的手工修改。如果命令失败或开始前已有改动，停止并找主开发者，不使用 reset --hard。

## 8. PR 合并以后

主开发者确认 PR 已合并后，工作区干净时执行：

```sh
git switch main
git pull --ff-only origin main
```

下一项任务使用新的、描述明确的分支，例如：

```sh
git switch -c culture-image-layout
```

不继续往已合并任务的旧分支提交。旧分支清理由主开发者安排，初学阶段可以保留本地旧分支，不必使用强制删除命令。

## 9. 常见问题与安全修正

| 情况 | 处理方法 |
|---|---|
| not a git repository | 核对当前目录是否为 clone 的工程；不重新 git init |
| 分支已存在 | 检查它是否是当前任务，确认后用 git switch 返回 |
| 无法 commit，提示身份未知 | 按第 2 节配置自己的姓名与邮箱 |
| 没有 upstream | 首次用 git push -u origin 自己的分支名 |
| push 被拒绝 | 核对远端、账号、协作者邀请和报错；不要 --force |
| 远端任务分支有新提交 | 工作区干净时 fetch，由主开发者协助确认并合入对应远端任务分支 |
| pull --ff-only 失败 | 可能在本地 main 产生了独有提交；停止并请主开发者检查 |
| 不小心在 main 编辑但还未提交 | 不丢弃文件，让主开发者协助转到新分支 |
| PR 出现其他目录改动 | 检查提交来源，不直接提交或合并；请主开发者协助整理 |

误把一个文件 add 进暂存区，但还没 commit，可取消暂存而保留文件编辑，例如：

```sh
git restore --staged app/src/modules/culture/CultureModule.vue
```

不要漏掉 --staged：普通 git restore 文件会还原工作区内容，可能丢掉未提交编辑。两者含义见 [Git restore 官方文档](https://git-scm.com/docs/git-restore)。已推送提交有问题时，通过新的修复提交和 PR 处理，不改写公开历史。

常用查看命令：

```sh
git status
git branch --show-current
git diff
git diff --cached
git log --oneline -5
git remote -v
```

让 AI 协助时先要求它解释当前分支、工作区和拟执行操作，不把“修好 Git”当成允许丢弃文件、强制推送或重写历史。clone、status 和 diff 的读取操作可先执行，commit、push 和 PR 在你核对文件与目标后明确授权。

## 10. 主开发者的仓库管理

- 邀请两位队员为协作者，确认其接受邀请，再开始分支推送。
- 按仓库设置可用能力配置 main 的 PR 审查要求，关闭强制推送与删除；尚未配置时团队仍按“不直接推送 main”约定执行。本次文档不代表保护规则已经启用。
- 审查 PR 的目录范围、数据接口、来源、图片许可和真实检查结果，必要时要求修正。
- 合并后执行整体回归，再通知队员更新 main。GitHub 代码仓库与 IGA 发布是两件事；push 不等于网站上线。
- 仓库公开不等于参考材料拥有开源许可。源码许可证与参考文件的转载许可应分别确认，不让队员擅自给全部文件添加同一种授权。

更新日期：2026-10-12。
