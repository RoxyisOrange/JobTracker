@AGENTS.md

# 投递追踪器 — Web 应用

Next.js 16 (App Router) + Supabase + Tailwind CSS v4 + TypeScript

## 关键约定

- **proxy.ts**（根目录）取代已弃用的 `middleware.ts`，导出 `proxy` 函数
- **`cookies()`** 是异步函数，必须 `await`
- 所有页面路由在 `src/app/`，`@/*` 路径别名指向 `src/`
- 配色：主色 `#3b82f6`，背景 `#f0f5fa`，卡片白色

## 目录结构

```
src/
  app/           路由页面 + API routes
  components/    UI 组件
  lib/
    supabase/    client.ts（浏览器）/ server.ts（服务端）/ middleware.ts（proxy 辅助）
    types.ts     TypeScript 类型
    constants.ts 平台/状态/批次等常量
    utils.ts     工具函数
    temperature.ts  温度计算
  hooks/         useAuth / useInbox / useApplications / useResumes / useConfig
supabase/
  migrations/001_init.sql   数据库建表 + RLS
proxy.ts         认证代理（Next.js 16 Middleware 替代）
```

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 数据库

四张表：`inbox` / `applications` / `resumes` / `user_config`，全部启用 RLS，用户只能访问自己的数据。Storage bucket `resumes`（私有），路径格式 `{user_id}/{file_name}`。

## 认证流程

未登录 → 自动跳转 `/login` → Google OAuth → 回调 `/auth/callback` → 跳转 `/`
