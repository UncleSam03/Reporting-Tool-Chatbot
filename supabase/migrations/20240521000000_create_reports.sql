-- HFF Support Group Reports schema for Supabase
-- Run in Supabase SQL Editor or via: supabase db push

create table if not exists public.reports (
    id bigint generated always as identity primary key,
    session_id text unique not null,
    facilitator text,
    cell_num text,
    town_village text,
    location text,
    meeting_day text,
    meeting_time text,
    month text,
    met_status text,
    attendees_male integer default 0,
    attendees_female integer default 0,
    lessons_interesting text,
    challenges jsonb default '[]'::jsonb,
    challenges_other text,
    challenges_resolved text,
    challenges_unresolved text,
    add_testimony text,
    testimony_before text,
    testimony_changes text,
    testimony_affirmations_status text,
    testimony_affirmations text,
    created_at timestamptz default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_month_idx on public.reports (month);
create index if not exists reports_town_village_idx on public.reports (town_village);

alter table public.reports enable row level security;

-- Dashboard read access (tighten with auth in production)
create policy "Allow anon read for dashboard"
    on public.reports for select
    to anon, authenticated
    using (true);

-- Backend insert/update via service role bypasses RLS
create policy "Allow authenticated insert"
    on public.reports for insert
    to authenticated
    with check (true);

create policy "Allow authenticated update"
    on public.reports for update
    to authenticated
    using (true)
    with check (true);
