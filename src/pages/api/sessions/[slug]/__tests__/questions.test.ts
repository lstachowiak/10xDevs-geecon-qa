import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../questions';

// Mock the services
vi.mock('@/lib/services/sessions.service', () => ({
  getSessionBySlug: vi.fn()
}));

vi.mock('@/lib/services/questions.service', () => ({
  createQuestion: vi.fn()
}));

import { getSessionBySlug } from '@/lib/services/sessions.service';
import { createQuestion } from '@/lib/services/questions.service';

describe('POST /api/sessions/:slug/questions', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      params: { slug: 'test-slug' },
      request: new Request('http://localhost/api/sessions/test-slug/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Valid question?' })
      }),
      locals: {
        supabase: {} // Mock Supabase client
      }
    };
  });

  it('should return 201 and create question with valid data', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(createQuestion).mockResolvedValue({
      id: 'question-456',
      sessionId: 'session-123',
      content: 'Valid question?',
      authorName: 'Anonymous',
      isAnswered: false,
      upvoteCount: 0,
      createdAt: '2026-01-27T10:30:00Z'
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: 'question-456',
      sessionId: 'session-123',
      content: 'Valid question?',
      authorName: 'Anonymous',
      isAnswered: false,
      upvoteCount: 0,
      createdAt: '2026-01-27T10:30:00Z'
    });
    expect(getSessionBySlug).toHaveBeenCalledWith({}, 'test-slug');
    expect(createQuestion).toHaveBeenCalledWith(
      {},
      'session-123',
      { content: 'Valid question?', authorName: 'Anonymous' }
    );
  });

  it('should return 201 with custom author name', async () => {
    // Arrange
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Valid question?', authorName: 'Jane Smith' })
    });

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(createQuestion).mockResolvedValue({
      id: 'question-456',
      sessionId: 'session-123',
      content: 'Valid question?',
      authorName: 'Jane Smith',
      isAnswered: false,
      upvoteCount: 0,
      createdAt: '2026-01-27T10:30:00Z'
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.authorName).toBe('Jane Smith');
  });

  it('should return 400 when content is missing', async () => {
    // Arrange
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName: 'John' })
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toHaveProperty('content');
  });

  it('should return 400 when content is too short (< 5 characters)', async () => {
    // Arrange
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hi?' })
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.content).toContain('at least 5 characters');
  });

  it('should return 400 when content is too long (> 500 characters)', async () => {
    // Arrange
    const longContent = 'a'.repeat(501);
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent })
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.content).toContain('not exceed 500 characters');
  });

  it('should return 400 when author name is too long (> 255 characters)', async () => {
    // Arrange
    const longName = 'a'.repeat(256);
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Valid question?', authorName: longName })
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.authorName).toContain('not exceed 255 characters');
  });

  it('should return 400 when request body is invalid JSON', async () => {
    // Arrange
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 404 when session does not exist', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue(null);

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
    expect(createQuestion).not.toHaveBeenCalled();
  });

  it('should return 400 when slug is missing', async () => {
    // Arrange
    mockContext.params.slug = undefined;

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Session slug is required');
  });

  it('should return 500 when supabase client is not available', async () => {
    // Arrange
    mockContext.locals.supabase = null;

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 500 when database operation fails', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(createQuestion).mockRejectedValue(new Error('Database error'));

    // Act
    const response = await POST(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle edge case: exactly 5 characters content', async () => {
    // Arrange
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test?' })
    });

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(createQuestion).mockResolvedValue({
      id: 'question-456',
      sessionId: 'session-123',
      content: 'Test?',
      authorName: 'Anonymous',
      isAnswered: false,
      upvoteCount: 0,
      createdAt: '2026-01-27T10:30:00Z'
    });

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.status).toBe(201);
  });

  it('should handle edge case: exactly 500 characters content', async () => {
    // Arrange
    const exactContent = 'a'.repeat(500);
    mockContext.request = new Request('http://localhost/api/sessions/test-slug/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: exactContent })
    });

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(createQuestion).mockResolvedValue({
      id: 'question-456',
      sessionId: 'session-123',
      content: exactContent,
      authorName: 'Anonymous',
      isAnswered: false,
      upvoteCount: 0,
      createdAt: '2026-01-27T10:30:00Z'
    });

    // Act
    const response = await POST(mockContext);

    // Assert
    expect(response.status).toBe(201);
  });
});
