import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../questions';

// Mock the services
vi.mock('@/lib/services/sessions.service', () => ({
  getSessionBySlug: vi.fn()
}));

vi.mock('@/lib/services/questions.service', () => ({
  createQuestion: vi.fn(),
  getQuestionsBySessionId: vi.fn()
}));

import { getSessionBySlug } from '@/lib/services/sessions.service';
import { createQuestion, getQuestionsBySessionId } from '@/lib/services/questions.service';

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

describe('GET /api/sessions/:slug/questions', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      params: { slug: 'test-slug' },
      request: new Request('http://localhost/api/sessions/test-slug/questions', {
        method: 'GET'
      }),
      locals: {
        supabase: {} // Mock Supabase client
      }
    };
  });

  it('should return 200 with questions when includeAnswered is not provided (default false)', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([
      {
        id: 'question-1',
        sessionId: 'session-123',
        content: 'First unanswered question?',
        authorName: 'User A',
        isAnswered: false,
        upvoteCount: 10,
        createdAt: '2026-01-27T10:00:00Z'
      },
      {
        id: 'question-2',
        sessionId: 'session-123',
        content: 'Second unanswered question?',
        authorName: 'User B',
        isAnswered: false,
        upvoteCount: 5,
        createdAt: '2026-01-27T10:30:00Z'
      }
    ]);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].id).toBe('question-1');
    expect(data.data[1].id).toBe('question-2');
    expect(getSessionBySlug).toHaveBeenCalledWith({}, 'test-slug');
    expect(getQuestionsBySessionId).toHaveBeenCalledWith({}, 'session-123', false);
  });

  it('should return 200 with all questions when includeAnswered is true', async () => {
    // Arrange
    mockContext.request = new Request(
      'http://localhost/api/sessions/test-slug/questions?includeAnswered=true',
      { method: 'GET' }
    );

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([
      {
        id: 'question-1',
        sessionId: 'session-123',
        content: 'Answered question?',
        authorName: 'User A',
        isAnswered: true,
        upvoteCount: 15,
        createdAt: '2026-01-27T09:00:00Z'
      },
      {
        id: 'question-2',
        sessionId: 'session-123',
        content: 'Unanswered question?',
        authorName: 'User B',
        isAnswered: false,
        upvoteCount: 10,
        createdAt: '2026-01-27T10:00:00Z'
      }
    ]);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].isAnswered).toBe(true);
    expect(data.data[1].isAnswered).toBe(false);
    expect(getQuestionsBySessionId).toHaveBeenCalledWith({}, 'session-123', true);
  });

  it('should return 200 with only unanswered questions when includeAnswered is false', async () => {
    // Arrange
    mockContext.request = new Request(
      'http://localhost/api/sessions/test-slug/questions?includeAnswered=false',
      { method: 'GET' }
    );

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([
      {
        id: 'question-1',
        sessionId: 'session-123',
        content: 'Unanswered question?',
        authorName: 'User A',
        isAnswered: false,
        upvoteCount: 5,
        createdAt: '2026-01-27T10:00:00Z'
      }
    ]);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].isAnswered).toBe(false);
    expect(getQuestionsBySessionId).toHaveBeenCalledWith({}, 'session-123', false);
  });

  it('should return 200 with empty array when no questions exist', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([]);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  it('should return 404 when session does not exist', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue(null);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
    expect(getQuestionsBySessionId).not.toHaveBeenCalled();
  });

  it('should return 400 when slug is missing', async () => {
    // Arrange
    mockContext.params.slug = undefined;

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.slug).toBe('Slug parameter is required');
  });

  it('should return 400 when includeAnswered is invalid', async () => {
    // Arrange
    mockContext.request = new Request(
      'http://localhost/api/sessions/test-slug/questions?includeAnswered=maybe',
      { method: 'GET' }
    );
    
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toHaveProperty('includeAnswered');
  });

  it('should return 500 when database operation fails', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockRejectedValue(new Error('Database error'));

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 500 when getSessionBySlug fails', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockRejectedValue(new Error('Database connection failed'));

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should include cache headers in successful response', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([]);

    // Act
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=60');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should handle includeAnswered=1 (numeric true)', async () => {
    // Arrange
    mockContext.request = new Request(
      'http://localhost/api/sessions/test-slug/questions?includeAnswered=1',
      { method: 'GET' }
    );

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([]);

    // Act
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(200);
    expect(getQuestionsBySessionId).toHaveBeenCalledWith({}, 'session-123', true);
  });

  it('should handle includeAnswered=0 (numeric false)', async () => {
    // Arrange
    mockContext.request = new Request(
      'http://localhost/api/sessions/test-slug/questions?includeAnswered=0',
      { method: 'GET' }
    );

    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([]);

    // Act
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(200);
    expect(getQuestionsBySessionId).toHaveBeenCalledWith({}, 'session-123', false);
  });

  it('should verify questions are returned in correct order', async () => {
    // Arrange
    vi.mocked(getSessionBySlug).mockResolvedValue({ id: 'session-123' });
    vi.mocked(getQuestionsBySessionId).mockResolvedValue([
      {
        id: 'question-high-votes',
        sessionId: 'session-123',
        content: 'Popular question?',
        authorName: 'User A',
        isAnswered: false,
        upvoteCount: 20,
        createdAt: '2026-01-27T10:00:00Z'
      },
      {
        id: 'question-medium-votes',
        sessionId: 'session-123',
        content: 'Medium question?',
        authorName: 'User B',
        isAnswered: false,
        upvoteCount: 10,
        createdAt: '2026-01-27T09:00:00Z'
      },
      {
        id: 'question-low-votes',
        sessionId: 'session-123',
        content: 'Less popular question?',
        authorName: 'User C',
        isAnswered: false,
        upvoteCount: 5,
        createdAt: '2026-01-27T08:00:00Z'
      }
    ]);

    // Act
    const response = await GET(mockContext);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.data[0].upvoteCount).toBe(20);
    expect(data.data[1].upvoteCount).toBe(10);
    expect(data.data[2].upvoteCount).toBe(5);
  });
});
