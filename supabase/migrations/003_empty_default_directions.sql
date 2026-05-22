-- New accounts should start without predefined career directions.
-- Existing user_config rows are intentionally left unchanged.
alter table user_config alter column directions set default '{}';
