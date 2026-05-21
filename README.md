# 投递追踪器 Web 应用

从单 HTML 版迁移到 Next.js + Supabase 的求职投递追踪器。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Supabase Auth / PostgreSQL / Storage

## 本地启动

1. 复制环境变量示例：

```bash
cp .env.local.example .env.local
```

2. 在 `.env.local` 填入 Supabase 控制台 `Settings > API` 中的值：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. 安装依赖并启动：

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

## Supabase 初始化

按顺序执行 `supabase/migrations` 里的 SQL：

- `001_init.sql`：创建 `inbox`、`applications`、`resumes`、`user_config` 四张表并启用 RLS
- `002_resumes_storage.sql`：创建私有 `resumes` Storage bucket，并限制用户只能访问 `{user_id}/...` 路径下的简历文件

还需要在 Supabase Auth 中开启 Google OAuth Provider，并在 Google Cloud Console 配置回调地址：

```text
https://你的项目.supabase.co/auth/v1/callback
```

## Phase 0 骨架

当前已包含基础路由、登录页、OAuth 回调、Supabase SSR 客户端、认证代理、侧边栏和数据看板骨架。未登录访问业务页面会跳转到 `/login`，登录成功后回到数据看板。
