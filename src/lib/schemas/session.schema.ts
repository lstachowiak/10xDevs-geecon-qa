import { z } from "zod";

/**
 * Dozwolone pola do sortowania dla GET /api/sessions
 */
const sortableFields = ["createdAt", "sessionDate", "name"] as const;

/**
 * Dozwolone kierunki sortowania
 */
const sortOrders = ["asc", "desc"] as const;

/**
 * Schema for validating GET /api/sessions query parameters
 * Enforces:
 * - page: number >= 1, defaults to 1
 * - limit: number 1-100, defaults to 20
 * - sortBy: enum ["createdAt", "sessionDate", "name"], defaults to "createdAt"
 * - sortOrder: enum ["asc", "desc"], defaults to "desc"
 */
export const getSessionsQuerySchema = z.object({
  page: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined) return 1;
        if (typeof val === "string") {
          const parsed = parseInt(val, 10);
          return isNaN(parsed) ? val : parsed;
        }
        return val;
      },
      z.number().int().min(1, "Page must be at least 1")
    )
    .default(1),
  limit: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined) return 20;
        if (typeof val === "string") {
          const parsed = parseInt(val, 10);
          return isNaN(parsed) ? val : parsed;
        }
        return val;
      },
      z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100")
    )
    .default(20),
  sortBy: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined) return "createdAt";
        return val;
      },
      z.enum(sortableFields, { errorMap: () => ({ message: "sortBy must be one of: createdAt, sessionDate, name" }) })
    )
    .default("createdAt"),
  sortOrder: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined) return "desc";
        return val;
      },
      z.enum(sortOrders, { errorMap: () => ({ message: "sortOrder must be one of: asc, desc" }) })
    )
    .default("desc"),
});

/**
 * Type inference for validated query parameters
 */
export type GetSessionsQuery = z.infer<typeof getSessionsQuerySchema>;

/**
 * Schema for validating GET /api/sessions/:slug path parameters
 * Enforces:
 * - slug: non-empty string (unique URL identifier)
 */
export const getSessionBySlugParamsSchema = z.object({
  slug: z.string().min(1, "Slug is required and must be a non-empty string"),
});
