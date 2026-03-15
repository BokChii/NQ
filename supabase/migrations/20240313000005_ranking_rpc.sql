-- RPC to read global ranking (bypasses RLS for read-only ranking data)
CREATE OR REPLACE FUNCTION public.get_ranking_global(lim int DEFAULT 100)
RETURNS TABLE (
  rank bigint,
  id uuid,
  display_name text,
  nq numeric,
  level int,
  streak int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.nq DESC NULLS LAST)::bigint AS rank,
    p.id,
    p.display_name,
    p.nq,
    p.level,
    p.streak
  FROM public.profiles p
  WHERE p.nq > 0
  ORDER BY p.nq DESC NULLS LAST
  LIMIT lim;
$$;

-- Allow authenticated users to call
GRANT EXECUTE ON FUNCTION public.get_ranking_global(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking_global(int) TO anon;
