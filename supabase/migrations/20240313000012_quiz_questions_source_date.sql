-- 뉴스 일자 표시용 (기사 게재일)
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS source_date date;
