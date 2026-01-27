import type { APIRoute } from "astro";
import { z } from "zod";
import { getSessionsQuerySchema } from "@/lib/schemas/session.schema";
import { getAllSessions } from "@/lib/services/sessions.service";
import type { ErrorResponseDTO, SessionListResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/sessions
 * Public endpoint - retrieves paginated list of all Q&A sessions
 *
 * Query Parameters (all optional):
 * - page: number (default: 1, min: 1)
 * - limit: number (default: 20, range: 1-100)
 * - sortBy: "createdAt" | "sessionDate" | "name" (default: "createdAt")
 * - sortOrder: "asc" | "desc" (default: "desc")
 *
 * @returns 200 - SessionListResponseDTO with paginated sessions
 * @returns 400 - ErrorResponseDTO for validation errors
 * @returns 500 - ErrorResponseDTO for server errors
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Extract query parameters from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sortBy: url.searchParams.get("sortBy"),
      sortOrder: url.searchParams.get("sortOrder"),
    };

    // Validate query parameters using Zod schema
    let validated;
    try {
      validated = getSessionsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce(
          (acc, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );

        const errorResponse: ErrorResponseDTO = {
          error: "Validation failed",
          details,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      throw error;
    }

    // Get Supabase client from locals
    const supabase = locals.supabase;

    // Fetch sessions from service
    const { data, total } = await getAllSessions(supabase, validated);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);

    // Construct response
    const response: SessionListResponseDTO = {
      data,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error details server-side (not exposed to client)
    console.error("GET /api/sessions failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
