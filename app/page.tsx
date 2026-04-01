import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12 flex flex-col items-center justify-center gap-8 bg-app">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">News Quotient</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          <span className="bg-gradient-to-br from-primary via-primary to-accent-v bg-clip-text text-transparent">NQ</span>
        </h1>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          뉴스 퀴즈로 지적 성장을 증명하세요. 짧게, 매일, 재미있게.
        </p>
      </div>
      <div className="relative z-10 flex w-full max-w-[320px] flex-col gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-gradient-to-br from-primary to-primary/90 py-3.5 px-4 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border-2 border-primary/25 bg-card/80 py-3.5 px-4 text-center text-sm font-semibold text-foreground shadow-card backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
