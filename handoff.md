# 交接说明

## 当前项目
- 项目目录：`my-app`
- 项目目标：做一个游戏资讯社区 App（Expo + Supabase + Tavily）
- 产品需求主文档：`PRD.md`

## 当前已知背景
- 用户要求：全程中文、解释尽量通俗、回复前加“主人”、代码保留必要注释。
- 外部 API / SDK / 第三方库如果要改动或新增调用，必须先查官方文档，不能猜字段名。
- 当前是前端连续推进阶段，适合先基于现有修改继续做，再集中汇报。
- 后续收尾标准不是“页面能跑就行”，而是按**真正上线**来补齐管理、安全、构建和验收。

## 当前工作区状态
工作区里已经有很多未提交修改，不是一个干净状态。重点包括：
- 已修改：`app/(tabs)/index.tsx`
- 已新增：`app/(tabs)/my.tsx`
- 已新增：`components/PostCard.tsx`
- 已新增：`components/NewsCard.tsx`
- 已新增：`components/CommentItem.tsx`
- 已新增：`components/LikeButton.tsx`
- 还有大量与帖子、评论、资讯、Supabase 相关的新增文件

说明：新对话继续工作时，不要假设这是从零开始的项目，要先基于现有代码继续。

## 当前最明确的计划来源
已有一个计划文件：
- `docs/superpowers/plans/2026-04-17-ui-components-unification.md`

这个计划的核心目标是：
- 统一 `PostCard`
- 统一 `NewsCard`
- 优化 `CommentItem`
- 修正 `LikeButton`
- 让首页和“我的”页接入共享组件

## 当前主计划来源
- 最新执行计划文件：`C:\Users\ajia\.claude\plans\chrome-for-testing-plan-abstract-flask.md`

这个计划的当前主线目标是：
1. 完成发帖、评论、点赞、昵称核心链路的服务端迁移（不只是提交，连读取、初始化、状态判断也一起迁）
2. 补齐管理后台删除链路，确保至少能稳定删帖子、删评论
3. 收紧 Supabase RLS / schema 权限，作为上线前安全底线
4. 补齐 `app.json`、`package.json` 的正式发布配置
5. 用 Chrome for Testing 完成发帖、删除、昵称、评论、点赞自测
6. 把 Chrome for Testing 自测流程沉淀成以后可复用的全局 skill

## 当前执行约束
- 每完成一个关键里程碑，就先更新 `my-app/handoff.md`，再继续下一步。
- 原因：当前 Claude / 插件会话已经崩溃过多次，必须持续把阶段进展写入 handoff，避免中断后丢状态。
- 新对话继续时，不要从零重做，要基于当前已有修改继续推进。

## 当前关键完成标准
- 发帖脚本可稳定创建测试帖子
- 管理台脚本可稳定删除测试帖子
- 至少完成一次昵称、评论、点赞真实页面自测
- `npm run verify` 通过
- 上线前必须处理项形成明确清单，并至少完成敏感信息与管理员密码暴露问题的整改方案

## 当前优先级（已按最新计划更新）
1. 先把发帖、评论、点赞、昵称相关“读路径”也迁到服务端
2. 再收口剩余旁路写逻辑与管理后台数据链路
3. 再收紧 Supabase RLS / schema 权限
4. 再补 `app.json`、`package.json` 正式发布配置与敏感信息治理
5. 再做 Chrome for Testing 全链路自测
6. 最后把 Chrome for Testing 自测方法沉淀成全局 skill

## 第一阶段最新进展（2026-04-19）
### 已完成
- `app/api/posts+api.ts` 已补齐 `GET`，支持帖子列表、单帖读取、搜索读取。
- `app/api/comments+api.ts` 已补齐 `GET`，支持按帖子读取评论和最新评论读取。
- `app/api/likes+api.ts` 已补齐 `GET`，支持单帖点赞状态查询和按访客读取点赞列表。
- `app/api/profile/nickname+api.ts` 已补齐 `GET` / `PUT`，支持读取用户资料和初始化访客昵称。
- `hooks/usePosts.ts`、`hooks/useComments.ts`、`hooks/useLikes.ts`、`hooks/useVisitor.ts` 已改成优先调用项目自己的 `/api/**`，不再直接承担核心读逻辑的 Supabase 查询。
- `app/post/[id].tsx` 已去掉直接读取帖子详情的 Supabase 调用，改为通过 `usePosts().fetchPost()` 走服务端 API。
- 已再次核对 `app/` 页面层和上述核心 Hook：当前发帖、评论、点赞、昵称这四条核心互动链路的页面读取与提交，已经统一优先走项目自己的 `/api/posts`、`/api/comments`、`/api/likes`、`/api/profile/nickname`。
- 已确认 `app/(tabs)/my.tsx` 里的管理台跳转不再直接在 `ProfileHeader` 内调用 `router`，而是改成通过 `onPressAdmin` 传入，之前 handoff 里记录的 `router` 作用域风险已基本消除。

### 当前仍需继续核对
- `hooks/usePosts.ts` / `hooks/useComments.ts` 里调用管理删除 API 的实现，和当前管理员密码校验方式还不一致，下一阶段要收口。
- `insertPosts` 目前只是临时改为走 `/api/news`，语义还需要下一阶段复核。
- `useNews.ts` 仍有直连 Supabase 的资讯读写逻辑，但它属于资讯旁路，不在本阶段“发帖、评论、点赞、昵称”核心互动链路范围内，放到下一阶段继续收口。

### 本阶段下一步
- 先执行 Chrome for Testing 自测，重点验证发帖、管理删除，以及昵称/评论/点赞真实页面链路。
- 自测通过后，再把这套 Chrome for Testing + Playwright 脚本方法沉淀成可复用的全局 skill。

## 管理后台链路最新进展（2026-04-19）
### 已完成
- `app/admin.tsx` 已去掉前端直接读取 `EXPO_PUBLIC_ADMIN_PASSWORD` 的密码比对，不再在客户端暴露“本地比对后放行”的逻辑。
- 管理台解锁现在改为把输入密码提交给服务端接口校验，再决定是否进入后台页面。
- `app/api/admin/posts+api.ts` 与 `app/api/admin/comments+api.ts` 已优先读取服务端私密变量 `ADMIN_PASSWORD`，同时兼容旧的 `EXPO_PUBLIC_ADMIN_PASSWORD` 作为过渡。
- 管理台发帖删除链路已确认服务端 `DELETE /api/admin/posts` 可正常删除测试帖子，当前主要问题不在接口本身，而在前端交互确认与反馈不够直观。
- `app/admin.tsx` 现已改成点击“删除帖子”后直接执行删除请求，不再额外弹二次确认；删除时显示“删除中...”，删除成功或失败都用 Toast 明确反馈，并在成功后主动刷新管理数据。
- `hooks/useNews.ts` 已去掉前端直连 Supabase 的资讯读写，管理台与首页的资讯读取/发布都改为走项目自己的 API。
- 已运行 `npm run typecheck`，当前通过。

### 已完成（2026-04-19 下午）
- **评论删除链路已修复**：`app/admin.tsx` 中 `handleDeleteComment` 函数，删除成功后原来只做本地 `setComments` 过滤，缺少 `loadAdminData()` 调用，导致评论列表和关联帖子的评论数无法同步刷新。现在已加上 `await loadAdminData()` 刷新全量数据，并统一用 `showToast` 替代 `Alert.alert` 反馈，与帖子删除保持一致。
- 修复后 `npm run typecheck` 通过，无新增类型错误。

### 已完成（2026-04-19 本次修复）
- **评论删除交互冲突已修复**：`components/CommentItem.tsx` 原来自己会先弹一次“删除评论”确认框，而 `app/admin.tsx` 的 `handleDeleteComment` 里又会再弹第二次确认框，形成“双重确认”。在 React Native Web / 浏览器环境下，这种嵌套确认很容易导致第二层确认或后续请求不稳定，看起来就像“评论无法删除”。
- 现在已把确认逻辑统一收口到 `app/admin.tsx`：`CommentItem` 点击“删除”时只负责把当前评论对象交给上层，不再自己弹框；真正的确认、调用 `/api/admin/comments`、Toast 提示、刷新列表，全部由管理页统一处理。
- 同时给 `handleDeleteComment` 增加了 `isBusy` 保护，避免正在刷新或删除时重复触发评论删除。
- 在你手动复测后，确认“仍然没法删除评论”，所以这次继续往下排查。
- **评论删除服务端接口已继续补强**：`app/api/admin/comments+api.ts` 现在删除前会先查询目标评论是否存在，并拿到 `post_id`；删除成功后还会同步把对应帖子 `comments_count` 减 1，避免评论虽然删掉了，但帖子评论数不回落，导致前端列表和详情页看起来像没删干净。
- 接口返回也补成了更明确的结构：成功时会返回 `success`、`deletedCommentId`、`postId`，失败时能区分“评论不存在/已删除”和普通服务端错误，便于下一步继续定位。
- 修复后已再次执行 `npm run typecheck`，通过。
- 用户再次手动复测后反馈：**仍然删不了，而且没有任何提示**。这说明问题不只是在服务端删除结果上，还有前端点击/反馈链路本身。
- 因此本轮继续补了前端交互层：`components/CommentItem.tsx` 里的“删除”按钮从 `TouchableOpacity` 改成了更适合 Web 点击场景的 `Pressable`，并加上最小点击区域与按下态，降低 React Native Web 下点了没反应的概率。
- 同时 `app/admin.tsx` 里的评论删除逻辑现在会在真正发请求前，先弹出一条 `Toast`：`正在删除评论...`。这样即使后端还报错，也能先判断“点击事件有没有触发到上层”。
- 评论删除成功后，现在不仅会 `loadAdminData()`，还会先本地把当前评论从 `comments` 列表移除，并同步把对应帖子的 `comments_count` 先减 1，再刷新全量数据，尽量避免用户看到“点了删除但界面没变化”。

### 仍待处理
- 管理删除接口目前仍通过密码随请求传给服务端，后续可继续升级成更稳的服务端会话校验。
- `hooks/usePosts.ts` / `hooks/useComments.ts` 里的删除方法仍未和当前管理密码链路统一，后续要决定是删除未用能力，还是补成显式传参。
- Chrome for Testing 自测与脚本自测方法虽然已有雏形，但**还没有真正沉淀成可复用 skill**。修完评论删除后，要立刻把这套方法整理成全局 skill。

## 当前自测资产与 skill 沉淀要求（2026-04-19）
### 已有资产
- 发帖自测脚本：`scripts/create_post_smoke_test.py`
- 管理台自测脚本：`scripts/admin_smoke_test.py`
- 发帖输出文件：`scripts/create_post_smoke_test_output.txt`
- 管理台输出文件：`scripts/admin_smoke_test_output.txt`
- 当前本地 Chrome for Testing / Playwright 浏览器路径：`C:\Users\ajia\Downloads\playwright-chromium\chrome-win64\chrome.exe`

### 当前自测现状
- 发帖链路已能通过脚本稳定创建帖子，并能验证 `/api/post-image`、`/api/posts` 请求。
- 发帖成功后的交互已补成 Toast + 回首页 + 首页刷新，最新帖子能出现在顶部。
- 帖子删除接口本身可用，管理台帖子删除也已能真实删除。
- 评论删除仍未打通，所以当前 Chrome for Testing 全链路验收还不能算完成。

### 下一次新对话必须继续做的事
1. 先修评论删除，让管理台至少满足“删帖子、删评论”都能稳定通过。
2. 再补完 Chrome for Testing / Playwright 对评论删除、昵称、评论、点赞的真实页面自测。
3. 自测通过后，**必须**把这套“Chrome for Testing + Playwright 脚本自测方法”写成一个可复用的全局 skill。

### skill 里至少要写清楚
- 前置条件：本地 dev server 已启动、Python / Playwright 可用、Chrome for Testing 路径可访问。
- 入口脚本：`scripts/create_post_smoke_test.py`、`scripts/admin_smoke_test.py`。
- 输出约定：日志文件路径、关键 `/api/**` 请求响应、断言结果、创建出的测试帖子标识。
- 适用场景：发帖、管理删除、表单提交流程、回归验证。
- 安装约束：如果安装/注册 skill，必须使用 `--global`，不能装到项目目录。

## 对照计划后的当前进展
### 1. `components/PostCard.tsx`
已完成的内容：
- 已经改成共享组件
- 已有 `variant: 'feed' | 'compact'`
- 已支持 `onPress`
- 已支持 `showAuthor`
- 已去掉正文摘要展示，只保留图片、标题、时间、点赞数、评论数
- 已同时覆盖首页信息流和“我的”页紧凑卡片两种布局

还需要留意的点：
- 样式里使用了 `boxShadow`，这在 React Native 环境里不一定稳妥，建议后续验证是否需要改成更兼容的阴影写法。
- 需要实际运行界面确认视觉效果和点击行为。

### 2. `app/(tabs)/index.tsx`
已完成的内容：
- 已接入共享 `NewsCard`
- 已接入共享 `PostCard`
- 已实现顶部随机资讯 + 混合信息流
- 新闻点击跳 `/news/[id]`
- 用户帖子点击跳 `/post/[id]`

还需要确认的点：
- 需要实际打开首页确认：顶部横向资讯、搜索入口、混合流顺序、卡片间距是否符合预期。

### 3. `app/(tabs)/my.tsx`
已完成的内容：
- 已接入共享 `PostCard variant="compact"`
- 已隐藏作者信息 `showAuthor={false}`
- 页面里还有昵称编辑、资料头部、统计信息、管理台入口等逻辑

还需要确认的点：
- `ProfileHeader` 组件内部用了 `router.push('/admin')`，但从当前已读片段看，`router` 是在 `MyScreen` 里定义的，不在 `ProfileHeader` 作用域内。
- 这很可能会导致运行时报错，属于近期优先检查项。

### 4. `components/NewsCard.tsx`
已完成的内容：
- 已实现横向资讯卡片
- 已支持封面图、标题、来源域名、点击跳转
- 已去掉复杂旧结构，保持轻量展示

还需要确认的点：
- 需要实际预览卡片尺寸、遮罩层可读性、无图占位效果。

### 5. `components/CommentItem.tsx`
已完成的内容：
- 已有头像、昵称、时间、删除确认
- 已切到暗色主题风格

还需要确认的点：
- 需要检查实际页面是否已经接入这个组件。
- 需要确认删除按钮样式和交互是否符合当前设计。

### 6. `components/LikeButton.tsx`
已完成的内容：
- 已做乐观更新
- `toggleLike()` 失败时会回滚点赞状态和计数
- 已在加载时禁用按钮

还需要确认的点：
- 需要结合 `hooks/useLikes.ts` 和真实页面验证：点赞成功、失败、快速重复点击时是否稳定。

## 按“真正上线”计算，当前最关键还差 4 步

### 1. 补最小管理后台
目标：至少能**删帖子、删评论**，不然上线后没人处理违规内容。

最低要求：
- 有最小管理员入口
- 能看到帖子列表
- 能删除帖子
- 能看到评论列表或帖子详情里的评论
- 能删除评论
- 删除后前端列表能刷新

建议优先检查：
- `app/admin.tsx`
- `app/post/[id].tsx`
- `hooks/usePosts.ts`
- `hooks/useComments.ts`
- `lib/` 下 Supabase 相关封装

### 2. 收紧 Supabase 权限
目标：把现在接近全开放的 RLS 改成上线可接受的最小权限。

重点：
- 重点看 `schema.sql` 或 Supabase migration 文件
- 现在如果是 `Allow all` 这类策略，正式上线风险很大
- 至少要区分：公开读、访客可写自己的内容、管理员可删除/管理
- 尤其要检查：`posts`、`comments`、`likes`、`users` 四张表

注意：
- 这一步属于真正上线前的安全底线，优先级非常高。
- 如果涉及 Supabase 策略、SQL、Auth、RLS 写法，必须先查官方文档再改。

### 3. 补齐发布配置
目标：让项目从“本地开发态”变成“可正式构建态”。

重点检查：
- `app.json` 里现在还是 `local-dev`，需要改成更接近正式发布的配置
- `package.json` 里缺少 `typecheck`
- 需要补充正式构建相关脚本
- 检查是否还缺环境变量说明或构建前检查项

最低要求：
- `npm run typecheck` 可用
- 有明确的正式构建脚本
- `app.json` / Expo 配置不再停留在本地开发命名

### 4. 做一次完整上线验收
目标：把用户完整链路走一遍，确认不是“局部能用”，而是“整条链路能用”。

验收链路至少包括：
- 新访客进入
- 修改昵称
- 发帖
- 评论
- 点赞
- 搜索
- 查看“我的帖子”
- 管理员删除帖子
- 管理员删除评论

验收时要特别看：
- 数据是否真实写入 Supabase
- 页面刷新后数据是否一致
- 删除后列表是否同步更新
- 空状态、失败提示、重复点击是否正常

## 建议的真实优先级
如果新对话要继续，不要只盯着 UI 微调，建议按这个顺序推进：

1. **先修明显 bug**
   - 先检查 `app/(tabs)/my.tsx` 里 `ProfileHeader` 的 `router` 作用域问题。

2. **补最小管理后台**
   - 先保证上线后有人能删帖子、删评论。

3. **收紧 Supabase RLS / schema 权限**
   - 这是上线安全底线。

4. **补发布配置和脚本**
   - 把 `app.json`、`package.json` 补到正式构建可用。

5. **做完整上线验收**
   - 把新访客到管理员删除这一整条链路跑通。

6. **最后再做 UI 小修**
   - 样式阴影、间距、卡片细节放到最后收口。

## 新对话建议开场词
如果要在新对话继续，建议直接贴下面这段：

```text
请先阅读 `handoff.md`，再扫描当前工作区，按“真正上线”标准继续收尾，不要只做 UI 微调。
当前最关键的 4 件事是：
1. 补最小管理后台（至少删帖子、删评论）
2. 收紧 Supabase RLS / schema 权限
3. 补齐 app.json 和 package.json 的正式发布配置
4. 做一次完整上线验收（新访客、改名、发帖、评论、点赞、搜索、我的帖子、管理员删除，全链路验证）

另外请先顺手检查 `app/(tabs)/my.tsx` 里 `ProfileHeader` 是否有 `router` 作用域问题。
请全程中文，用通俗的话解释，并基于现有修改继续，不要从零重做。
```
