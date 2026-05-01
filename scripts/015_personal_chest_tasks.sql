-- Personal Chest: task manager + processed document metadata.

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_name text,
  title text not null,
  description text,
  due_date date,
  task_type text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.user_tasks(id) on delete cascade,
  title text not null,
  original_file_name text,
  source_hash text,
  content_storage_path text not null,
  image_count int not null default 0,
  table_count int not null default 0,
  storage_bytes int not null default 0,
  text_char_count int not null default 0,
  estimated_tokens int not null default 0,
  page_count int not null default 0,
  processing_status text not null default 'completed'
    check (processing_status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_tasks_user_status_due
  on public.user_tasks(user_id, status, due_date);

create index if not exists idx_user_tasks_user_created
  on public.user_tasks(user_id, created_at desc);

create index if not exists idx_task_documents_user_task
  on public.task_documents(user_id, task_id);

create index if not exists idx_task_documents_source_hash
  on public.task_documents(source_hash);

alter table public.user_tasks enable row level security;
alter table public.task_documents enable row level security;

drop policy if exists "Users can read own tasks" on public.user_tasks;
create policy "Users can read own tasks"
  on public.user_tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.user_tasks;
create policy "Users can insert own tasks"
  on public.user_tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.user_tasks;
create policy "Users can update own tasks"
  on public.user_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.user_tasks;
create policy "Users can delete own tasks"
  on public.user_tasks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own task documents" on public.task_documents;
create policy "Users can read own task documents"
  on public.task_documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own task documents" on public.task_documents;
create policy "Users can insert own task documents"
  on public.task_documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own task documents" on public.task_documents;
create policy "Users can update own task documents"
  on public.task_documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own task documents" on public.task_documents;
create policy "Users can delete own task documents"
  on public.task_documents for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('study-documents', 'study-documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own study documents" on storage.objects;
create policy "Users can read own study documents"
  on storage.objects for select
  using (
    bucket_id = 'study-documents'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users can insert own study documents" on storage.objects;
create policy "Users can insert own study documents"
  on storage.objects for insert
  with check (
    bucket_id = 'study-documents'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users can update own study documents" on storage.objects;
create policy "Users can update own study documents"
  on storage.objects for update
  using (
    bucket_id = 'study-documents'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'study-documents'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users can delete own study documents" on storage.objects;
create policy "Users can delete own study documents"
  on storage.objects for delete
  using (
    bucket_id = 'study-documents'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
