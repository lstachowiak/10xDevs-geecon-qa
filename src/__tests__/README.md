# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit and integration testing.

## Installation

Before running tests, install dependencies:

```bash
npm install
```

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Tests are organized using the `__tests__` directory pattern:

```
src/
├── lib/
│   ├── services/
│   │   ├── sessions.service.ts
│   │   ├── questions.service.ts
│   │   └── __tests__/
│   │       ├── sessions.service.test.ts
│   │       └── questions.service.test.ts
│   └── schemas/
│       └── question.schema.ts
└── pages/
    └── api/
        └── sessions/
            └── [slug]/
                ├── questions.ts
                └── __tests__/
                    └── questions.test.ts
```

## Test Coverage

Current test coverage includes:

### Services Tests (`src/lib/services/__tests__/`)

**sessions.service.test.ts**
- ✅ Returns session with id when session exists
- ✅ Returns null when session does not exist
- ✅ Returns null when error occurs
- ✅ Returns null when data is null

**questions.service.test.ts**
- ✅ Creates question with provided author name
- ✅ Creates question with "Anonymous" when author name not provided
- ✅ Throws error when database operation fails
- ✅ Correctly transforms snake_case to camelCase

### Integration Tests (`src/pages/api/sessions/[slug]/__tests__/`)

**questions.test.ts**
- ✅ Returns 201 and creates question with valid data
- ✅ Returns 201 with custom author name
- ✅ Returns 400 when content is missing
- ✅ Returns 400 when content is too short (< 5 characters)
- ✅ Returns 400 when content is too long (> 500 characters)
- ✅ Returns 400 when author name is too long (> 255 characters)
- ✅ Returns 400 when request body is invalid JSON
- ✅ Returns 404 when session does not exist
- ✅ Returns 400 when slug is missing
- ✅ Returns 500 when supabase client is not available
- ✅ Returns 500 when database operation fails
- ✅ Handles edge case: exactly 5 characters content
- ✅ Handles edge case: exactly 500 characters content

## Writing New Tests

### Example Unit Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myFunction } from '../my-service';

describe('my-service', () => {
  describe('myFunction', () => {
    it('should do something correctly', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking Supabase

```typescript
let mockSupabase: any;

beforeEach(() => {
  mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  };
});

mockSupabase.single.mockResolvedValue({
  data: { id: 'test-id' },
  error: null
});
```

## Configuration

Test configuration is located in [vitest.config.ts](../vitest.config.ts):

- **Environment**: Node.js
- **Test Pattern**: `src/**/*.{test,spec}.{js,ts}`
- **Alias Support**: `@/` resolves to `./src`
- **Coverage Provider**: V8
- **Coverage Reports**: text, json, html

## CI/CD Integration

Add the following to your CI/CD pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly with these three sections
2. **Mock External Dependencies**: Always mock Supabase, external APIs, etc.
3. **Test Edge Cases**: Include boundary conditions (e.g., exactly 5 chars, exactly 500 chars)
4. **Clear Test Names**: Use descriptive test names that explain what is being tested
5. **Reset Mocks**: Use `beforeEach` to reset mocks between tests
6. **Test Error Cases**: Don't just test happy paths - test error handling too
