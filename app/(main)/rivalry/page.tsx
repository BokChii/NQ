import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Rivalry Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-4">
        대학교·지역별 평균 nq 실시간 랭킹
      </p>
      <RivalryDashboard
        schoolRanking={schoolRanking}
        regionRanking={regionRanking}
      />
    </div>
  );
}
