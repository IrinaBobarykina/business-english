import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/lib/config";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/session";

// Без действующей сессии открывается только экран PIN-кода.
// Это быстрая проверка по cookie; основная проверка — requireSession() в src/lib/auth.ts.

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const auth = getAuthConfig();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (auth && isValidSessionToken(token, auth.sessionSecret, auth.pin)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Статика Next.js, иконки и манифест (нужны для установки на экран «Домой») доступны без входа,
  // всё остальное — только после PIN-кода.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|icons/).*)"],
};
