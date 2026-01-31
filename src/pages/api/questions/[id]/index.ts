import type { APIRoute } from "astro";
import { updateQuestion, deleteQuestion } from "@/lib/services/questions.service";
import { updateQuestionSchema, idParamSchema } from "@/lib/schemas/question.schema";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * PATCH /api/questions/:id
 * Update question properties (e.g., mark as answered)
 *
 * @param params.id - UUID of the question to update
 * @param request.body - Update data (isAnswered: boolean)
 * @returns 200 with QuestionDTO on success
 * @returns 400 on validation error (invalid UUID or request body)
 * @returns 404 when question not found
 * @returns 500 on server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate UUID parameter
    const idValidation = idParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: {
          id: idValidation.error.errors[0]?.message || "Invalid UUID format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid JSON",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = updateQuestionSchema.safeParse(body);

    if (!bodyValidation.success) {
      const details: Record<string, string> = {};
      bodyValidation.error.errors.forEach((err) => {
        const path = err.path.join(".") || "body";
        details[path] = err.message;
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

    // 3. Update question
    const question = await updateQuestion(locals.supabase, idValidation.data, bodyValidation.data);

    // 4. Return success response
    return new Response(JSON.stringify(question), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle question not found error
    if (error instanceof Error && error.message === "Question not found") {
      // eslint-disable-next-line no-console
      console.error("[PATCH /api/questions/:id]", {
        questionId: params.id,
        error: "Question not found",
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ErrorResponseDTO = {
        error: "Question not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle other server errors
    // eslint-disable-next-line no-console
    console.error("[PATCH /api/questions/:id]", {
      questionId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to update question",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/questions/:id
 * Delete a question
 *
 * @param params.id - UUID of the question to delete
 * @returns 204 on success
 * @returns 400 on validation error (invalid UUID)
 * @returns 404 when question not found
 * @returns 500 on server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate UUID parameter
    const idValidation = idParamSchema.safeParse(params.id);

    if (!idValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details: {
          id: idValidation.error.errors[0]?.message || "Invalid UUID format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Delete question
    await deleteQuestion(locals.supabase, idValidation.data);

    // 3. Return success response
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle question not found error
    if (error instanceof Error && error.message === "Question not found") {
      // eslint-disable-next-line no-console
      console.error("[DELETE /api/questions/:id]", {
        questionId: params.id,
        error: "Question not found",
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ErrorResponseDTO = {
        error: "Question not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle other server errors
    // eslint-disable-next-line no-console
    console.error("[DELETE /api/questions/:id]", {
      questionId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ErrorResponseDTO = {
      error: "Failed to delete question",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
