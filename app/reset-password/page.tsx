"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setHasSession(!!user);
      setLoading(false);
    })();
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) {
      setError(err.message);
      toast.error("비밀번호 변경에 실패했습니다.");
      return;
    }
    toast.success("비밀번호가 변경되었습니다.");
    router.push("/login?reset=1");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">로딩 중...</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-[360px]">
          <CardHeader>
            <CardTitle className="text-center">유효한 링크가 아닙니다</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              비밀번호 재설정 링크가 만료되었거나 이미 사용되었을 수 있습니다. 다시 요청해 주세요.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full">비밀번호 찾기</Button>
            </Link>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline">
                로그인
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[360px]">
        <CardHeader>
          <CardTitle className="text-center">새 비밀번호</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            사용할 새 비밀번호를 입력하세요.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="다시 입력"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "저장 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
