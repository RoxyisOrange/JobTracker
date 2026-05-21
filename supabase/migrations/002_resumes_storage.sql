-- Private bucket for resume PDFs.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

-- Resume files must be stored under "{user_id}/{file_name}".
create policy "用户只能查看自己的简历文件" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "用户只能上传自己的简历文件" on storage.objects
  for insert with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "用户只能更新自己的简历文件" on storage.objects
  for update using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "用户只能删除自己的简历文件" on storage.objects
  for delete using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
