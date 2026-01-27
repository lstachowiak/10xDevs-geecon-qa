import { describe, it, expect } from "vitest";
import { getSessionsQuerySchema } from "../session.schema";
import { z } from "zod";

describe("session.schema", () => {
  describe("getSessionsQuerySchema", () => {
    describe("page parameter", () => {
      it("should use default value 1 when page is not provided", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({});

        // Assert
        expect(result.page).toBe(1);
      });

      it("should parse valid page number from string", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ page: "5" });

        // Assert
        expect(result.page).toBe(5);
      });

      it("should accept valid page number", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ page: 10 });

        // Assert
        expect(result.page).toBe(10);
      });

      it("should reject page less than 1", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ page: 0 })).toThrow("Page must be at least 1");
      });

      it("should reject negative page", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ page: -1 })).toThrow("Page must be at least 1");
      });

      it("should reject non-numeric page string", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ page: "abc" })).toThrow(z.ZodError);
      });

      it("should reject decimal page number", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ page: 1.5 })).toThrow(z.ZodError);
      });

      it("should use default 1 when page is null", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ page: null });

        // Assert
        expect(result.page).toBe(1);
      });

      it("should use default 1 when page is undefined", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ page: undefined });

        // Assert
        expect(result.page).toBe(1);
      });
    });

    describe("limit parameter", () => {
      it("should use default value 20 when limit is not provided", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({});

        // Assert
        expect(result.limit).toBe(20);
      });

      it("should parse valid limit from string", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: "50" });

        // Assert
        expect(result.limit).toBe(50);
      });

      it("should accept valid limit number", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: 75 });

        // Assert
        expect(result.limit).toBe(75);
      });

      it("should accept minimum limit (1)", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: 1 });

        // Assert
        expect(result.limit).toBe(1);
      });

      it("should accept maximum limit (100)", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: 100 });

        // Assert
        expect(result.limit).toBe(100);
      });

      it("should reject limit less than 1", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ limit: 0 })).toThrow("Limit must be at least 1");
      });

      it("should reject limit greater than 100", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ limit: 101 })).toThrow("Limit must not exceed 100");
      });

      it("should reject negative limit", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ limit: -5 })).toThrow("Limit must be at least 1");
      });

      it("should reject non-numeric limit string", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ limit: "many" })).toThrow(z.ZodError);
      });

      it("should reject decimal limit number", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ limit: 20.5 })).toThrow(z.ZodError);
      });

      it("should use default 20 when limit is null", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: null });

        // Assert
        expect(result.limit).toBe(20);
      });

      it("should use default 20 when limit is undefined", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ limit: undefined });

        // Assert
        expect(result.limit).toBe(20);
      });
    });

    describe("sortBy parameter", () => {
      it('should use default value "createdAt" when sortBy is not provided', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({});

        // Assert
        expect(result.sortBy).toBe("createdAt");
      });

      it('should accept "createdAt"', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortBy: "createdAt" });

        // Assert
        expect(result.sortBy).toBe("createdAt");
      });

      it('should accept "sessionDate"', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortBy: "sessionDate" });

        // Assert
        expect(result.sortBy).toBe("sessionDate");
      });

      it('should accept "name"', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortBy: "name" });

        // Assert
        expect(result.sortBy).toBe("name");
      });

      it("should reject invalid sortBy value", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ sortBy: "invalidField" })).toThrow(
          "sortBy must be one of: createdAt, sessionDate, name"
        );
      });

      it("should reject empty string", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ sortBy: "" })).toThrow(
          "sortBy must be one of: createdAt, sessionDate, name"
        );
      });

      it('should use default "createdAt" when sortBy is null', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortBy: null });

        // Assert
        expect(result.sortBy).toBe("createdAt");
      });

      it('should use default "createdAt" when sortBy is undefined', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortBy: undefined });

        // Assert
        expect(result.sortBy).toBe("createdAt");
      });
    });

    describe("sortOrder parameter", () => {
      it('should use default value "desc" when sortOrder is not provided', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({});

        // Assert
        expect(result.sortOrder).toBe("desc");
      });

      it('should accept "asc"', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortOrder: "asc" });

        // Assert
        expect(result.sortOrder).toBe("asc");
      });

      it('should accept "desc"', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortOrder: "desc" });

        // Assert
        expect(result.sortOrder).toBe("desc");
      });

      it("should reject invalid sortOrder value", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ sortOrder: "random" })).toThrow(
          "sortOrder must be one of: asc, desc"
        );
      });

      it("should reject empty string", () => {
        // Arrange & Act & Assert
        expect(() => getSessionsQuerySchema.parse({ sortOrder: "" })).toThrow("sortOrder must be one of: asc, desc");
      });

      it('should use default "desc" when sortOrder is null', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortOrder: null });

        // Assert
        expect(result.sortOrder).toBe("desc");
      });

      it('should use default "desc" when sortOrder is undefined', () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({ sortOrder: undefined });

        // Assert
        expect(result.sortOrder).toBe("desc");
      });
    });

    describe("combined parameters", () => {
      it("should parse all parameters together with valid values", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({
          page: "3",
          limit: "25",
          sortBy: "name",
          sortOrder: "asc",
        });

        // Assert
        expect(result).toEqual({
          page: 3,
          limit: 25,
          sortBy: "name",
          sortOrder: "asc",
        });
      });

      it("should use all defaults when no parameters provided", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({});

        // Assert
        expect(result).toEqual({
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
      });

      it("should handle partial parameters with defaults", () => {
        // Arrange & Act
        const result = getSessionsQuerySchema.parse({
          page: 5,
          sortBy: "sessionDate",
        });

        // Assert
        expect(result).toEqual({
          page: 5,
          limit: 20,
          sortBy: "sessionDate",
          sortOrder: "desc",
        });
      });

      it("should fail validation with multiple invalid parameters", () => {
        // Arrange & Act & Assert
        try {
          getSessionsQuerySchema.parse({
            page: -1,
            limit: 200,
            sortBy: "invalid",
            sortOrder: "random",
          });
          expect.fail("Should have thrown validation error");
        } catch (error) {
          expect(error).toBeInstanceOf(z.ZodError);
          const zodError = error as z.ZodError;
          expect(zodError.errors.length).toBeGreaterThanOrEqual(4);
        }
      });
    });
  });
});
