-- Rank, streak, and shorts XP tracking for NQ level system
-- Level = floor(sqrt(XP/50)) + 1
-- Required XP for level L = 50 * (L-1)^2

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_played_at date,
  ADD COLUMN IF NOT EXISTS rank_name text DEFAULT '옵저버',
  ADD COLUMN IF NOT EXISTS rank_color text DEFAULT '#94A3B8';

-- Daily shorts XP cap (200/day): track per user per day
CREATE TABLE IF NOT EXISTS public.user_daily_shorts_xp (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  play_date date NOT NULL,
  xp_gained int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, play_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_shorts_xp_user_date ON public.user_daily_shorts_xp(user_id, play_date);

ALTER TABLE public.user_daily_shorts_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily shorts xp" ON public.user_daily_shorts_xp
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert update daily shorts xp" ON public.user_daily_shorts_xp
  FOR ALL USING (true);

-- Backfill rank for existing profiles
UPDATE public.profiles
SET
  rank_name = CASE
    WHEN level <= 5 THEN '옵저버'
    WHEN level <= 15 THEN '큐레이터'
    WHEN level <= 30 THEN '팩트체커'
    WHEN level <= 50 THEN '인사이더'
    WHEN level <= 80 THEN '아키텍트'
    WHEN level <= 99 THEN '오라클'
    ELSE '언노운'
  END,
  rank_color = CASE
    WHEN level <= 5 THEN '#94A3B8'
    WHEN level <= 15 THEN '#CBD5E1'
    WHEN level <= 30 THEN '#60A5FA'
    WHEN level <= 50 THEN '#FACC15'
    WHEN level <= 80 THEN '#10B981'
    WHEN level <= 99 THEN '#F472B6'
    ELSE '#A855F7'
  END
WHERE rank_name IS NULL OR rank_color IS NULL;
