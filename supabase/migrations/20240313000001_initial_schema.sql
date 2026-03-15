-- NQ (News Quotient) initial schema
-- Schools and regions for Rivalry
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  school_id uuid REFERENCES public.schools(id),
  region_id uuid REFERENCES public.regions(id),
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  nq numeric(10, 2) NOT NULL DEFAULT 0,
  onboarding_done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  difficulty numeric(3, 2) NOT NULL DEFAULT 1 CHECK (difficulty >= 0.5 AND difficulty <= 2),
  quiz_date date,
  daily_arena boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_daily_arena_date ON public.quizzes(daily_arena, quiz_date) WHERE daily_arena = true;
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category) WHERE daily_arena = false;

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

-- User answers (for scoring and anti-abuse)
CREATE TABLE IF NOT EXISTS public.user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_index int NOT NULL,
  is_correct boolean NOT NULL,
  time_ms int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_answers_user ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_created ON public.user_answers(created_at);

-- Daily Arena participation (one per user per day)
CREATE TABLE IF NOT EXISTS public.user_daily_arena (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score int NOT NULL,
  total int NOT NULL,
  nq_earned numeric(10, 2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_arena_user_date ON public.user_daily_arena(user_id, created_at);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_arena ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Profiles: read own, update own
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Schools and regions: read all
CREATE POLICY "Anyone can read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Anyone can read regions" ON public.regions FOR SELECT USING (true);

-- Quizzes and questions: read all (for playing)
CREATE POLICY "Anyone can read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Anyone can read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);

-- User answers: insert own, read own (service role will write from Edge Function)
CREATE POLICY "Users can read own answers" ON public.user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert answers" ON public.user_answers FOR INSERT WITH CHECK (true);

-- User daily arena: read own, insert/update via Edge Function
CREATE POLICY "Users can read own daily arena" ON public.user_daily_arena FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert daily arena" ON public.user_daily_arena FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update daily arena" ON public.user_daily_arena FOR UPDATE USING (true);
