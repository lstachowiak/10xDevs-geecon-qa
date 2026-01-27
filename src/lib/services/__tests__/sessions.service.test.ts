import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionBySlug, getAllSessions } from "../sessions.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { GetSessionsQuery } from "@/lib/schemas/session.schema";

describe("sessions.service", () => {
  describe("getSessionBySlug", () => {
    let mockSupabase: any;

    beforeEach(() => {
      // Reset mock before each test
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };
    });

    it("should return session with id when session exists", async () => {
      // Arrange
      const mockSessionData = { id: "session-123" };
      mockSupabase.single.mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      // Act
      const result = await getSessionBySlug(mockSupabase as unknown as SupabaseClient, "test-slug");

      // Assert
      expect(result).toEqual({ id: "session-123" });
      expect(mockSupabase.from).toHaveBeenCalledWith("sessions");
      expect(mockSupabase.select).toHaveBeenCalledWith("id");
      expect(mockSupabase.eq).toHaveBeenCalledWith("unique_url_slug", "test-slug");
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it("should return null when session does not exist", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      // Act
      const result = await getSessionBySlug(mockSupabase as unknown as SupabaseClient, "non-existent-slug");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when error occurs", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      // Act
      const result = await getSessionBySlug(mockSupabase as unknown as SupabaseClient, "any-slug");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when data is null even without error", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await getSessionBySlug(mockSupabase as unknown as SupabaseClient, "any-slug");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getAllSessions", () => {
    let mockSupabase: any;

    beforeEach(() => {
      // Reset mock before each test
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      };
    });

    it("should return sessions with default sorting (createdAt desc)", async () => {
      // Arrange
      const mockSessionsData = [
        {
          id: "session-1",
          name: "Session 1",
          speaker: "Speaker 1",
          description: "Description 1",
          session_date: "2026-01-27T10:00:00Z",
          unique_url_slug: "session-1",
          created_at: "2026-01-26T10:00:00Z",
        },
        {
          id: "session-2",
          name: "Session 2",
          speaker: "Speaker 2",
          description: null,
          session_date: null,
          unique_url_slug: "session-2",
          created_at: "2026-01-25T10:00:00Z",
        },
      ];

      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          // COUNT query
          return Promise.resolve({ count: 2, error: null });
        }
        // SELECT query
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: mockSessionsData,
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: "session-1",
        name: "Session 1",
        speaker: "Speaker 1",
        description: "Description 1",
        sessionDate: "2026-01-27T10:00:00Z",
        uniqueUrlSlug: "session-1",
        createdAt: "2026-01-26T10:00:00Z",
      });
      expect(result.data[1].description).toBeNull();
      expect(result.data[1].sessionDate).toBeNull();

      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19);
    });

    it("should handle pagination correctly (page 2, limit 10)", async () => {
      // Arrange
      const mockSessionsData = [
        {
          id: "session-11",
          name: "Session 11",
          speaker: "Speaker 11",
          description: "Description 11",
          session_date: "2026-01-20T10:00:00Z",
          unique_url_slug: "session-11",
          created_at: "2026-01-20T10:00:00Z",
        },
      ];

      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 25, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: mockSessionsData,
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(result.total).toBe(25);
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19); // offset 10, limit 10
    });

    it("should sort by sessionDate ascending", async () => {
      // Arrange
      const mockSessionsData = [
        {
          id: "session-1",
          name: "Session 1",
          speaker: "Speaker 1",
          description: "Description 1",
          session_date: "2026-01-20T10:00:00Z",
          unique_url_slug: "session-1",
          created_at: "2026-01-26T10:00:00Z",
        },
      ];

      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 1, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: mockSessionsData,
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "sessionDate",
        sortOrder: "asc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(mockSupabase.order).toHaveBeenCalledWith("session_date", { ascending: true });
      expect(result.data).toHaveLength(1);
    });

    it("should sort by name ascending", async () => {
      // Arrange
      const mockSessionsData = [
        {
          id: "session-1",
          name: "Alpha Session",
          speaker: "Speaker 1",
          description: "Description 1",
          session_date: "2026-01-20T10:00:00Z",
          unique_url_slug: "alpha-session",
          created_at: "2026-01-26T10:00:00Z",
        },
      ];

      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 1, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: mockSessionsData,
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "name",
        sortOrder: "asc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(mockSupabase.order).toHaveBeenCalledWith("name", { ascending: true });
      expect(result.data).toHaveLength(1);
    });

    it("should return empty array when no sessions exist", async () => {
      // Arrange
      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 0, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it("should throw error when COUNT query fails", async () => {
      // Arrange
      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: null, error: { message: "Database connection failed" } });
        }
        return mockSupabase;
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act & Assert
      await expect(getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams)).rejects.toThrow(
        "Failed to fetch sessions count: Database connection failed"
      );
    });

    it("should throw error when SELECT query fails", async () => {
      // Arrange
      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 10, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: "Query timeout" },
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act & Assert
      await expect(getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams)).rejects.toThrow(
        "Failed to fetch sessions: Query timeout"
      );
    });

    it("should handle null data gracefully (return empty array)", async () => {
      // Arrange
      mockSupabase.select.mockImplementation((columns: string, options?: any) => {
        if (options?.count === "exact" && options?.head === true) {
          return Promise.resolve({ count: 0, error: null });
        }
        return mockSupabase;
      });

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null,
      });

      const queryParams: GetSessionsQuery = {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Act
      const result = await getAllSessions(mockSupabase as unknown as SupabaseClient, queryParams);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
