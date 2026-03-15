"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

type SchoolOption = { id: string; name: string };
type RegionOption = { id: string; name: string };

export default function ProfileEditPage() {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
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
      const [profileRes, schoolsRes, regionsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, school_id, region_id").eq("id", user.id).single(),
        supabase.from("schools").select("id, name").order("name"),
        supabase.from("regions").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name ?? "");
        setSchoolId(profileRes.data.school_id ?? "");
        setRegionId(profileRes.data.region_id ?? "");
      }
      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (regionsRes.data) setRegions(regionsRes.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        school_id: schoolId || null,
        region_id: regionId || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("저장에 실패했습니다.");
      return;
    }
    toast.success("저장되었습니다.");
    router.push("/profile");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/profile" className="text-muted-foreground hover:text-foreground">
          ← 프로필
        </Link>
      </div>
      <h1 className="text-xl font-bold">프로필 편집</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">닉네임 · 학교 · 지역</CardTitle>
          <p className="text-sm text-muted-foreground">
            변경 후 저장하면 랭킹·대결에 반영됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">닉네임</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="표시 이름 (선택)"
                maxLength={32}
              />
            </div>
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
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "저장 중..." : "저장"}
              </Button>
              <Link href="/profile">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
