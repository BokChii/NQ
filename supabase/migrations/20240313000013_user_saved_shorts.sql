-- 저장한 뉴스 퀴즈 (쇼츠)
CREATE TABLE IF NOT EXISTS public.user_saved_shorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_shorts_user ON public.user_saved_shorts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_shorts_question ON public.user_saved_shorts(question_id);

ALTER TABLE public.user_saved_shorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved shorts" ON public.user_saved_shorts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved shorts" ON public.user_saved_shorts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved shorts" ON public.user_saved_shorts FOR DELETE USING (auth.uid() = user_id);
