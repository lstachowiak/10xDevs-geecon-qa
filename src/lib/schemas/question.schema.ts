import { z } from "zod";

/**
 * Schema for validating CreateQuestionCommand
 * Enforces:
 * - content: 5-500 characters (matches database CHECK constraint)
 * - authorName: optional, max 255 characters, defaults to "Anonymous"
 */
export const createQuestionSchema = z.object({
  content: z
    .string()
    .min(5, "Content must be at least 5 characters long")
    .max(500, "Content must not exceed 500 characters"),
  authorName: z.string().max(255, "Author name must not exceed 255 characters").optional().default("Anonymous"),
});

/**
 * Schema for validating GET /api/sessions/:slug/questions query parameters
 * Enforces:
 * - includeAnswered: boolean, defaults to false (only unanswered questions by default)
 */
export const getQuestionsQuerySchema = z.object({
  includeAnswered: z
    .preprocess((val) => {
      // Handle null/undefined -> default false
      if (val === null || val === undefined) return false;
      // Handle string values
      if (typeof val === "string") {
        const lower = val.toLowerCase();
        if (lower === "true" || lower === "1") return true;
        if (lower === "false" || lower === "0") return false;
        // Invalid string values should fail validation
        return val; // Let Zod handle the error
      }
      // Handle boolean and numbers
      return Boolean(val);
    }, z.boolean())
    .default(false),
});
