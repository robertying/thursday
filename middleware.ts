import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const redirects: Record<string, string> = {
  "/coursex": "/courses",
  "/learn": "/learnX",
  "/xlearn": "/learnX",
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname.toLowerCase();

  if (redirects[url]) {
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = redirects[url];
    const response = NextResponse.redirect(newUrl, 301);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
