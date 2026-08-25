/**
 * Route protection at the edge: anything under /dashboard, /attend or
 * /admin requires a valid session token. Fine-grained role checks happen
 * server-side in each route handler / server component.
 */
import { withAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

// NextAuth v4's middleware overloads predate Next 16's route typings.
// At runtime `withAuth` accepts the request directly, so adapt it to Next's
// middleware signature rather than re-exporting it (which Next 16 cannot detect).
//
// `pages.signIn` must be repeated here: withAuth reads its own options, not
// authOptions, so without it a logged-out member who taps a shared /attend
// link lands on NextAuth's unbranded /api/auth/signin scaffold instead of the
// club landing page with the Google button.
const requireAuth = withAuth({ pages: { signIn: "/" } }) as unknown as NextMiddleware;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  return requireAuth(request, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/attend/:path*", "/admin/:path*"],
};
