-- Global ranking by nq (for Daily Arena)
CREATE OR REPLACE VIEW public.ranking_global AS
SELECT
  p.id,
  p.display_name,
  p.nq,
  p.level,
  p.streak,
  p.school_id,
  p.region_id,
  ROW_NUMBER() OVER (ORDER BY p.nq DESC NULLS LAST) AS rank
FROM public.profiles p
WHERE p.nq > 0;

-- School average nq for Rivalry
CREATE OR REPLACE VIEW public.ranking_by_school AS
SELECT
  s.id AS school_id,
  s.name AS school_name,
  COUNT(p.id) AS user_count,
  AVG(p.nq)::numeric(10, 2) AS avg_nq,
  ROW_NUMBER() OVER (ORDER BY AVG(p.nq) DESC NULLS LAST) AS rank
FROM public.schools s
LEFT JOIN public.profiles p ON p.school_id = s.id AND p.nq > 0
GROUP BY s.id, s.name;

-- Region average nq for Rivalry
CREATE OR REPLACE VIEW public.ranking_by_region AS
SELECT
  r.id AS region_id,
  r.name AS region_name,
  COUNT(p.id) AS user_count,
  AVG(p.nq)::numeric(10, 2) AS avg_nq,
  ROW_NUMBER() OVER (ORDER BY AVG(p.nq) DESC NULLS LAST) AS rank
FROM public.regions r
LEFT JOIN public.profiles p ON p.region_id = r.id AND p.nq > 0
GROUP BY r.id, r.name;

-- Views use underlying RLS of profiles/schools/regions.
