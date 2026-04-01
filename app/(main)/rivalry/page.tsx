import { createClient } from "@/lib/supabase/server";
import { RivalryDashboard } from "@/components/rivalry/rivalry-dashboard";

export default async function RivalryPage() {
  const supabase = await createClient();
  const [schoolRows, regionRows] = await Promise.all([
    supabase.rpc("get_ranking_by_school"),
    supabase.rpc("get_ranking_by_region"),
  ]);
  const schoolRanking = (schoolRows.data ?? []) as {
    school_id: string;
    school_name: string;
    user_count: number;
    avg_nq: number;
    rank: number;
  }[];
  const regionRanking = (regionRows.data ?? []) as {
    region_id: string;
    region_name: string;
    user_count: number;
    avg_nq: number;
    rank: number;
  }[];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">대결 보드</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          대학교·지역별 평균 nq 실시간 랭킹
        </p>
      </div>
      <RivalryDashboard
        schoolRanking={schoolRanking}
        regionRanking={regionRanking}
      />
    </div>
  );
}
