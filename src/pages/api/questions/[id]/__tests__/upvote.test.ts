import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../upvote";
import { upvoteQuestion } from "@/lib/services/questions.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock the questions service
vi.mock("@/lib/services/questions.service", () => ({
  upvoteQuestion: vi.fn(),
}));

describe("POST /api/questions/:id/upvote", () => {
  let mockLocals: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock locals with supabase client
    mockLocals = {
      supabase: {} as SupabaseClient,
    };
  });

  it("should return 200 with updated upvote count on success", async () => {
    // Arrange
    const questionId = "550e8400-e29b-41d4-a716-446655440000";
    const mockUpvoteResponse = {
      id: questionId,
      upvoteCount: 43,
    };

    vi.mocked(upvoteQuestion).mockResolvedValue(mockUpvoteResponse);

    const mockRequest = new Request("http://localhost/api/questions/550e8400-e29b-41d4-a716-446655440000/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: questionId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      id: questionId,
      upvoteCount: 43,
    });

    expect(upvoteQuestion).toHaveBeenCalledWith(mockLocals.supabase, questionId);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should return 400 for invalid UUID format", async () => {
    // Arrange
    const invalidId = "not-a-uuid";
    const mockRequest = new Request("http://localhost/api/questions/not-a-uuid/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: invalidId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: "Validation failed",
      details: { id: "Invalid UUID format" },
    });

    expect(upvoteQuestion).not.toHaveBeenCalled();
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should return 404 when question does not exist", async () => {
    // Arrange
    const questionId = "550e8400-e29b-41d4-a716-446655440000";
    vi.mocked(upvoteQuestion).mockRejectedValue(new Error("Question not found"));

    const mockRequest = new Request("http://localhost/api/questions/550e8400-e29b-41d4-a716-446655440000/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: questionId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: "Question not found",
    });

    expect(upvoteQuestion).toHaveBeenCalledWith(mockLocals.supabase, questionId);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should return 500 on database error", async () => {
    // Arrange
    const questionId = "550e8400-e29b-41d4-a716-446655440000";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });

    vi.mocked(upvoteQuestion).mockRejectedValue(new Error("Failed to upvote question: Database connection failed"));

    const mockRequest = new Request("http://localhost/api/questions/550e8400-e29b-41d4-a716-446655440000/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: questionId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: "Failed to upvote question",
    });

    expect(upvoteQuestion).toHaveBeenCalledWith(mockLocals.supabase, questionId);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[POST /api/questions/:id/upvote]",
      expect.objectContaining({
        questionId,
        error: "Failed to upvote question: Database connection failed",
        timestamp: expect.any(String),
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle malformed UUID (partial UUID)", async () => {
    // Arrange
    const invalidId = "550e8400-e29b";
    const mockRequest = new Request("http://localhost/api/questions/550e8400-e29b/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: invalidId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: "Validation failed",
      details: { id: "Invalid UUID format" },
    });

    expect(upvoteQuestion).not.toHaveBeenCalled();
  });

  it("should handle empty string as id", async () => {
    // Arrange
    const invalidId = "";
    const mockRequest = new Request("http://localhost/api/questions//upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: invalidId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: "Validation failed",
      details: { id: "Invalid UUID format" },
    });

    expect(upvoteQuestion).not.toHaveBeenCalled();
  });

  it("should handle generic error without message", async () => {
    // Arrange
    const questionId = "550e8400-e29b-41d4-a716-446655440000";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });

    vi.mocked(upvoteQuestion).mockRejectedValue("Unknown error type");

    const mockRequest = new Request("http://localhost/api/questions/550e8400-e29b-41d4-a716-446655440000/upvote", {
      method: "POST",
    });

    // Act
    const response = await POST({
      params: { id: questionId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: "Failed to upvote question",
    });

    // Verify error was logged with "Unknown error"
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[POST /api/questions/:id/upvote]",
      expect.objectContaining({
        questionId,
        error: "Unknown error",
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should verify atomic increment by calling service with correct parameters", async () => {
    // Arrange
    const questionId = "123e4567-e89b-12d3-a456-426614174000";
    const mockUpvoteResponse = {
      id: questionId,
      upvoteCount: 1,
    };

    vi.mocked(upvoteQuestion).mockResolvedValue(mockUpvoteResponse);

    const mockRequest = new Request("http://localhost/api/questions/123e4567-e89b-12d3-a456-426614174000/upvote", {
      method: "POST",
    });

    // Act
    await POST({
      params: { id: questionId },
      locals: mockLocals,
      request: mockRequest,
    } as any);

    // Assert - verify service was called exactly once with correct params
    expect(upvoteQuestion).toHaveBeenCalledTimes(1);
    expect(upvoteQuestion).toHaveBeenCalledWith(mockLocals.supabase, questionId);
  });
});
