-- Demo quiz for development (Daily Arena for today)
INSERT INTO public.quizzes (id, title, category, difficulty, quiz_date, daily_arena)
VALUES (
  'c0000001-0000-4000-8000-000000000001',
  '오늘의 뉴스 퀴즈',
  'general',
  1.0,
  CURRENT_DATE,
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, sort_order, question, options, correct_index, explanation)
SELECT
  'c0000001-0000-4000-8000-000000000001',
  n,
  '데모 질문 ' || n || ': 다음 중 맞는 것은?',
  jsonb_build_array('보기 1', '보기 2', '정답', '보기 4'),
  2,
  '정답 설명'
FROM generate_series(1, 10) AS n
WHERE EXISTS (SELECT 1 FROM public.quizzes WHERE id = 'c0000001-0000-4000-8000-000000000001')
  AND NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = 'c0000001-0000-4000-8000-000000000001' AND sort_order = n);
