-- Supabase schema baseline for the game community app
-- 包含 users / posts / comments / likes / storage 的基础定义

create extension if not exists pgcrypto;

drop policy if exists "tavily_daily_usage_select_all" on public.tavily_daily_usage;
drop policy if exists "tavily_daily_usage_insert_all" on public.tavily_daily_usage;
drop policy if exists "tavily_daily_usage_update_all" on public.tavily_daily_usage;
drop policy if exists "users_select_all" on public.users;
drop policy if exists "users_upsert_all" on public.users;
drop policy if exists "users_update_all" on public.users;
drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_insert_all" on public.posts;
drop policy if exists "posts_update_all" on public.posts;
drop policy if exists "posts_delete_all" on public.posts;
drop policy if exists "comments_select_all" on public.comments;
drop policy if exists "comments_insert_all" on public.comments;
drop policy if exists "comments_delete_all" on public.comments;
drop policy if exists "likes_select_all" on public.likes;
drop policy if exists "likes_insert_all" on public.likes;
drop policy if exists "likes_delete_all" on public.likes;
drop policy if exists "post_images_public_read" on storage.objects;
drop policy if exists "post_images_public_insert" on storage.objects;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null unique,
  nickname text not null,
  nickname_locked boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  nickname_updated_at timestamptz
);

alter table public.users
  add column if not exists nickname_locked boolean not null default false;

alter table public.users
  add column if not exists nickname_updated_at timestamptz;

create unique index if not exists users_nickname_unique
  on public.users (nickname);

create or replace function public.claim_guest_nickname(input_visitor_id text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_user public.users%rowtype;
  next_guest_number bigint;
  next_nickname text;
begin
  select *
  into existing_user
  from public.users
  where visitor_id = input_visitor_id;

  if found then
    return existing_user;
  end if;

  loop
    select coalesce(
      max(
        case
          when nickname ~ '^guest[0-9]+$' then substring(nickname from 6)::bigint
          else 0
        end
      ),
      0
    ) + 1
    into next_guest_number
    from public.users
    for update;

    next_nickname := 'guest' || next_guest_number;

    begin
      insert into public.users (visitor_id, nickname, nickname_locked)
      values (input_visitor_id, next_nickname, false)
      returning * into existing_user;

      return existing_user;
    exception
      when unique_violation then
        select *
        into existing_user
        from public.users
        where visitor_id = input_visitor_id;

        if found then
          return existing_user;
        end if;
    end;
  end loop;
end;
$$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  author_name text not null,
  author_id text,
  image_url text,
  source_url text unique,
  source_type text not null check (source_type in ('user', 'crawl')),
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  constraint likes_target_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create table if not exists public.tavily_daily_usage (
  usage_date date primary key,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tavily_daily_usage_usage_date_unique
  on public.tavily_daily_usage (usage_date);

create unique index if not exists likes_post_visitor_unique
  on public.likes (post_id, visitor_id)
  where post_id is not null;

create unique index if not exists likes_comment_visitor_unique
  on public.likes (comment_id, visitor_id)
  where comment_id is not null;

create index if not exists posts_source_type_created_at_idx
  on public.posts (source_type, created_at desc);

create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at asc);

alter table public.tavily_daily_usage enable row level security;
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

create policy "tavily_daily_usage_select_all"
  on public.tavily_daily_usage for select
  using (true);

create policy "tavily_daily_usage_insert_all"
  on public.tavily_daily_usage for insert
  with check (true);

create policy "tavily_daily_usage_update_all"
  on public.tavily_daily_usage for update
  using (true)
  with check (true);

create policy "users_select_all"
  on public.users for select
  using (true);

create policy "users_upsert_all"
  on public.users for insert
  with check (true);

create policy "users_update_all"
  on public.users for update
  using (true)
  with check (true);

create policy "posts_select_all"
  on public.posts for select
  using (true);

create policy "posts_insert_all"
  on public.posts for insert
  with check (true);

create policy "posts_update_all"
  on public.posts for update
  using (true)
  with check (true);

create policy "posts_delete_all"
  on public.posts for delete
  using (true);

create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_all"
  on public.comments for insert
  with check (true);

create policy "comments_delete_all"
  on public.comments for delete
  using (true);

create policy "likes_select_all"
  on public.likes for select
  using (true);

create policy "likes_insert_all"
  on public.likes for insert
  with check (true);

create policy "likes_delete_all"
  on public.likes for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_public_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post_images_public_insert"
  on storage.objects for insert
  with check (bucket_id = 'post-images');
