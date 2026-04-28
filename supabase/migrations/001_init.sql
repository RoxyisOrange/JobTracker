-- 收集池
create table inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null,
  position text default '',
  direction text[] default '{}',
  source text default '',
  link text default '',
  raw_note text default '',
  note text default '',
  batch text default '',
  status text default 'collected' check (status in ('collected','applied','archived')),
  pipeline_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 投递记录
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null,
  position text not null,
  direction text[] default '{}',
  platform text not null,
  batch text not null,
  resume_id uuid,
  status text not null default '已投递',
  status_history jsonb default '[]',
  applied_date date not null default current_date,
  referral_code text default '',
  interview_time timestamptz,
  note text default '',
  inbox_item_id uuid,
  review_link text,
  review_markdown text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 简历
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  direction text[] default '{}',
  note text default '',
  file_path text,
  file_name text,
  file_size bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 用户配置
create table user_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  api_key_encrypted text,
  text_model text default 'qwen-turbo-latest',
  vision_model text default 'qwen3-vl-flash',
  directions text[] default '{"数据分析/数据科学","多模态算法","AI应用算法","大模型评测"}',
  nudge_applied int default 7,
  nudge_written int default 12,
  nudge_interview int default 7,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 启用 RLS
alter table inbox enable row level security;
alter table applications enable row level security;
alter table resumes enable row level security;
alter table user_config enable row level security;

-- RLS 策略
create policy "用户只能操作自己的数据" on inbox
  for all using (auth.uid() = user_id);
create policy "用户只能操作自己的数据" on applications
  for all using (auth.uid() = user_id);
create policy "用户只能操作自己的数据" on resumes
  for all using (auth.uid() = user_id);
create policy "用户只能操作自己的数据" on user_config
  for all using (auth.uid() = user_id);

-- Storage: resumes bucket（在控制台创建 private bucket "resumes"后执行以下策略）
-- create policy "用户只能访问自己的简历" on storage.objects
--   for all using (
--     bucket_id = 'resumes' and
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
