# 游戏社区 App

一个基于 Expo Router、Supabase 和 Tavily 的游戏资讯社区应用。

## 主要能力

- 首页混合展示游戏资讯和用户帖子
- 访客身份自动初始化
- 用户可修改一次昵称并锁定
- 支持发帖、评论、点赞、搜索
- 提供基础管理台，可删除帖子和评论
- 支持从 Tavily 抓取游戏资讯并发布到社区

## 环境要求

- Node.js 18+
- npm 9+
- Expo / EAS 账号（正式构建时需要）

## 环境变量

项目依赖以下环境变量：

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
TAVILY_API_KEY=
EXPO_PUBLIC_ADMIN_PASSWORD=
```

### 变量说明

- `EXPO_PUBLIC_SUPABASE_URL`：Supabase 项目地址，前端和 API route 都会用到。
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`：Supabase 前端公开 key，只用于客户端公开访问。
- `TAVILY_API_KEY`：Tavily 服务端调用 key，只能放在服务端环境变量里。
- `EXPO_PUBLIC_ADMIN_PASSWORD`：当前基础管理台入口密码。

## 本地开发

安装依赖：

```bash
npm install
```

启动项目：

```bash
npm run start
```

常用命令：

```bash
npm run android
npm run ios
npm run web
npm run crawl:news
```

## 代码校验

上线前至少执行：

```bash
npm run lint
npm run typecheck
npm run verify
```

其中：

- `lint`：检查 Expo / ESLint 规范问题
- `typecheck`：检查 TypeScript 类型问题
- `verify`：串联执行 lint 和 typecheck

## EAS 配置

当前项目已绑定 EAS：

- Owner: `ajia114`
- Project ID: `d3f21fdc-37b1-4379-8c1e-89bc107df605`

如需重新绑定，可修改 [app.json](app.json) 里的 `expo.extra.eas.projectId`。

## 上线前建议重点验收

- 新访客自动生成身份
- 昵称修改并锁定
- 发帖成功且图片上传成功
- 评论、点赞、搜索链路正常
- “我的帖子”展示正常
- 管理台能查看并删除帖子、评论
- Supabase 数据写入与页面刷新保持一致

## 注意事项

- 当前项目仍需继续收紧 Supabase RLS 与高权限写操作路径，不能把前端密码页当成真正的后台权限系统。
- `service_role` key 绝不能放进客户端代码或公开环境变量。
