import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../index";
import { getAllSessions } from "@/lib/services/sessions.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock the sessions service
vi.mock("@/lib/services/sessions.service", () => ({
  getAllSessions: vi.fn(),
}));

describe("GET /api/sessions", () => {
  let mockLocals: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock locals with supabase client
    mockLocals = {
      supabase: {} as SupabaseClient,
    };
  });

  describe("Success cases", () => {
    it("should return 200 with paginated sessions (default parameters)", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [
          {
            id: "session-1",
            name: "GeeCON 2026 - Keynote",
            speaker: "John Doe",
            description: "Opening keynote",
            sessionDate: "2026-05-15T09:00:00Z",
            uniqueUrlSlug: "geecon-2026-keynote",
            createdAt: "2026-01-27T10:00:00Z",
          },
          {
            id: "session-2",
            name: "Advanced TypeScript",
            speaker: "Jane Smith",
            description: null,
            sessionDate: null,
            uniqueUrlSlug: "advanced-typescript",
            createdAt: "2026-01-26T10:00:00Z",
          },
        ],
        total: 45,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        data: mockSessionsResponse.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 45,
          totalPages: 3,
        },
      });

      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return 200 with custom pagination (page 2, limit 10)", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [
          {
            id: "session-11",
            name: "Session 11",
            speaker: "Speaker 11",
            description: "Description 11",
            sessionDate: "2026-05-15T14:00:00Z",
            uniqueUrlSlug: "session-11",
            createdAt: "2026-01-20T10:00:00Z",
          },
        ],
        total: 25,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?page=2&limit=10", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });

    it("should return 200 with sorting by sessionDate ascending", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [
          {
            id: "session-1",
            name: "Early Session",
            speaker: "Speaker 1",
            description: "First session",
            sessionDate: "2026-05-15T09:00:00Z",
            uniqueUrlSlug: "early-session",
            createdAt: "2026-01-27T10:00:00Z",
          },
        ],
        total: 5,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?sortBy=sessionDate&sortOrder=asc", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 1,
        limit: 20,
        sortBy: "sessionDate",
        sortOrder: "asc",
      });
    });

    it("should return 200 with sorting by name ascending", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [
          {
            id: "session-1",
            name: "Alpha Session",
            speaker: "Speaker 1",
            description: "A session",
            sessionDate: "2026-05-15T09:00:00Z",
            uniqueUrlSlug: "alpha-session",
            createdAt: "2026-01-27T10:00:00Z",
          },
        ],
        total: 10,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?sortBy=name&sortOrder=asc", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 1,
        limit: 20,
        sortBy: "name",
        sortOrder: "asc",
      });
    });

    it("should return 200 with empty array when no sessions exist", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 0,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should calculate totalPages correctly (45 sessions, limit 20)", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 45,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?limit=20", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination.totalPages).toBe(3); // Math.ceil(45 / 20) = 3
    });

    it("should calculate totalPages correctly (100 sessions, limit 25)", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 100,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?limit=25", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.pagination.totalPages).toBe(4); // Math.ceil(100 / 25) = 4
    });
  });

  describe("Validation errors (400)", () => {
    it("should return 400 when page is less than 1", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?page=0", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          page: "Page must be at least 1",
        },
      });
      expect(getAllSessions).not.toHaveBeenCalled();
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return 400 when page is not a number", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?page=abc", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details).toHaveProperty("page");
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 when limit is less than 1", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?limit=0", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          limit: "Limit must be at least 1",
        },
      });
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 when limit exceeds 100", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?limit=101", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          limit: "Limit must not exceed 100",
        },
      });
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 when limit is not a number", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?limit=many", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details).toHaveProperty("limit");
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 when sortBy is invalid", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?sortBy=invalidField", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          sortBy: "sortBy must be one of: createdAt, sessionDate, name",
        },
      });
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 when sortOrder is invalid", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?sortOrder=random", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: "Validation failed",
        details: {
          sortOrder: "sortOrder must be one of: asc, desc",
        },
      });
      expect(getAllSessions).not.toHaveBeenCalled();
    });

    it("should return 400 with multiple validation errors", async () => {
      // Arrange
      const mockRequest = new Request("http://localhost/api/sessions?page=-1&limit=200&sortBy=invalid", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details).toHaveProperty("page");
      expect(body.details).toHaveProperty("limit");
      expect(body.details).toHaveProperty("sortBy");
      expect(getAllSessions).not.toHaveBeenCalled();
    });
  });

  describe("Server errors (500)", () => {
    it("should return 500 on database error", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      vi.mocked(getAllSessions).mockRejectedValue(new Error("Failed to fetch sessions: Database connection failed"));

      const mockRequest = new Request("http://localhost/api/sessions", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: "Internal server error",
      });

      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      expect(response.headers.get("Content-Type")).toBe("application/json");

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "GET /api/sessions failed:",
        expect.objectContaining({
          error: "Failed to fetch sessions: Database connection failed",
          stack: expect.any(String),
          timestamp: expect.any(String),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 500 on unexpected error", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      vi.mocked(getAllSessions).mockRejectedValue(new Error("Unexpected error"));

      const mockRequest = new Request("http://localhost/api/sessions", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: "Internal server error",
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should not expose internal error details to client", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      vi.mocked(getAllSessions).mockRejectedValue(
        new Error("SENSITIVE_INFO: Database password is wrong at connection string postgres://user:secret@host")
      );

      const mockRequest = new Request("http://localhost/api/sessions", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: "Internal server error",
      });
      // Ensure sensitive info is not in response
      expect(JSON.stringify(body)).not.toContain("SENSITIVE_INFO");
      expect(JSON.stringify(body)).not.toContain("password");
      expect(JSON.stringify(body)).not.toContain("secret");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge cases", () => {
    it("should handle page beyond total pages gracefully", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 10,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?page=100&limit=20", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);
      expect(body.pagination).toEqual({
        page: 100,
        limit: 20,
        total: 10,
        totalPages: 1,
      });
    });

    it("should handle maximum allowed limit (100)", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 100,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?limit=100", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });

    it("should handle all query parameters together", async () => {
      // Arrange
      const mockSessionsResponse = {
        data: [],
        total: 50,
      };

      vi.mocked(getAllSessions).mockResolvedValue(mockSessionsResponse);

      const mockRequest = new Request("http://localhost/api/sessions?page=3&limit=15&sortBy=name&sortOrder=asc", {
        method: "GET",
      });

      // Act
      const response = await GET({
        request: mockRequest,
        locals: mockLocals,
      } as any);

      // Assert
      expect(response.status).toBe(200);
      expect(getAllSessions).toHaveBeenCalledWith(mockLocals.supabase, {
        page: 3,
        limit: 15,
        sortBy: "name",
        sortOrder: "asc",
      });
    });
  });
});
