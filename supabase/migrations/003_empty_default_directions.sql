-- New accounts should start without predefined career directions.
-- Accounts that already have user data are intentionally left unchanged.
alter table user_config alter column directions set default '{}';

update user_config
set directions = '{}',
    updated_at = now()
where directions = '{"数据分析/数据科学","多模态算法","AI应用算法","大模型评测"}'
  and not exists (
    select 1 from applications where applications.user_id = user_config.user_id
  )
  and not exists (
    select 1 from inbox where inbox.user_id = user_config.user_id
  )
  and not exists (
    select 1 from resumes where resumes.user_id = user_config.user_id
  );
