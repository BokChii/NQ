import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function ArenaRankingPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.rpc("get_ranking_global", { lim: 100 });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">전체 랭킹</h1>
      {!rows?.length ? (
        <p className="text-muted-foreground text-sm">아직 랭킹이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r: { rank: number; display_name: string | null; nq: number }, i: number) => (
            <Card key={r.rank ?? i}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-6">#{r.rank}</span>
                  <span className="font-medium">
                    {r.display_name || "익명"}
                  </span>
                </div>
                <span className="text-primary font-semibold">
                  nq {Number(r.nq).toFixed(1)}
                </span>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
