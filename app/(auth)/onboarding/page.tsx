"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
type SchoolOption = { id: string; name: string };
type RegionOption = { id: string; name: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const [schoolsRes, regionsRes] = await Promise.all([
        supabase.from("schools").select("id, name").order("name"),
        supabase.from("regions").select("id, name").order("name"),
      ]);
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (regionsRes.data) setRegions(regionsRes.data);
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_done, school_id, region_id")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (profile?.onboarding_done) {
        router.replace("/arena");
        return;
      }
      if (profile?.school_id) setSchoolId(profile.school_id);
      if (profile?.region_id) setRegionId(profile.region_id);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        school_id: schoolId || null,
        region_id: regionId || null,
        onboarding_done: true,
      })
      .eq("id", user.id);
    setSaving(false);
    router.replace("/arena");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[360px]">
        <CardHeader>
          <CardTitle className="text-center">프로필 설정</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            학교와 지역을 선택하면 랭킹에 반영됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>학교</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>지역</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "저장 중..." : "시작하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
