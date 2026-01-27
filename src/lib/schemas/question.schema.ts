import { z } from 'zod';

/**
 * Schema for validating CreateQuestionCommand
 * Enforces:
 * - content: 5-500 characters (matches database CHECK constraint)
 * - authorName: optional, max 255 characters, defaults to "Anonymous"
 */
export const createQuestionSchema = z.object({
  content: z.string()
    .min(5, 'Content must be at least 5 characters long')
    .max(500, 'Content must not exceed 500 characters'),
  authorName: z.string()
    .max(255, 'Author name must not exceed 255 characters')
    .optional()
    .default('Anonymous')
});
