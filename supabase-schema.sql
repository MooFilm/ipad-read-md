create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.private_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  folder_path text default '',
  storage_path text unique not null,
  access_role text not null check (access_role in ('shared', 'user', 'admin')),
  created_at timestamptz default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.private_documents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "private_documents_select_by_role" on public.private_documents;
create policy "private_documents_select_by_role"
on public.private_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        private_documents.access_role = 'shared'
        or (private_documents.access_role = 'user' and p.role in ('user', 'admin'))
        or (private_documents.access_role = 'admin' and p.role = 'admin')
      )
  )
);
