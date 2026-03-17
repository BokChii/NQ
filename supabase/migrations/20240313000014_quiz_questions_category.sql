-- quiz_questions에 category 컬럼 추가 (쇼츠용, 문항 단위 카테고리 관리)
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS category text;

-- 기존 데이터: quizzes.category로 backfill
UPDATE public.quiz_questions qq
SET category = q.category
FROM public.quizzes q
WHERE qq.quiz_id = q.id AND qq.category IS NULL;

-- 인덱스 (쇼츠 카테고리 필터용)
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category
  ON public.quiz_questions(category)
  WHERE category IS NOT NULL;
