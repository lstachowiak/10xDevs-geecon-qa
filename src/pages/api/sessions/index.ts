import type { APIRoute } from "astro";
import { z } from "zod";
import { getSessionsQuerySchema, createSessionBodySchema } from "@/lib/schemas/session.schema";
import { getAllSessions, deleteSession, createSession } from "@/lib/services/sessions.service";
import type { ErrorResponseDTO, SessionListResponseDTO, SessionDTO } from "@/types";

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
    // eslint-disable-next-line no-console
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

/**
 * DELETE /api/sessions
 * Protected endpoint - deletes a session by ID
 * Requires authentication (moderator role)
 *
 * Body: { id: string } - UUID of the session to delete
 * @returns 204 - No Content on successful deletion
 * @returns 400 - ErrorResponseDTO for invalid or missing session ID
 * @returns 401 - ErrorResponseDTO for unauthorized access
 * @returns 500 - ErrorResponseDTO for server errors
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid JSON body",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate session ID
    const { id } = body;

    if (!id || typeof id !== "string") {
      const errorResponse: ErrorResponseDTO = {
        error: "Session ID is required",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid session ID format",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get Supabase client from locals
    const supabase = locals.supabase;

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Delete session using service
    await deleteSession(supabase, id);

    // Return 204 No Content on success
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Log error details server-side
    // eslint-disable-next-line no-console
    console.error("DELETE /api/sessions failed:", {
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

/**
 * POST /api/sessions
 * Protected endpoint - creates a new Q&A session
 * Requires authentication (moderator role)
 *
 * Body: CreateSessionCommand
 * - name: string (required)
 * - speaker: string (required)
 * - description?: string (optional)
 * - sessionDate?: string (optional, ISO 8601 datetime)
 *
 * @returns 201 - SessionDTO with created session data
 * @returns 400 - ErrorResponseDTO for validation errors
 * @returns 401 - ErrorResponseDTO for unauthorized access
 * @returns 500 - ErrorResponseDTO for server errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid JSON body",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate request body using Zod schema
    let validated;
    try {
      validated = createSessionBodySchema.parse(body);
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

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Create session using service
    const createdSession = await createSession(supabase, validated);

    // Return created session
    const response: SessionDTO = createdSession;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error details server-side
    // eslint-disable-next-line no-console
    console.error("POST /api/sessions failed:", {
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
