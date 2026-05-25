# 投递追踪器

一个面向求职投递流程的 Web 应用，用来集中管理岗位线索、投递记录、简历版本、面试提醒和投递分析。项目从单 HTML 版迁移为 Next.js + Supabase 架构，支持 Google 登录、按用户隔离数据、AI 文本/截图识别和数据导入导出。

## 功能概览

- **Google 登录与访问控制**：未登录访问业务页面会自动跳转 `/login`，登录成功后回到数据看板。
- **数据看板**：展示总投递、进行中、沉寂岗位、今日投递、近 3 天面试、近 7 天投递、Offer 等关键指标。
- **面试提醒**：首页提示未来 2 小时内的面试；数据看板列出未来 3 天面试，并展示关联简历。
- **收集池**：快速记录待投递岗位，支持速记、完整录入、搜索、方向/批次/状态筛选、批量归档/删除，并可一键转入投递管道。
- **AI 智能识别**：可从文本或截图中提取公司、岗位、方向、来源、链接和备注；未配置 API Key 时，文本录入会降级为本地规则提取。
- **投递管道**：管理正式投递记录，支持表格、看板、按公司三种视图，记录状态历史、面试时间、内推码/链接、备注和关联简历。
- **批量投递**：可批量录入多个投递记录，批量更新状态或批量删除。
- **温度计/沉寂提醒**：根据已投递、笔试、面试阶段的阈值标记岗位活跃程度，阈值可在设置中调整。
- **简历管理**：维护多个简历版本，支持 PDF 上传、预览、替换、删除和按方向标记。
- **数据分析**：提供转化漏斗、投递热力图、方向分布和平台分布，支持按方向和批次筛选。
- **设置中心**：管理 DashScope API Key、模型名、职业方向、提醒阈值、浅色/深色主题、JSON/CSV 导出、JSON 导入、清空数据和账号注销。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth / PostgreSQL / Row Level Security / Storage
- DashScope OpenAI-compatible API，用于文本与视觉识别

## 项目结构

```text
src/
  app/
    api/
      account/delete/   账号注销接口
      ai-parse/         文本智能识别接口
      ai-vision/        截图智能识别接口
    auth/callback/      Supabase OAuth 回调
    analytics/          数据分析页面
    inbox/              收集池页面
    pipeline/           投递管道页面
    resume/             简历管理页面
    settings/           设置页面
    page.tsx            数据看板首页
  components/           页面组件和业务组件
  hooks/                useAuth / useInbox / useApplications / useResumes / useConfig
  lib/
    supabase/           浏览器、服务端和 proxy 使用的 Supabase Client
    constants.ts        状态、平台、批次、模型和阈值常量
    directions.ts       方向合并与去重
    status.ts           投递状态规则
    temperature.ts      岗位温度计算
    types.ts            业务类型定义
    utils.ts            通用工具函数
supabase/
  migrations/           数据库和 Storage 初始化脚本
proxy.ts                Next.js 16 认证代理
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例文件：

```bash
cp .env.local.example .env.local
```

在 `.env.local` 填入 Supabase 控制台 `Settings > API` 中的值：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

可选：如果希望“注销账号”同时删除 Supabase Auth 用户，需要在服务端环境中配置 `SUPABASE_SERVICE_ROLE_KEY`。不要把 service role key 暴露到浏览器端，也不要使用 `NEXT_PUBLIC_` 前缀。

### 3. 初始化 Supabase

在 Supabase SQL Editor 中按顺序执行：

1. `supabase/migrations/001_init.sql`
   - 创建 `inbox`、`applications`、`resumes`、`user_config` 四张表。
   - 启用 Row Level Security。
   - 设置用户只能访问自己数据的 RLS 策略。
2. `supabase/migrations/002_resumes_storage.sql`
   - 创建私有 Storage bucket：`resumes`。
   - 限制用户只能访问 `{user_id}/...` 路径下的简历文件。
3. `supabase/migrations/003_empty_default_directions.sql`
   - 将新用户默认职业方向改为空。
   - 对没有历史数据的旧默认配置做兼容清理。

### 4. 配置 Google OAuth

在 Supabase 控制台启用 Google Provider：

1. 打开 `Authentication > Providers > Google`。
2. 填入 Google Cloud Console 中创建的 OAuth Client ID 和 Client Secret。
3. 在 Google Cloud Console 的 OAuth 客户端中添加 Supabase 回调地址：

```text
https://你的项目.supabase.co/auth/v1/callback
```

本地开发时，应用会把登录回调重定向到：

```text
http://localhost:3000/auth/callback
```

同时建议在 Supabase Auth 的 redirect URLs 中加入允许的应用回调地址：

- 本地开发：`http://localhost:3000/auth/callback`
- 生产部署：`https://你的线上域名/auth/callback`

### 5. 启动项目

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## AI 识别配置

应用使用 DashScope 的 OpenAI-compatible Chat Completions 接口：

- 文本识别默认模型：`qwen-turbo-latest`
- 图片识别默认模型：`qwen3-vl-flash`

使用方法：

1. 登录应用。
2. 进入“设置”。
3. 在“AI智能识别配置”中填入 DashScope API Key。
4. 如需更换模型，可同时修改文字识别模型和图片识别模型。

说明：

- API Key 保存在当前用户的 `user_config.api_key_encrypted` 字段中；当前实现只是字段命名为 encrypted，并未做额外加密层。
- 文本识别接口：`POST /api/ai-parse`
- 图片识别接口：`POST /api/ai-vision`
- 图片在浏览器端会压缩到较小尺寸后再提交给接口。

## 数据模型

核心表：

- `inbox`：岗位线索收集池。状态包括 `collected`、`applied`、`archived`。
- `applications`：正式投递记录。包含公司、岗位、方向、平台、批次、状态、状态历史、投递日期、面试时间、备注、关联简历等字段。
- `resumes`：简历版本元数据。PDF 文件存储在私有 `resumes` bucket 中。
- `user_config`：用户设置。包含 AI 配置、职业方向、温度阈值等。

投递状态：

```text
已投递 -> 笔试 -> 一面 -> 二面 -> 三面 -> HR面 -> Offer
```

终态还包括：

```text
已挂 / 已放弃
```

## 常用命令

```bash
npm run dev      # 启动本地开发服务器
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

## 部署

推荐部署到 Vercel 或其他支持 Next.js 16 的平台。

部署前确认：

- 已配置 `NEXT_PUBLIC_SUPABASE_URL`。
- 已配置 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- Supabase migrations 已按顺序执行。
- Supabase Auth 已开启 Google Provider。
- Supabase Auth 的站点 URL 和 redirect URLs 已包含线上域名。
- 如果需要注销时删除 Auth 用户，服务端环境变量中已配置 `SUPABASE_SERVICE_ROLE_KEY`。

## 开发注意事项

- 根目录使用 `proxy.ts` 作为 Next.js 16 的认证代理，不使用已弃用的 `middleware.ts`。
- `cookies()` 在 Next.js 16 中是异步函数，服务端 Supabase Client 创建时需要 `await cookies()`。
- `@/*` 路径别名指向 `src/*`。
- 所有用户数据通过 Supabase RLS 按 `auth.uid() = user_id` 隔离。
- 简历文件必须存储在 `resumes` bucket 的 `{user_id}/{file_name}` 路径下。
