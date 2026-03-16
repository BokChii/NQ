"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function isValidEmail(value: string) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function isStrongPassword(value: string) {
    return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("이메일 형식을 다시 확인해 주세요.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("비밀번호는 영문과 숫자를 포함한 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-[360px]">
          <CardHeader>
            <CardTitle className="text-center">이메일을 확인해 주세요</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground text-center">
            <p>
              <span className="font-medium text-foreground">{email}</span> 주소로
              인증 메일을 보냈어요.
            </p>
            <p>메일함에서 안내 메일을 열고, 링크를 눌러 회원가입을 완료해 주세요.</p>
            <p className="text-xs">
              메일이 보이지 않으면 스팸함도 한 번 확인해 주세요.
            </p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              다른 이메일로 다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[360px]">
        <CardHeader>
          <CardTitle className="text-center">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="홍길동"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                로그인과 인증에 사용될 이메일 주소를 입력해 주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="영문·숫자 포함 8자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                영문, 숫자를 모두 포함하여 8자 이상으로 설정해 주세요.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "가입하기"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
