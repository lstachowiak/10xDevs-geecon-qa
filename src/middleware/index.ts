import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Home page
  "/",
  // Session pages (accessible without login)
  "/session",
  // Auth pages
  "/auth/register",
  "/auth/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Public API endpoints
  "/api/sessions",
  "/api/questions",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Protect /moderator/* routes
  if (url.pathname.startsWith("/moderator") && !user) {
    return redirect("/");
  }

  // Allow access to public paths without authentication
  if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path)) || url.pathname.startsWith("/session/")) {
    return next();
  }

  return next();
});
