import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic user agent check
function isDesktop(userAgent: string): boolean {
  const mobileRegex =
    /(android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini)/i;
  return !mobileRegex.test(userAgent);
}

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";

  if (!isDesktop(ua)) {
    // 🚫 Block or redirect mobiles
    return NextResponse.rewrite(new URL("/unsupported", req.url));
  }

  return NextResponse.next();
}

// Apply to all routes under /dashboard (or whole app if you want)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
