import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionBySlug } from '../sessions.service';
import type { SupabaseClient } from '@/db/supabase.client';

describe('sessions.service', () => {
  describe('getSessionBySlug', () => {
    let mockSupabase: any;

    beforeEach(() => {
      // Reset mock before each test
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      };
    });

    it('should return session with id when session exists', async () => {
      // Arrange
      const mockSessionData = { id: 'session-123' };
      mockSupabase.single.mockResolvedValue({
        data: mockSessionData,
        error: null
      });

      // Act
      const result = await getSessionBySlug(
        mockSupabase as unknown as SupabaseClient,
        'test-slug'
      );

      // Assert
      expect(result).toEqual({ id: 'session-123' });
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('unique_url_slug', 'test-slug');
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should return null when session does not exist', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      // Act
      const result = await getSessionBySlug(
        mockSupabase as unknown as SupabaseClient,
        'non-existent-slug'
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when error occurs', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      // Act
      const result = await getSessionBySlug(
        mockSupabase as unknown as SupabaseClient,
        'any-slug'
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when data is null even without error', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      // Act
      const result = await getSessionBySlug(
        mockSupabase as unknown as SupabaseClient,
        'any-slug'
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});
