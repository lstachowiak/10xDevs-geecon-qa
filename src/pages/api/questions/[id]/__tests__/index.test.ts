/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "../index";

vi.mock("@/lib/services/questions.service", () => ({
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}));

import { updateQuestion, deleteQuestion } from "@/lib/services/questions.service";

describe("PATCH /api/questions/:id", () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      params: {},
      request: new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      }),
      locals: {
        supabase: {},
      },
    };
  });

  describe("Success cases (200)", () => {
    it("should update question isAnswered to true", async () => {
      // Arrange
      const mockUpdatedQuestion = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "660e8400-e29b-41d4-a716-446655440001",
        content: "What is the difference between REST and GraphQL?",
        authorName: "Jane Smith",
        isAnswered: true,
        upvoteCount: 5,
        createdAt: "2026-01-27T10:00:00Z",
      };

      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockResolvedValue(mockUpdatedQuestion);

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedQuestion);
      expect(data.isAnswered).toBe(true);
      expect(updateQuestion).toHaveBeenCalledWith(mockContext.locals.supabase, "550e8400-e29b-41d4-a716-446655440000", {
        isAnswered: true,
      });
    });

    it("should update question isAnswered to false", async () => {
      // Arrange
      const mockUpdatedQuestion = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "660e8400-e29b-41d4-a716-446655440001",
        content: "Test question",
        authorName: "John Doe",
        isAnswered: false,
        upvoteCount: 3,
        createdAt: "2026-01-27T10:00:00Z",
      };

      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: false }),
      });

      vi.mocked(updateQuestion).mockResolvedValue(mockUpdatedQuestion);

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.isAnswered).toBe(false);
    });

    it("should handle empty request body (no changes)", async () => {
      // Arrange
      const mockUpdatedQuestion = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "660e8400-e29b-41d4-a716-446655440001",
        content: "Test question",
        authorName: "John Doe",
        isAnswered: false,
        upvoteCount: 3,
        createdAt: "2026-01-27T10:00:00Z",
      };

      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      vi.mocked(updateQuestion).mockResolvedValue(mockUpdatedQuestion);

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedQuestion);
      expect(updateQuestion).toHaveBeenCalledWith(
        mockContext.locals.supabase,
        "550e8400-e29b-41d4-a716-446655440000",
        {}
      );
    });
  });

  describe("Validation errors (400)", () => {
    it("should return 400 when UUID is invalid", async () => {
      // Arrange
      mockContext.params = { id: "invalid-uuid" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Validation failed",
        details: {
          id: "Invalid UUID format",
        },
      });
      expect(updateQuestion).not.toHaveBeenCalled();
    });

    it("should return 400 when UUID is missing", async () => {
      // Arrange
      mockContext.params = {};
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toHaveProperty("id");
    });

    it("should return 400 when isAnswered is not a boolean (string)", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: "true" }),
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Validation failed",
        details: {
          isAnswered: expect.stringContaining("boolean"),
        },
      });
      expect(updateQuestion).not.toHaveBeenCalled();
    });

    it("should return 400 when isAnswered is not a boolean (number)", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: 1 }),
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toHaveProperty("isAnswered");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Invalid JSON",
      });
      expect(updateQuestion).not.toHaveBeenCalled();
    });

    it("should reject additional fields in request body", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAnswered: true,
          content: "Trying to update content",
          upvoteCount: 999,
        }),
      });

      vi.mocked(updateQuestion).mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "660e8400-e29b-41d4-a716-446655440001",
        content: "Original content",
        authorName: "John Doe",
        isAnswered: true,
        upvoteCount: 5,
        createdAt: "2026-01-27T10:00:00Z",
      });

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // Verify only isAnswered was passed to service (Zod strips extra fields)
      expect(updateQuestion).toHaveBeenCalledWith(mockContext.locals.supabase, "550e8400-e29b-41d4-a716-446655440000", {
        isAnswered: true,
      });
      // Verify other fields weren't updated
      expect(data.content).toBe("Original content");
      expect(data.upvoteCount).toBe(5);
    });
  });

  describe("Not found errors (404)", () => {
    it("should return 404 when question does not exist", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "Question not found",
      });
    });

    it("should return 404 for valid UUID but non-existent question", async () => {
      // Arrange
      mockContext.params = { id: "123e4567-e89b-12d3-a456-426614174000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: false }),
      });

      vi.mocked(updateQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Question not found");
    });
  });

  describe("Server errors (500)", () => {
    it("should return 500 when database error occurs", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockRejectedValue(new Error("Failed to update question: Database connection failed"));

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to update question",
      });
    });

    it("should return 500 when unexpected error occurs", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockRejectedValue(new Error("Unexpected server error"));

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update question");
    });

    it("should handle non-Error thrown values", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockRejectedValue("String error");

      // Act
      const response = await PATCH(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to update question",
      });
    });
  });

  describe("Response headers", () => {
    it("should return correct Content-Type header on success", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      vi.mocked(updateQuestion).mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440000",
        sessionId: "660e8400-e29b-41d4-a716-446655440001",
        content: "Test",
        authorName: "John",
        isAnswered: true,
        upvoteCount: 5,
        createdAt: "2026-01-27T10:00:00Z",
      });

      // Act
      const response = await PATCH(mockContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return correct Content-Type header on error", async () => {
      // Arrange
      mockContext.params = { id: "invalid-uuid" };
      mockContext.request = new Request("http://localhost/api/questions/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: true }),
      });

      // Act
      const response = await PATCH(mockContext);

      // Assert
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});

describe("DELETE /api/questions/:id", () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      params: {},
      request: new Request("http://localhost/api/questions/test-id", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }),
      locals: {
        supabase: {},
      },
    };
  });

  describe("Success cases (204)", () => {
    it("should successfully delete a question", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      expect(deleteQuestion).toHaveBeenCalledWith(mockContext.locals.supabase, "550e8400-e29b-41d4-a716-446655440000");
    });

    it("should return no content body on successful deletion", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);
      const body = await response.text();

      // Assert
      expect(response.status).toBe(204);
      expect(body).toBe("");
    });

    it("should call deleteQuestion with correct parameters", async () => {
      // Arrange
      const questionId = "123e4567-e89b-12d3-a456-426614174000";
      mockContext.params = { id: questionId };

      vi.mocked(deleteQuestion).mockResolvedValue(undefined);

      // Act
      await DELETE(mockContext);

      // Assert
      expect(deleteQuestion).toHaveBeenCalledTimes(1);
      expect(deleteQuestion).toHaveBeenCalledWith(mockContext.locals.supabase, questionId);
    });
  });

  describe("Validation errors (400)", () => {
    it("should return 400 when UUID is invalid", async () => {
      // Arrange
      mockContext.params = { id: "invalid-uuid" };

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Validation failed",
        details: {
          id: "Invalid UUID format",
        },
      });
      expect(deleteQuestion).not.toHaveBeenCalled();
    });

    it("should return 400 when UUID is missing", async () => {
      // Arrange
      mockContext.params = {};

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toHaveProperty("id");
      expect(deleteQuestion).not.toHaveBeenCalled();
    });

    it("should return 400 when UUID is empty string", async () => {
      // Arrange
      mockContext.params = { id: "" };

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toHaveProperty("id");
      expect(deleteQuestion).not.toHaveBeenCalled();
    });

    it("should return 400 when UUID has invalid format (too short)", async () => {
      // Arrange
      mockContext.params = { id: "123" };

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Validation failed",
        details: {
          id: "Invalid UUID format",
        },
      });
      expect(deleteQuestion).not.toHaveBeenCalled();
    });
  });

  describe("Not found errors (404)", () => {
    it("should return 404 when question does not exist", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "Question not found",
      });
    });

    it("should return 404 for valid UUID but non-existent question", async () => {
      // Arrange
      mockContext.params = { id: "123e4567-e89b-12d3-a456-426614174000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Question not found");
    });

    it("should verify deleteQuestion was called before returning 404", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      await DELETE(mockContext);

      // Assert
      expect(deleteQuestion).toHaveBeenCalledWith(mockContext.locals.supabase, "550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("Server errors (500)", () => {
    it("should return 500 when database error occurs", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Failed to delete question: Database connection failed"));

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to delete question",
      });
    });

    it("should return 500 when unexpected error occurs", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Unexpected server error"));

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete question");
    });

    it("should handle non-Error thrown values", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue("String error");

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to delete question",
      });
    });

    it("should handle timeout errors", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Request timeout"));

      // Act
      const response = await DELETE(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete question");
    });
  });

  describe("Response headers", () => {
    it("should not have Content-Type header on successful delete (204)", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      // 204 No Content should not have Content-Type header
    });

    it("should return correct Content-Type header on validation error", async () => {
      // Arrange
      mockContext.params = { id: "invalid-uuid" };

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return correct Content-Type header on not found error", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Question not found"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return correct Content-Type header on server error", async () => {
      // Arrange
      mockContext.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      vi.mocked(deleteQuestion).mockRejectedValue(new Error("Database error"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
