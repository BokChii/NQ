import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-primary">NQ</h1>
      <p className="text-muted-foreground text-center text-sm">
        News Quotient — 뉴스 퀴즈로 지적 성장을 증명하세요.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-[320px]">
        <Link
          href="/login"
          className="rounded-lg bg-primary text-primary-foreground py-3 px-4 text-center font-medium"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-border py-3 px-4 text-center font-medium"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
