import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/arena");

  const supabase = await createClient();

  if (code) {
    // PKCE: 이메일 링크에서 code로 리다이렉트된 경우 (비밀번호 찾기 등)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    const nextUrl = next.startsWith("/") ? next : "/reset-password";
    return NextResponse.redirect(new URL(nextUrl, request.url));
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "email",
      token_hash,
    });
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    const nextUrl = next.startsWith("/") ? next : "/arena";
    return NextResponse.redirect(new URL(nextUrl, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
}
