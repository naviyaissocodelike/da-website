-- ============================================================
-- DA BRAIN — Supabase schema v1
-- Run in the Supabase SQL editor (Dashboard → SQL → New query).
-- Google Sheets stays as a synced read VIEW; this is the record.
-- ============================================================

-- ---------- PEOPLE ----------
create table people (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  full_name     text not null,
  email         text unique,
  phone         text,
  linkedin_url  text,
  city          text,
  -- who they are to DA (a person can be several)
  types         text[] not null default '{}',      -- angel | founder | operator | expert | sponsor | volunteer | embassy | friend
  tier          text default 'community',          -- community | member | charter
  -- preferences (the tags we've never had)
  sectors       text[] not null default '{}',      -- fintech, healthtech, defense, climate, ...
  stages        text[] not null default '{}',      -- pre-seed, seed, series-a
  check_size    text,                              -- e.g. '10-25k'
  offers        text[] not null default '{}',      -- venue, legal, design, speaking, mentoring, sponsorship
  source        text,                              -- tally | luma | referral | event | linkedin
  referred_by   uuid references people(id),
  -- lifecycle
  status        text not null default 'new',       -- new | call_booked | onboarded | active | dormant
  engagement_score int not null default 0,
  notes         text,
  slack_user_id text,
  matching_opt_in boolean not null default false
);

-- ---------- ORGANIZATIONS (cohosts, sponsors, embassies, partners) ----------
create table orgs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  kind          text,                              -- cohost | sponsor | embassy | accelerator | vc | community
  audience_size int,
  sectors       text[] not null default '{}',
  contact_id    uuid references people(id),
  past_event_notes text,
  notes         text
);

-- ---------- DEALS ----------
create table deals (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  company       text not null,
  founder_id    uuid references people(id),
  stage         text not null default 'sourced',   -- sourced | screened | deal_room | diligence | ic_vote | spv_open | closed | passed
  sector        text,
  raise_amount  text,
  materials_url text,                              -- deck / data room link
  portal_url    text,                              -- Notion page for this deal
  referred_by   uuid references people(id),
  pass_reason   text,
  ic_decision   text,                              -- ok | not_ok | more_info
  ic_notes      text,
  -- terms & dilution (page 2 of the memo)
  instrument    text,                              -- safe | note | priced
  valuation_cap numeric,
  discount_pct  numeric,
  pro_rata      boolean,
  info_rights   boolean,
  terms_flags   text[] not null default '{}',      -- uncapped_note | stacked_safes | mfn | participating_preferred | full_ratchet | pool_shuffle | super_pro_rata
  ownership_at_conversion numeric,                 -- modeled %, incl. pool expansion
  ownership_after_two_rounds numeric
);

-- the fixed 2-page memo: one row per section per deal; created automatically
-- when a deal enters diligence. Deal cannot reach ic_vote while any row is
-- 'open' (the nudge bot prompts on these).
create table memo_sections (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deals(id) on delete cascade,
  section       text not null,                     -- snapshot | team | market_product | why_da | financial_diligence | terms | dilution_math | risks | recommendation
  content       text,
  status        text not null default 'open',      -- open | filled | waived
  waived_reason text,
  updated_at    timestamptz not null default now(),
  unique (deal_id, section)
);

-- per-deal open questions collected from members
create table deal_questions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  deal_id       uuid not null references deals(id) on delete cascade,
  asked_by      uuid references people(id),
  question      text not null,
  answer        text,
  status        text not null default 'open'       -- open | answered | dropped
);

-- ---------- COMMITMENTS (per-member per-deal interest + SPV docs) ----------
create table commitments (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deal_id       uuid not null references deals(id) on delete cascade,
  person_id     uuid not null references people(id),
  interest      text not null,                     -- committed | interested | watching | pass
  pass_reason   text,
  amount        numeric,
  spv_doc_status text default 'not_sent',          -- not_sent | sent | signed | wired
  unique (deal_id, person_id)
);

-- ---------- EVENTS ----------
create table events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  kind          text,                              -- deal_room | member_dinner | mixer | workshop
  starts_at     timestamptz,
  luma_url      text,
  luma_event_id text unique,                       -- for the nightly sync upsert
  cohost_org_id uuid references orgs(id),
  recap_sent    boolean not null default false,
  thanks_sent   boolean not null default false,
  -- event economics: P&L per event → cost per new member / activated angel
  capacity      int,
  cost          numeric,
  sponsor_cash  numeric,
  sponsor_inkind_value numeric
);

create table event_attendance (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  person_id     uuid not null references people(id),
  registered    boolean not null default true,
  attended      boolean not null default false,
  unique (event_id, person_id)
);

-- ---------- SPONSORSHIPS ----------
create table sponsorships (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  org_id        uuid not null references orgs(id),
  package       text,                              -- annual_partner | per_event | in_kind
  category      text,                              -- law | banking | accounting | econ_dev | corporate | other
  category_exclusive boolean not null default false,
  cash_value    numeric,
  in_kind_value numeric,                           -- fair value, so total sponsorship value is one number
  asks          text,                              -- what they want from us
  benefits_owed text,                              -- what we promised
  renewal_date  date,
  active        boolean not null default true
);

create table sponsor_deliverables (
  id            uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references sponsorships(id) on delete cascade,
  event_id      uuid references events(id),
  deliverable   text not null,                     -- 'logo on deck', '3-min stage moment', 'LinkedIn mention'
  delivered     boolean not null default false,
  proof_url     text
);

-- ---------- INTROS & REFERRALS (the impact ledger) ----------
create table intros (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  from_person   uuid references people(id),
  to_person     uuid references people(id),
  deal_id       uuid references deals(id),
  context       text,
  outcome       text                               -- meeting | investment | partnership | nothing_yet
);

-- ---------- PORTFOLIO (post-investment loop) ----------
create table portfolio_updates (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  deal_id       uuid not null references deals(id),
  period        text not null,                     -- e.g. '2026-Q3'
  revenue       numeric,
  burn          numeric,
  runway_months numeric,
  headcount     int,
  highlights    text,
  lowlights     text,
  submitted_by  uuid references people(id),
  flagged       boolean not null default false,    -- runway < 6mo or 2 missed updates
  unique (deal_id, period)
);

-- founder asks, extracted from each update; matched to people/orgs by tag
create table founder_asks (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  update_id     uuid references portfolio_updates(id) on delete cascade,
  deal_id       uuid not null references deals(id),
  ask           text not null,                     -- 'intro to DoD buyers', 'senior BE hire', 'series A leads'
  kind          text,                              -- customer | hire | investor | expert | other
  status        text not null default 'open',      -- open | matched | delivered | dropped
  intro_id      uuid references intros(id)         -- the intro that answered it
);

-- ecosystem perks owed to portfolio founders (mirrors sponsor_deliverables)
create table portfolio_perks (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deals(id),
  perk          text not null,                     -- 'deal room demo slot', 'newsletter feature', 'expert office hours', 'embassy connect'
  due_date      date,
  delivered     boolean not null default false,
  proof_url     text
);

-- ---------- POINTS LEDGER (incentive engine — derived, never self-reported) ----------
create table points_ledger (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  person_id     uuid not null references people(id),
  points        int not null,                      -- negative rows = redemptions
  reason        text not null,                     -- deal_invested | deal_screened | member_referral | strategic_connect | deal_feedback | pass_reason | speak_host | attend | redemption_fee_waiver | redemption_event_invite
  source_table  text,                              -- commitments | intros | event_attendance | deal_questions | people
  source_id     uuid,
  expires_at    timestamptz                        -- now() + 24 months for earned points
);
create index on points_ledger (person_id, expires_at);

-- current balance = query, not a column
create view points_balance as
select person_id, sum(points) as balance
from points_ledger
where expires_at is null or expires_at > now()
group by person_id;

-- ---------- GRANTS (econ-dev pipeline, run like the deal pipeline) ----------
create table grants (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  funder        text not null,                     -- e.g. 'Arlington Economic Development'
  program       text,
  amount        numeric,
  stage         text not null default 'identified',-- identified | loi | application | awarded | reporting | closed | declined
  deadline      date,
  reporting_requirements text,                     -- which Brain metrics they want, how often
  owner         text,
  notes         text
);

-- ---------- OUTREACH (cold + warm, every persona, one pipeline) ----------
create table outreach (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  campaign      text not null,                     -- 'law-firm-sponsors-q3', 'angel-recruitment-fall', 'botr-underwriters'
  persona       text not null,                     -- sponsor | grant_maker | founder | investor | partner | angel
  person_id     uuid references people(id),
  org_id        uuid references orgs(id),
  target_name   text not null,
  target_email  text,
  warm_path     uuid references people(id),        -- the member who can intro (warm-first rule)
  channel       text not null default 'email',     -- email | linkedin | warm_intro
  stage         text not null default 'identified',-- identified | researched | contacted | replied | meeting | converted | closed
  gmail_thread_id text,                            -- reply detection key
  touches       int not null default 0,            -- max 3 (send + day-4 + day-9), then closed
  last_touch    timestamptz,
  next_touch    date,
  template      text,                              -- which pitch was used → reply-rate per template
  outcome       text,
  owner         text
);
create index on outreach (campaign, stage);
create index on outreach (gmail_thread_id);

-- ---------- OPEN ITEMS (tasks extracted from Slack + calls + checklists) ----------
create table open_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  title         text not null,
  owner         text,                              -- name or slack id
  due_date      date,
  source        text,                              -- slack | transcript | deal_checklist | event_checklist | md_meeting
  deal_id       uuid references deals(id),
  event_id      uuid references events(id),
  status        text not null default 'open',      -- open | done | dropped
  done_at       timestamptz
);

-- ---------- PENDING BRAIN UPDATES (the #da-brain ✅ approval queue) ----------
create table pending_updates (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  slack_ts      text unique not null,              -- message timestamp = approval key
  slack_channel text not null,
  raw_text      text not null,
  parsed        jsonb not null,                    -- the structured update Claude proposed
  status        text not null default 'pending',   -- pending | committed | rejected
  committed_at  timestamptz
);

-- ---------- helpers ----------
create index on people (status);
create index on people using gin (types);
create index on people using gin (sectors);
create index on deals (stage);
create index on commitments (deal_id, interest);
create index on open_items (status, due_date);

-- updated_at trigger
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger people_touch   before update on people      for each row execute function touch_updated_at();
create trigger deals_touch    before update on deals       for each row execute function touch_updated_at();
create trigger commit_touch   before update on commitments for each row execute function touch_updated_at();
create trigger outreach_touch before update on outreach    for each row execute function touch_updated_at();

-- ---------- the Google Sheet view (read-only comfort layer) ----------
-- Sync this view to a Sheet with the Supabase <> Sheets connector or a
-- scheduled n8n job. Edits happen through #da-brain, not the sheet.
create view sheet_people as
select full_name, email, linkedin_url, array_to_string(types, ', ') as types,
       tier, array_to_string(sectors, ', ') as sectors, check_size,
       array_to_string(offers, ', ') as offers, source, status,
       engagement_score, city, created_at
from people order by created_at desc;
