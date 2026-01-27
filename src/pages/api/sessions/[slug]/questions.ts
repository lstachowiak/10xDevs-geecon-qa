import type { APIRoute } from "astro";
import { z } from "zod";
import { createQuestionSchema, getQuestionsQuerySchema } from "@/lib/schemas/question.schema";
import { getSessionBySlug } from "@/lib/services/sessions.service";
import { createQuestion, getQuestionsBySessionId } from "@/lib/services/questions.service";
import type { ErrorResponseDTO, QuestionDTO, QuestionsListResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/sessions/:slug/questions
 * Public endpoint to retrieve all questions for a session
 * Optional filtering to hide answered questions
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // Extract slug from path parameters
    const { slug } = params;

    if (!slug) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: { slug: "Slug parameter is required" },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      includeAnswered: url.searchParams.get("includeAnswered"),
    };

    let validated;
    try {
      validated = getQuestionsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: ErrorResponseDTO = {
          error: "Validation failed",
          details: Object.fromEntries(error.errors.map((e) => [e.path.join("."), e.message])),
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    const { includeAnswered } = validated;

    // Get Supabase client from locals
    const supabase = locals.supabase;

    // Verify session exists
    const session = await getSessionBySlug(supabase, slug);

    if (!session) {
      const errorResponse: ErrorResponseDTO = {
        error: "Session not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get questions for the session
    const questions = await getQuestionsBySessionId(supabase, session.id, includeAnswered);

    // Prepare response
    const response: QuestionsListResponseDTO = {
      data: questions,
    };

    // Return response with cache headers for optimization
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, s-maxage=60",
      },
    });
  } catch (error) {
    // Log error for monitoring
    console.error("[GET /api/sessions/:slug/questions]", {
      slug: params.slug,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate input using Zod schema
    const validation = createQuestionSchema.safeParse(body);
    if (!validation.success) {
      const details: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          details[err.path[0].toString()] = err.message;
        }
      });

      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // 4. Verify session exists by slug
    const slug = params.slug;
    if (!slug) {
      const errorResponse: ErrorResponseDTO = {
        error: "Session slug is required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await getSessionBySlug(supabase, slug);
    if (!session) {
      const errorResponse: ErrorResponseDTO = {
        error: "Session not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Create question (happy path)
    const question = await createQuestion(supabase, session.id, validation.data);

    // 6. Return created question with 201 status
    return new Response(JSON.stringify(question), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error("Error creating question:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
