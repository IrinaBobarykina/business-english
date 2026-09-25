-- Business English — схема базы данных v0.1 (ET-14)
-- Выполняется один раз: Supabase → SQL Editor → вставить весь файл → Run.
-- Описание таблиц — в вики: «04 Tech/Стек и архитектура».
--
-- Доступ к данным: только сервер приложения по секретному ключу (роль service_role).
-- RLS включён на всех таблицах без политик, права для anon и authenticated не выдаются,
-- поэтому публичный ключ Supabase не даёт доступа к данным.

begin;

-- Общая функция: обновляет updated_at при изменении строки.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Папки для слов (US-3, опционально).
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
comment on table public.folders is 'Папки для слов: уроки, темы (US-3)';
create unique index folders_name_key on public.folders (lower(btrim(name)));

-- Слова и фразы с урока (US-1, US-2).
create table public.words (
  id uuid primary key default gen_random_uuid(),
  term text not null check (char_length(btrim(term)) between 1 and 200),
  translation text check (translation is null or char_length(translation) <= 300),
  note text check (note is null or char_length(note) <= 1000),
  folder_id uuid references public.folders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.words is 'Слова и фразы с урока (US-1, US-2)';
comment on column public.words.term is 'Слово или фраза на английском';
comment on column public.words.translation is 'Перевод, необязательно; указывается через тире при добавлении';
comment on column public.words.folder_id is 'Папка; при удалении папки слово остаётся без папки';
-- Дубликаты не добавляются (US-1): сравнение без учёта регистра и лишних пробелов.
create unique index words_term_key on public.words (lower(regexp_replace(btrim(term), '\s+', ' ', 'g')));
create index words_folder_id_idx on public.words (folder_id);
create index words_created_at_idx on public.words (created_at desc);
create trigger words_set_updated_at
  before update on public.words
  for each row execute function public.set_updated_at();

-- Тренировки «Как сказать на английском?» (US-4): группируют ответы для итога сессии.
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders (id) on delete set null,
  phrase_count smallint not null check (phrase_count in (5, 10, 15)),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
comment on table public.training_sessions is 'Тренировки (US-4). folder_id null — все слова; finished_at null — сессия прервана или идёт';

-- История ответов (US-5).
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions (id) on delete set null,
  word_id uuid not null references public.words (id) on delete cascade,
  prompt_ru text not null,
  answer text not null default '',
  verdict text not null check (verdict in ('correct', 'unnatural', 'incorrect')),
  used_target_word boolean,
  hints_used smallint not null default 0 check (hints_used between 0 and 2),
  reference text,
  alternatives text[] not null default '{}',
  explanation text,
  is_error boolean generated always as (verdict <> 'correct' or hints_used = 2) stored,
  created_at timestamptz not null default now()
);
comment on table public.attempts is 'История ответов (US-5). Ответы, которые AI не проверил, не сохраняются';
comment on column public.attempts.prompt_ru is 'Фраза на русском, которую нужно было перевести';
comment on column public.attempts.answer is 'Ответ пользователя; пустая строка — «Не знаю»';
comment on column public.attempts.verdict is 'Оценка: correct — «Верно», unnatural — «Неестественно», incorrect — «Неверно»';
comment on column public.attempts.hints_used is '0 — без подсказок, 1 — первые буквы, 2 — слово открыто целиком';
comment on column public.attempts.is_error is 'Ошибка для повторения: «Неверно», «Неестественно» или слово открыто целиком (US-5)';
create index attempts_word_id_created_at_idx on public.attempts (word_id, created_at desc);
create index attempts_session_id_idx on public.attempts (session_id);

-- Неверные попытки ввода PIN-кода: защита от перебора (5 попыток за 15 минут).
create table public.pin_failures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
comment on table public.pin_failures is 'Неверные попытки ввода PIN-кода; хранятся не дольше суток';
create index pin_failures_created_at_idx on public.pin_failures (created_at);

-- Доступ: RLS без политик + права только для service_role (секретный ключ на сервере).
alter table public.folders enable row level security;
alter table public.words enable row level security;
alter table public.training_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.pin_failures enable row level security;

revoke all on public.folders, public.words, public.training_sessions, public.attempts, public.pin_failures
  from anon, authenticated;
grant select, insert, update, delete
  on public.folders, public.words, public.training_sessions, public.attempts, public.pin_failures
  to service_role;

commit;
