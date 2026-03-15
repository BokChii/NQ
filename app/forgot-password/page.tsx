"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : "";
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-[360px]">
          <CardHeader>
            <CardTitle className="text-center">이메일을 확인해 주세요</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {email}로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인한 뒤 링크를 클릭하세요.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                로그인으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[360px]">
        <CardHeader>
          <CardTitle className="text-center">비밀번호 찾기</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "보내는 중..." : "재설정 메일 보내기"}
            </Button>
          </form>
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
