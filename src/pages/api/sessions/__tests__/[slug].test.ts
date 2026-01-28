import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../[slug]";

vi.mock("@/lib/services/sessions.service", () => ({
  getSessionBySlug: vi.fn(),
}));

import { getSessionBySlug } from "@/lib/services/sessions.service";

describe("GET /api/sessions/:slug", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      params: {},
      locals: {
        supabase: {},
      },
    };
  });

  describe("Validation", () => {
    it("should return 400 when slug is missing", async () => {
      // Arrange
      mockContext.params = {};

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          slug: ["Required"],
        },
      });
      expect(getSessionBySlug).not.toHaveBeenCalled();
    });

    it("should return 400 when slug is empty string", async () => {
      // Arrange
      mockContext.params = { slug: "" };

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          slug: ["Slug is required and must be a non-empty string"],
        },
      });
      expect(getSessionBySlug).not.toHaveBeenCalled();
    });
  });

  describe("Success cases", () => {
    it("should return 200 with full session data when session exists", async () => {
      // Arrange
      const mockSession = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Introduction to GraphQL",
        speaker: "John Doe",
        description: "Learn the basics of GraphQL",
        sessionDate: "2026-05-15T14:00:00Z",
        uniqueUrlSlug: "abc123xyz",
        createdAt: "2026-01-26T10:00:00Z",
      };

      mockContext.params = { slug: "abc123xyz" };
      vi.mocked(getSessionBySlug).mockResolvedValue(mockSession);

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockSession);
      expect(getSessionBySlug).toHaveBeenCalledWith(mockContext.locals.supabase, "abc123xyz");
    });

    it("should return 200 with session having null description and sessionDate", async () => {
      // Arrange
      const mockSession = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Quick Talk",
        speaker: "Jane Smith",
        description: null,
        sessionDate: null,
        uniqueUrlSlug: "quick-talk",
        createdAt: "2026-01-26T10:00:00Z",
      };

      mockContext.params = { slug: "quick-talk" };
      vi.mocked(getSessionBySlug).mockResolvedValue(mockSession);

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockSession);
      expect(body.description).toBeNull();
      expect(body.sessionDate).toBeNull();
    });

    it("should handle slug with special characters", async () => {
      // Arrange
      const mockSession = {
        id: "test-id",
        name: "Test Session",
        speaker: "Test Speaker",
        description: "Test description",
        sessionDate: "2026-01-27T10:00:00Z",
        uniqueUrlSlug: "test-slug-2026",
        createdAt: "2026-01-26T10:00:00Z",
      };

      mockContext.params = { slug: "test-slug-2026" };
      vi.mocked(getSessionBySlug).mockResolvedValue(mockSession);

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockSession);
    });
  });

  describe("Not found cases", () => {
    it("should return 404 when session does not exist", async () => {
      // Arrange
      mockContext.params = { slug: "non-existent-slug" };
      vi.mocked(getSessionBySlug).mockResolvedValue(null);

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body).toEqual({ error: "Session not found" });
      expect(getSessionBySlug).toHaveBeenCalledWith(mockContext.locals.supabase, "non-existent-slug");
    });

    it("should return 404 for deleted or inactive session", async () => {
      // Arrange
      mockContext.params = { slug: "deleted-session" };
      vi.mocked(getSessionBySlug).mockResolvedValue(null);

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body).toEqual({ error: "Session not found" });
    });
  });

  describe("Error cases", () => {
    it("should return 500 when database error occurs", async () => {
      // Arrange
      mockContext.params = { slug: "test-slug" };
      vi.mocked(getSessionBySlug).mockRejectedValue(new Error("Database connection failed"));

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
      expect(getSessionBySlug).toHaveBeenCalledWith(mockContext.locals.supabase, "test-slug");
    });

    it("should return 500 when unexpected error occurs", async () => {
      // Arrange
      mockContext.params = { slug: "test-slug" };
      vi.mocked(getSessionBySlug).mockRejectedValue(new Error("Unexpected error"));

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should handle service throwing non-Error objects", async () => {
      // Arrange
      mockContext.params = { slug: "test-slug" };
      vi.mocked(getSessionBySlug).mockRejectedValue("String error");

      // Act
      const response = await GET(mockContext);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
    });
  });

  describe("Response headers", () => {
    it("should return correct Content-Type header", async () => {
      // Arrange
      const mockSession = {
        id: "test-id",
        name: "Test Session",
        speaker: "Test Speaker",
        description: "Test",
        sessionDate: "2026-01-27T10:00:00Z",
        uniqueUrlSlug: "test-slug",
        createdAt: "2026-01-26T10:00:00Z",
      };

      mockContext.params = { slug: "test-slug" };
      vi.mocked(getSessionBySlug).mockResolvedValue(mockSession);

      // Act
      const response = await GET(mockContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return correct Content-Type header on error", async () => {
      // Arrange
      mockContext.params = { slug: "non-existent" };
      vi.mocked(getSessionBySlug).mockResolvedValue(null);

      // Act
      const response = await GET(mockContext);

      // Assert
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
