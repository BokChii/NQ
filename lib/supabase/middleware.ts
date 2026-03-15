import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthRoute = /^\/(login|signup)$/.test(path);
  const isOnboarding = path === "/onboarding";
  const isProtected =
    path.startsWith("/arena") ||
    path.startsWith("/shorts") ||
    path.startsWith("/rivalry") ||
    path.startsWith("/profile");
  if (user && isAuthRoute) {
    const redirect = NextResponse.redirect(new URL("/onboarding", request.url));
    response.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value, { path: "/" })
    );
    return redirect;
  }
  if (!user && (isProtected || isOnboarding)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}
