-- Business English — ET-22: фразы тренировки и прогресс сессии (US-4)
-- Выполняется один раз: Supabase → SQL Editor → вставить весь файл → Run.
-- Новых таблиц нет: добавляются два столбца в training_sessions, права на таблицу уже выданы service_role.

begin;

alter table public.training_sessions
  add column phrases jsonb not null default '[]'::jsonb,
  add column current_index smallint not null default 0 check (current_index >= 0);

comment on column public.training_sessions.phrases is
  'Фразы сессии, подготовленные AI одним запросом: [{word_id, prompt_ru, reference}]';
comment on column public.training_sessions.current_index is
  'Номер текущей фразы (с 0). Равен числу фраз — все фразы пройдены';

commit;
