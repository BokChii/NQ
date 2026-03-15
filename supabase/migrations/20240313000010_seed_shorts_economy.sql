-- 쇼츠 테스트용: 경제 카테고리 퀴즈 20개 (4문항 each)
INSERT INTO public.quizzes (id, title, category, difficulty, daily_arena)
SELECT
  ('e' || lpad(n::text, 7, '0') || '-0000-4000-8000-000000000001')::uuid,
  '경제 퀴즈 ' || n || ' – 금융·시장 기초',
  'economy',
  1.0 + (random() * 0.5),
  false
FROM generate_series(1, 20) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, sort_order, question, options, correct_index, explanation, source_url)
SELECT
  q.id,
  ord,
  '경제 퀴즈 ' || q.rn || ' – 질문 ' || ord || ': 다음 중 맞는 것은?',
  jsonb_build_array('금리 인상은 물가 안정에 도움이 된다', '주식 시장은 단기 변동이 크다', '예금 보험은 금융 안정 장치이다', '환율은 수출입에 영향을 준다'),
  (ord % 4),
  '테스트용 해석입니다. 정답은 ' || (ord % 4 + 1) || '번 보기입니다.',
  CASE WHEN ord = 1 THEN 'https://www.example.com/news/economy-' || q.rn ELSE NULL END
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at DESC) AS rn
  FROM public.quizzes
  WHERE category = 'economy' AND daily_arena = false
  ORDER BY created_at DESC
  LIMIT 20
) q
CROSS JOIN generate_series(1, 4) AS ord
WHERE NOT EXISTS (
  SELECT 1 FROM public.quiz_questions qq WHERE qq.quiz_id = q.id AND qq.sort_order = ord
);
