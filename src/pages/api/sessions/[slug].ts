import type { APIRoute } from "astro";
import { getSessionBySlugParamsSchema } from "@/lib/schemas/session.schema";
import { getSessionBySlug } from "@/lib/services/sessions.service";

export const prerender = false;

/**
 * GET /api/sessions/:slug
 * Public endpoint to retrieve session details by unique URL slug
 *
 * @param params.slug - Unique URL identifier for the session
 * @returns 200 with SessionDTO on success
 * @returns 400 on validation error
 * @returns 404 when session not found
 * @returns 500 on server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate path parameters
    const validation = getSessionBySlugParamsSchema.safeParse(params);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { slug } = validation.data;

    // Fetch session by slug
    const session = await getSessionBySlug(locals.supabase, slug);

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
