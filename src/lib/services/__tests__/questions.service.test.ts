import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestion } from '../questions.service';
import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateQuestionCommand } from '@/types';

describe('questions.service', () => {
  describe('createQuestion', () => {
    let mockSupabase: any;

    beforeEach(() => {
      // Reset mock before each test
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      };
    });

    it('should create question with provided author name', async () => {
      // Arrange
      const sessionId = 'session-123';
      const command: CreateQuestionCommand = {
        content: 'What is the difference between REST and GraphQL?',
        authorName: 'Jane Smith'
      };

      const mockDbResponse = {
        id: 'question-456',
        session_id: sessionId,
        content: command.content,
        author_name: 'Jane Smith',
        is_answered: false,
        upvote_count: 0,
        created_at: '2026-01-27T10:30:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockDbResponse,
        error: null
      });

      // Act
      const result = await createQuestion(
        mockSupabase as unknown as SupabaseClient,
        sessionId,
        command
      );

      // Assert
      expect(result).toEqual({
        id: 'question-456',
        sessionId: sessionId,
        content: command.content,
        authorName: 'Jane Smith',
        isAnswered: false,
        upvoteCount: 0,
        createdAt: '2026-01-27T10:30:00Z'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('questions');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        session_id: sessionId,
        content: command.content,
        author_name: 'Jane Smith'
      });
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should create question with "Anonymous" when author name not provided', async () => {
      // Arrange
      const sessionId = 'session-123';
      const command: CreateQuestionCommand = {
        content: 'Could you explain this concept?'
      };

      const mockDbResponse = {
        id: 'question-789',
        session_id: sessionId,
        content: command.content,
        author_name: 'Anonymous',
        is_answered: false,
        upvote_count: 0,
        created_at: '2026-01-27T11:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockDbResponse,
        error: null
      });

      // Act
      const result = await createQuestion(
        mockSupabase as unknown as SupabaseClient,
        sessionId,
        command
      );

      // Assert
      expect(result.authorName).toBe('Anonymous');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        session_id: sessionId,
        content: command.content,
        author_name: 'Anonymous'
      });
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      const sessionId = 'session-123';
      const command: CreateQuestionCommand = {
        content: 'Valid question?'
      };

      const mockError = new Error('Database connection failed');
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError
      });

      // Act & Assert
      await expect(
        createQuestion(
          mockSupabase as unknown as SupabaseClient,
          sessionId,
          command
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should correctly transform snake_case to camelCase', async () => {
      // Arrange
      const sessionId = 'session-123';
      const command: CreateQuestionCommand = {
        content: 'Test question?',
        authorName: 'Test User'
      };

      const mockDbResponse = {
        id: 'question-abc',
        session_id: 'session-123',
        content: 'Test question?',
        author_name: 'Test User',
        is_answered: true,
        upvote_count: 42,
        created_at: '2026-01-27T12:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockDbResponse,
        error: null
      });

      // Act
      const result = await createQuestion(
        mockSupabase as unknown as SupabaseClient,
        sessionId,
        command
      );

      // Assert
      expect(result).toEqual({
        id: 'question-abc',
        sessionId: 'session-123',
        content: 'Test question?',
        authorName: 'Test User',
        isAnswered: true,
        upvoteCount: 42,
        createdAt: '2026-01-27T12:00:00Z'
      });
    });
  });
});
