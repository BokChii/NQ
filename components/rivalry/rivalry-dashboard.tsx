"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type SchoolRow = {
  school_id: string;
  school_name: string;
  user_count: number;
  avg_nq: number;
  rank: number;
};
type RegionRow = {
  region_id: string;
  region_name: string;
  user_count: number;
  avg_nq: number;
  rank: number;
};

export function RivalryDashboard({
  schoolRanking,
  regionRanking,
}: {
  schoolRanking: SchoolRow[];
  regionRanking: RegionRow[];
}) {
  const [tab, setTab] = useState("school");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="school">대학</TabsTrigger>
        <TabsTrigger value="region">지역</TabsTrigger>
      </TabsList>
      <TabsContent value="school">
        <div className="space-y-2">
          {schoolRanking.length === 0 ? (
            <p className="text-muted-foreground text-sm">아직 대학 랭킹이 없습니다.</p>
          ) : (
            schoolRanking.map((r, i) => (
              <motion.div
                key={r.school_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">#{r.rank}</span>
                      <span className="font-medium">{r.school_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({r.user_count}명)
                      </span>
                    </div>
                    <span className="text-primary font-semibold tabular-nums">
                      nq {Number(r.avg_nq).toFixed(1)}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="region">
        <div className="space-y-2">
          {regionRanking.length === 0 ? (
            <p className="text-muted-foreground text-sm">아직 지역 랭킹이 없습니다.</p>
          ) : (
            regionRanking.map((r, i) => (
              <motion.div
                key={r.region_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">#{r.rank}</span>
                      <span className="font-medium">{r.region_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({r.user_count}명)
                      </span>
                    </div>
                    <span className="text-primary font-semibold tabular-nums">
                      nq {Number(r.avg_nq).toFixed(1)}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
