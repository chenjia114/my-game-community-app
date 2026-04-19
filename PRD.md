# GameHub - 游戏资讯社区 App

## 1. Executive Summary

### Problem Statement
游戏玩家缺乏一个集中的平台，既能获取最新的游戏资讯，又能参与社区讨论。目前玩家需要在多个平台之间切换：新闻网站看资讯、论坛/社交媒体参与讨论，体验分散且缺乏针对性。

### Proposed Solution
构建一个聚合型游戏资讯社区 App，集成两大核心功能：
1. **资讯聚合**：通过 Tavily API 爬取全网游戏新闻
2. **社区互动**：用户可发帖、评论、点赞，支持匿名参与

### Success Criteria
- [ ] 用户可在 App 内浏览游戏资讯（来源：Tavily 搜索）
- [ ] 用户可发布图文帖子（无需注册，填写昵称即可）
- [ ] 用户可对帖子发表评论
- [ ] 用户可点赞帖子和评论
- [ ] App 可在安卓设备上正常运行（MVP）
- [ ] 技术栈成本为 0（使用免费服务：Supabase + Tavily 免费额度）

---

## 2. User Experience & Functionality

### User Personas

| 角色 | 描述 | 核心需求 |
|------|------|----------|
| **资讯浏览者** | 只看新闻不发言的玩家 | 快速获取游戏新闻、简洁界面 |
| **社区活跃者** | 经常发帖讨论的玩家 | 发帖便捷、互动及时 |
| **匿名参与者** | 不愿注册但想发言的用户 | 快速匿名发帖 |

### User Stories

#### US-1: 浏览游戏资讯
**Story**: 作为用户，我想要浏览游戏资讯，以便了解最新的游戏新闻。
**Acceptance Criteria**:
- 资讯列表展示标题、来源、时间
- 点击资讯可查看详情
- 可跳转原文阅读完整内容

#### US-2: 发布图文帖子
**Story**: 作为用户，我想要发布图文帖子，与其他玩家分享我的观点。
**Acceptance Criteria**:
- 无需注册，只需填写昵称
- 支持文字内容和最多 4 张图片
- 发布后立即显示在社区列表

#### US-3: 评论帖子
**Story**: 作为用户，我想要评论帖子，与作者和其他玩家互动。
**Acceptance Criteria**:
- 在帖子详情页可发表评论
- 评论按时间倒序排列
- 匿名用户可评论（填写昵称）

#### US-4: 点赞互动
**Story**: 作为用户，我想要点赞帖子和评论，表示认可。
**Acceptance Criteria**:
- 点击心形图标即可点赞/取消点赞
- 点赞数实时更新
- 同一用户对同一内容只能点赞一次

#### US-5: 搜索内容
**Story**: 作为用户，我想要搜索资讯和帖子，快速找到我感兴趣的内容。
**Acceptance Criteria**:
- 支持关键词搜索
- 搜索结果同时包含资讯和帖子

### Non-Goals (本期不实现)
- 用户注册与登录系统
- 关注/粉丝系统
- 私信功能
- 帖子分类/标签
- 消息通知推送
- 用户头像上传

---

## 3. AI System Requirements

### Tool Requirements

| 工具 | 用途 | 成本 |
|------|------|------|
| **Tavily API** | 搜索游戏新闻资讯 | 免费额度：1000次/月 |
| **Supabase** | 数据库、存储、实时订阅 | 免费 Tier |

### Evaluation Strategy

**资讯质量**：
- Tavily 返回的结果应与游戏相关（通过标题/描述关键词验证）
- 过滤掉无关的新闻来源

**搜索相关性**：
- 搜索 "塞尔达" 应返回游戏相关内容
- 搜索结果按相关性排序

---

## 4. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  Home   │  │ Explore │  │  Post   │  │ Search  │      │
│  │ (News)  │  │ (Posts) │  │ Detail  │  │         │      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │
│       │            │            │            │            │
│  ┌────┴────────────┴────────────┴────────────┴────┐      │
│  │              Hooks (Business Logic)             │      │
│  │  useNews │ usePosts │ useComments │ useLikes   │      │
│  └──────────────────────┬───────────────────────────┘      │
│                        │                                   │
│  ┌─────────────────────┴───────────────────────────┐      │
│  │              lib/ (Utils)                       │      │
│  │       supabase.ts  │  tavily.ts  │  types.ts  │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  users  │  │  posts  │  │comments │  │  likes  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Supabase Storage                    │       │
│  │           (Image Upload for Posts)              │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Model (Supabase Schema)

```sql
-- 用户表 (支持匿名)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,        -- 设备/会话标识
    nickname TEXT NOT NULL,                  -- 昵称
    avatar_url TEXT,                         -- 头像 (可选)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 帖子表
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                     -- 标题
    content TEXT,                            -- 正文
    author_name TEXT NOT NULL,               -- 作者昵称
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    image_url TEXT,                          -- 图片 URL
    source_type TEXT DEFAULT 'user',         -- 'user'=用户帖, 'crawl'=爬取
    source_url TEXT,                         -- 资讯来源 URL
    likes_count INTEGER DEFAULT 0,            -- 点赞数 (冗余)
    comments_count INTEGER DEFAULT 0,         -- 评论数 (冗余)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 评论表
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,               -- 评论者昵称
    content TEXT NOT NULL,                   -- 评论内容
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 点赞表
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,               -- 点赞者标识
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT likes_unique_post UNIQUE (post_id, visitor_id),
    CONSTRAINT likes_unique_comment UNIQUE (comment_id, visitor_id)
);

-- 触发器：更新计数
CREATE OR REPLACE FUNCTION update_counts() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_likes_count
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION update_counts();

-- RLS 策略 (允许公开访问)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.posts FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.comments FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.likes FOR ALL USING (true);
```

### API Integration

#### Supabase
| 配置 | 值 |
|------|-----|
| URL | `https://bpqxjgrkutisqrumtycl.supabase.co` |
| Anon Key | `sb_publishable_yQLqQeNSjmyXgykmFmfOtQ_ZljLL2m7` |

#### Tavily API
| 配置 | 值 |
|------|-----|
| Endpoint | `https://api.tavily.com/search` |
| 用途 | 搜索游戏新闻 |
| 限制 | 免费 1000 次/月 |

### Security & Privacy

| 风险 | 缓解措施 |
|------|----------|
| 匿名用户发布不当内容 | 后续可添加内容审核（本期不实现） |
| 点赞刷单 | visitor_id 唯一约束防刷 |
| 敏感数据泄露 | 不存储密码/手机号等敏感信息 |

---

## 5. Risks & Roadmap

### Phased Rollout

| 阶段 | 内容 | 目标 |
|------|------|------|
| **MVP** | 资讯浏览 + 发帖 + 评论点赞 | 核心功能可用 |
| **v1.1** | 图片上传优化、搜索功能增强 | 体验提升 |
| **v2.0** | 用户系统、内容审核、通知推送 | 正式运营 |

### Technical Risks

| 风险 | 影响 | 缓解 |
|------|------|------|
| **Tavily API 配额用尽** | 资讯功能不可用 | 降级：显示"暂无资讯"提示 |
| **Supabase 免费额度超限** | 数据存储/读取受限 | 升级付费或数据清理 |
| **网络不稳定** | 加载慢/失败 | 添加错误提示和重试机制 |

---

## 6. Page Structure

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | 资讯列表 + 帖子混合流 |
| 探索 | `/explore` | 用户帖子列表 |
| 发帖 | `/post/create` | 创建图文帖子 |
| 帖子详情 | `/post/[id]` | 帖子内容 + 评论 |
| 资讯详情 | `/news/[id]` | 爬取资讯详情 |
| 搜索 | `/search` | 全局搜索 |

---

## 7. File Structure

```
my-app/
├── app/                      # 页面 (Expo Router)
│   ├── (tabs)/              # Tab 导航组
│   │   ├── index.tsx        # 首页 - 资讯+帖子
│   │   └── explore.tsx      # 探索 - 用户帖子
│   ├── post/
│   │   ├── [id].tsx         # 帖子详情
│   │   └── create.tsx       # 发帖页
│   ├── news/
│   │   └── [id].tsx         # 资讯详情
│   └── search.tsx           # 搜索页
├── components/               # UI 组件
│   ├── PostCard.tsx         # 帖子卡片
│   ├── NewsCard.tsx         # 资讯卡片
│   ├── CommentItem.tsx      # 评论项
│   └── LikeButton.tsx       # 点赞按钮
├── hooks/                   # 业务逻辑
│   ├── usePosts.ts          # 帖子 CRUD
│   ├── useComments.ts       # 评论 CRUD
│   ├── useLikes.ts          # 点赞功能
│   ├── useNews.ts           # Tavily 资讯
│   └── useVisitor.ts        # 匿名用户
├── lib/                     # 工具库
│   ├── supabase.ts          # Supabase 客户端
│   ├── tavily.ts           # Tavily API
│   └── types.ts            # 类型定义
└── constants/
    └── theme.ts             # 主题配置
```

---

*文档版本: v1.0 (MVP)*
*最后更新: 2026-04-16*
*成本: $0 (使用免费服务)*
