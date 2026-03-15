-- 쇼츠 결과 화면: 해석 + 뉴스 링크용
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS source_url text;
