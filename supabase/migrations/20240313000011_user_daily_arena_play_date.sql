-- Allow same quiz to be played once per day (for demo daily testing)
-- Add play_date and change unique to (user_id, quiz_id, play_date)

ALTER TABLE public.user_daily_arena
  ADD COLUMN IF NOT EXISTS play_date date;

UPDATE public.user_daily_arena
SET play_date = (created_at AT TIME ZONE 'UTC')::date
WHERE play_date IS NULL;

ALTER TABLE public.user_daily_arena
  ALTER COLUMN play_date SET NOT NULL,
  ALTER COLUMN play_date SET DEFAULT (current_date AT TIME ZONE 'UTC')::date;

ALTER TABLE public.user_daily_arena
  DROP CONSTRAINT IF EXISTS user_daily_arena_user_id_quiz_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_arena_user_quiz_date
  ON public.user_daily_arena (user_id, quiz_id, play_date);
