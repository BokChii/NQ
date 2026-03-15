-- RPC for school and region rankings (read-only, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_ranking_by_school()
RETURNS TABLE (
  school_id uuid,
  school_name text,
  user_count bigint,
  avg_nq numeric,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id AS school_id,
    s.name AS school_name,
    COUNT(p.id) AS user_count,
    AVG(p.nq)::numeric(10, 2) AS avg_nq,
    ROW_NUMBER() OVER (ORDER BY AVG(p.nq) DESC NULLS LAST)::bigint AS rank
  FROM public.schools s
  LEFT JOIN public.profiles p ON p.school_id = s.id AND p.nq > 0
  GROUP BY s.id, s.name
  ORDER BY avg_nq DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.get_ranking_by_region()
RETURNS TABLE (
  region_id uuid,
  region_name text,
  user_count bigint,
  avg_nq numeric,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    r.id AS region_id,
    r.name AS region_name,
    COUNT(p.id) AS user_count,
    AVG(p.nq)::numeric(10, 2) AS avg_nq,
    ROW_NUMBER() OVER (ORDER BY AVG(p.nq) DESC NULLS LAST)::bigint AS rank
  FROM public.regions r
  LEFT JOIN public.profiles p ON p.region_id = r.id AND p.nq > 0
  GROUP BY r.id, r.name
  ORDER BY avg_nq DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking_by_school() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking_by_school() TO anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_by_region() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking_by_region() TO anon;
