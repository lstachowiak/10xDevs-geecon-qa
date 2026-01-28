# API Endpoint Implementation Plan: PATCH /api/questions/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację właściwości pytania, szczególnie flagi `isAnswered` oznaczającej, czy pytanie zostało odpowiedziane przez prelegenta. Jest to publiczny endpoint (bez wymagania uwierzytelnienia), który pozwala na oznaczanie pytań jako odpowiedzianych.

**Główne cele:**
- Aktualizacja pola `isAnswered` pytania
- Zwrócenie zaktualizowanych danych pytania
- Walidacja istnienia pytania przed aktualizacją
- Obsługa błędów walidacji i przypadków, gdy pytanie nie istnieje

## 2. Szczegóły żądania

### HTTP Method & URL
- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/questions/:id`
- **Przykład:** `/api/questions/550e8400-e29b-41d4-a716-446655440000`

### Parametry

#### Path Parameters (wymagane):
- `id` (string, UUID) - Unikalny identyfikator pytania
  - Format: UUID v4
  - Przykład: `550e8400-e29b-41d4-a716-446655440000`
  - Walidacja: Musi być poprawnym UUID

#### Request Body (opcjonalny):
```json
{
  "isAnswered": true
}
```

**Pola:**
- `isAnswered` (boolean, optional) - Flaga oznaczająca czy pytanie zostało odpowiedziane
  - Wartości: `true` lub `false`
  - Domyślnie: nie zmienia wartości w bazie, jeśli nie podano

### Nagłówki żądania:
```
Content-Type: application/json
```

## 3. Wykorzystywane typy

### DTOs (z src/types.ts):

**QuestionDTO** - Odpowiedź z danymi pytania:
```typescript
interface QuestionDTO {
  id: string;
  sessionId: string;
  content: string;
  authorName: string;
  isAnswered: boolean;
  upvoteCount: number;
  createdAt: string;
}
```

**UpdateQuestionCommand** - Komenda aktualizacji pytania:
```typescript
interface UpdateQuestionCommand {
  isAnswered?: boolean;
}
```

**ErrorResponseDTO** - Standardowa odpowiedź błędu:
```typescript
interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Schematy walidacji (do utworzenia w src/lib/schemas/question.schema.ts):

**updateQuestionSchema** - Walidacja request body:
```typescript
const updateQuestionSchema = z.object({
  isAnswered: z.boolean().optional(),
});
```

**idParamSchema** - Walidacja parametru :id (może być współdzielony):
```typescript
const idParamSchema = z.string().uuid();
```

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "660e8400-e29b-41d4-a716-446655440001",
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith",
  "isAnswered": true,
  "upvoteCount": 42,
  "createdAt": "2026-01-26T10:30:00Z"
}
```

**Nagłówki:**
```
Content-Type: application/json
```

### Błąd - 400 Bad Request (Nieprawidłowy UUID)
```json
{
  "error": "Validation failed",
  "details": {
    "id": "Invalid UUID format"
  }
}
```

### Błąd - 400 Bad Request (Nieprawidłowe dane wejściowe)
```json
{
  "error": "Validation failed",
  "details": {
    "isAnswered": "Expected boolean, received string"
  }
}
```

### Błąd - 404 Not Found
```json
{
  "error": "Question not found"
}
```

### Błąd - 500 Internal Server Error
```json
{
  "error": "Failed to update question"
}
```

## 5. Przepływ danych

### 1. Walidacja parametru ścieżki
```
Request (PATCH /api/questions/:id)
  ↓
Walidacja UUID parametru :id
  ↓ (sukces)
```

### 2. Walidacja ciała żądania
```
Parse request body jako JSON
  ↓
Walidacja z updateQuestionSchema
  ↓ (sukces)
```

### 3. Interakcja z bazą danych
```
Wywołanie updateQuestion(supabase, id, command)
  ↓
Supabase: SELECT dla sprawdzenia istnienia
  ↓ (istnieje)
Supabase: UPDATE questions SET is_answered = ? WHERE id = ?
  ↓
Supabase: SELECT * FROM questions WHERE id = ?
  ↓
Transformacja snake_case → camelCase
  ↓
Zwrócenie QuestionDTO
```

### 4. Odpowiedź
```
Konwersja QuestionDTO do JSON
  ↓
Response 200 OK
```

### Diagram sekwencji:
```
Client → API Route: PATCH /api/questions/:id
API Route → Validator: Waliduj UUID
Validator → API Route: UUID valid
API Route → Validator: Waliduj body
Validator → API Route: Body valid
API Route → Service: updateQuestion(id, command)
Service → Supabase: Sprawdź istnienie (SELECT)
Supabase → Service: Pytanie istnieje
Service → Supabase: UPDATE is_answered
Supabase → Service: Rows affected = 1
Service → Supabase: SELECT * (pobranie zaktualizowanych danych)
Supabase → Service: Question data
Service → API Route: QuestionDTO
API Route → Client: 200 OK + QuestionDTO
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja
- **Brak wymagania uwierzytelnienia** - endpoint jest publiczny (zgodnie ze specyfikacją)
- W przyszłości może być zmienione na wymóg roli moderatora
- W MVP każdy może oznaczać pytania jako odpowiedziane

### Walidacja danych wejściowych
1. **Walidacja UUID:**
   - Zapobiega SQL injection przez sprawdzenie formatu UUID
   - Używa Zod z `.uuid()` validator
   - Odrzuca nieprawidłowe formaty przed zapytaniem do bazy

2. **Walidacja ciała żądania:**
   - Typy są ściśle wymuszane (boolean dla isAnswered)
   - Zod automatycznie odrzuca nieprawidłowe typy
   - Brak możliwości przekazania dodatkowych pól (strict mode)

### Ochrona przed atakami

**SQL Injection:**
- Parametry przekazywane przez Supabase client są automatycznie escapowane
- UUID validation jako pierwsza linia obrony

**Mass Assignment:**
- Tylko pole `isAnswered` może być aktualizowane
- Schema walidacji ogranicza dostępne pola

**Information Disclosure:**
- Błędy walidacji nie ujawniają struktury bazy danych
- Komunikaty błędów są generyczne
- Szczegółowe logi tylko na serwerze (console.error)

### Rate Limiting
- W MVP brak rate limiting
- Zalecane dodanie w przyszłości (np. maksymalnie 10 żądań/minutę na IP)

## 7. Obsługa błędów

### Tabela scenariuszy błędów

| Scenariusz | Warunek | Kod statusu | Odpowiedź | Logowanie |
|------------|---------|-------------|-----------|-----------|
| Nieprawidłowy UUID | `params.id` nie jest UUID | 400 | `{ error: "Validation failed", details: { id: "Invalid UUID format" } }` | Nie |
| Nieprawidłowy typ isAnswered | `isAnswered` nie jest boolean | 400 | `{ error: "Validation failed", details: { isAnswered: "..." } }` | Nie |
| Pytanie nie istnieje | Brak rekordu w bazie | 404 | `{ error: "Question not found" }` | Tak |
| Błąd bazy danych | Supabase zwraca błąd | 500 | `{ error: "Failed to update question" }` | Tak |
| Nieprawidłowy JSON | Body nie jest JSON | 400 | `{ error: "Invalid JSON" }` | Nie |

### Implementacja obsługi błędów

```typescript
try {
  // 1. Walidacja UUID
  const idValidation = idParamSchema.safeParse(params.id);
  if (!idValidation.success) {
    return new Response(JSON.stringify({
      error: "Validation failed",
      details: { id: "Invalid UUID format" }
    }), { status: 400 });
  }

  // 2. Parse i walidacja body
  const body = await request.json();
  const bodyValidation = updateQuestionSchema.safeParse(body);
  if (!bodyValidation.success) {
    return new Response(JSON.stringify({
      error: "Validation failed",
      details: formatZodErrors(bodyValidation.error)
    }), { status: 400 });
  }

  // 3. Aktualizacja pytania
  const question = await updateQuestion(supabase, id, body);
  return new Response(JSON.stringify(question), { status: 200 });

} catch (error) {
  // 404 - Pytanie nie znalezione
  if (error.message === "Question not found") {
    console.error("[PATCH /api/questions/:id]", {
      questionId: params.id,
      error: "Question not found",
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({
      error: "Question not found"
    }), { status: 404 });
  }

  // 500 - Błąd serwera
  console.error("[PATCH /api/questions/:id]", {
    questionId: params.id,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  return new Response(JSON.stringify({
    error: "Failed to update question"
  }), { status: 500 });
}
```

### Format logowania błędów
```typescript
console.error("[PATCH /api/questions/:id]", {
  questionId: string,
  error: string,
  timestamp: ISO string,
  // opcjonalnie:
  userId?: string,
  stackTrace?: string
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Zapytanie SELECT dla sprawdzenia istnienia:**
   - Każda aktualizacja wymaga najpierw sprawdzenia czy pytanie istnieje
   - Dwa zapytania do bazy: SELECT + UPDATE

2. **Brak cache'owania:**
   - Każde żądanie trafia do bazy danych
   - Brak cache dla często aktualizowanych pytań

3. **Transformacja danych:**
   - Konwersja snake_case → camelCase dla każdego zapytania
   - Minimalne obciążenie, ale może być zauważalne przy dużej liczbie żądań

### Strategie optymalizacji

#### Krótkoterminowe (MVP):
1. **Optymalizacja zapytań:**
   ```typescript
   // Zamiast SELECT + UPDATE + SELECT:
   // Użyj UPDATE ... RETURNING *
   const { data, error } = await supabase
     .from("questions")
     .update({ is_answered: command.isAnswered })
     .eq("id", id)
     .select()
     .single();
   
   // Sprawdzenie czy zaktualizowano 0 wierszy (404)
   if (!data) throw new Error("Question not found");
   ```

2. **Indeksy bazy danych:**
   - Primary key na `id` już istnieje
   - Wystarczające dla tego endpointa

3. **Connection pooling:**
   - Supabase automatycznie zarządza pool'em połączeń
   - Brak dodatkowej konfiguracji w MVP

#### Długoterminowe (post-MVP):
1. **Caching:**
   - Redis cache dla często aktualizowanych pytań
   - TTL: 30 sekund
   - Invalidacja przy aktualizacji

2. **Rate limiting:**
   - Ochrona przed nadużyciami
   - Limit: 10 żądań/minutę na IP

3. **Database read replicas:**
   - Gdy ruch wzrośnie powyżej 1000 żądań/sekundę
   - Read replica dla SELECT, primary dla UPDATE

4. **Monitoring:**
   - Śledzenie czasu odpowiedzi endpoint
   - Alarmy przy >500ms P95 latency
   - Monitorowanie liczby błędów 500

### Metryki wydajności (cele):
- **Czas odpowiedzi:** < 200ms (P95)
- **Throughput:** > 100 żądań/sekundę
- **Error rate:** < 0.1%
- **Database query time:** < 50ms (P95)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie walidacji
**Plik:** `src/lib/schemas/question.schema.ts`

1. Dodaj schema walidacji dla PATCH request:
   ```typescript
   export const updateQuestionSchema = z.object({
     isAnswered: z.boolean().optional(),
   });
   ```

2. Dodaj lub upewnij się, że istnieje UUID validator:
   ```typescript
   export const idParamSchema = z.string().uuid();
   ```

**Testy:** `src/lib/schemas/__tests__/question.schema.test.ts`
- Test walidacji prawidłowego `isAnswered: true`
- Test walidacji prawidłowego `isAnswered: false`
- Test walidacji pustego obiektu `{}`
- Test odrzucenia `isAnswered: "true"` (string zamiast boolean)
- Test odrzucenia `isAnswered: 1` (number zamiast boolean)
- Test odrzucenia dodatkowych pól

### Krok 2: Implementacja logiki w warstwie serwisowej
**Plik:** `src/lib/services/questions.service.ts`

1. Dodaj funkcję `updateQuestion`:
   ```typescript
   /**
    * Update question properties
    * @param supabase - Supabase client instance
    * @param id - ID of the question to update
    * @param command - Update data from request
    * @returns Updated question as QuestionDTO
    * @throws Error if question not found or database operation fails
    */
   export async function updateQuestion(
     supabase: SupabaseClient,
     id: string,
     command: UpdateQuestionCommand
   ): Promise<QuestionDTO> {
     // Perform update and return data in one query
     const { data, error } = await supabase
       .from("questions")
       .update({
         is_answered: command.isAnswered,
       })
       .eq("id", id)
       .select()
       .single();

     // Check if question was found
     if (error) {
       if (error.code === "PGRST116") {
         throw new Error("Question not found");
       }
       throw new Error(`Failed to update question: ${error.message}`);
     }

     // Transform snake_case to camelCase
     return {
       id: data.id,
       sessionId: data.session_id,
       content: data.content,
       authorName: data.author_name,
       isAnswered: data.is_answered,
       upvoteCount: data.upvote_count,
       createdAt: data.created_at,
     };
   }
   ```

**Testy:** `src/lib/services/__tests__/questions.service.test.ts`
- Test pomyślnej aktualizacji `isAnswered` na `true`
- Test pomyślnej aktualizacji `isAnswered` na `false`
- Test aktualizacji z pustym command object (nie zmienia wartości)
- Test błędu 404 dla nieistniejącego pytania
- Test zachowania innych pól (content, upvoteCount nie zmieniają się)
- Mock Supabase client i weryfikacja wywołań

### Krok 3: Utworzenie API route
**Plik:** `src/pages/api/questions/[id]/index.ts` (nowy plik)

1. Utwórz plik endpoint z obsługą PATCH:
   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import { updateQuestion } from "@/lib/services/questions.service";
   import { updateQuestionSchema, idParamSchema } from "@/lib/schemas/question.schema";
   import type { ErrorResponseDTO, QuestionDTO } from "@/types";

   export const prerender = false;

   export const PATCH: APIRoute = async ({ params, request, locals }) => {
     // Implementation from error handling section
   };
   ```

2. Implementuj pełną logikę:
   - Walidację parametru `:id`
   - Parsowanie i walidację request body
   - Wywołanie service layer
   - Obsługę błędów 400, 404, 500
   - Logowanie błędów

3. Dodaj helper function dla formatowania błędów Zod:
   ```typescript
   function formatZodErrors(error: z.ZodError): Record<string, string> {
     const formatted: Record<string, string> = {};
     error.errors.forEach((err) => {
       const path = err.path.join(".");
       formatted[path] = err.message;
     });
     return formatted;
   }
   ```

**Struktura katalogów:**
```
src/pages/api/questions/[id]/
  ├── index.ts          (PATCH endpoint - nowy)
  ├── upvote.ts         (istniejący POST endpoint)
  └── __tests__/
      ├── index.test.ts (nowy)
      └── upvote.test.ts (istniejący)
```

### Krok 4: Testy integracyjne endpoint
**Plik:** `src/pages/api/questions/[id]/__tests__/index.test.ts`

Testy do implementacji:
1. **Sukces (200):**
   - Aktualizacja `isAnswered` na `true`
   - Aktualizacja `isAnswered` na `false`
   - Pusty request body (200, bez zmian)

2. **Walidacja (400):**
   - Nieprawidłowy UUID w parametrze
   - Nieprawidłowy typ dla `isAnswered` (string)
   - Nieprawidłowy typ dla `isAnswered` (number)
   - Nieprawidłowy JSON w body

3. **Not Found (404):**
   - Pytanie o podanym ID nie istnieje
   - Prawidłowy UUID, ale brak w bazie

4. **Server Error (500):**
   - Mock błędu Supabase
   - Weryfikacja logowania błędu

**Przykładowa struktura testu:**
```typescript
import { describe, it, expect, vi } from "vitest";
import { PATCH } from "../index";

describe("PATCH /api/questions/:id", () => {
  it("should update question isAnswered to true", async () => {
    // Arrange
    const mockRequest = new Request("http://localhost/api/questions/uuid", {
      method: "PATCH",
      body: JSON.stringify({ isAnswered: true }),
    });
    // ... mock locals.supabase

    // Act
    const response = await PATCH({ params: { id: "uuid" }, request: mockRequest, locals });

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.isAnswered).toBe(true);
  });

  // ... więcej testów
});
```

### Krok 5: Dokumentacja
**Pliki do aktualizacji:**

1. **README.md** - Dodaj przykład użycia:
   ```markdown
   ### Mark question as answered
   ```bash
   curl -X PATCH http://localhost:4321/api/questions/{id} \
     -H "Content-Type: application/json" \
     -d '{"isAnswered": true}'
   ```
   ```

2. **API docs** (jeśli istnieje) - Dodaj pełną specyfikację endpoint

3. **CHANGELOG.md** (jeśli istnieje):
   ```markdown
   ## [Unreleased]
   ### Added
   - PATCH /api/questions/:id endpoint for updating question properties
   ```

### Krok 6: Code review checklist
Przed merge do main branch sprawdź:

- [ ] Walidacja UUID działa poprawnie
- [ ] Walidacja request body odrzuca nieprawidłowe typy
- [ ] Service layer obsługuje przypadek "Question not found"
- [ ] Endpoint zwraca poprawne kody statusu (200, 400, 404, 500)
- [ ] Błędy są odpowiednio logowane (console.error)
- [ ] Wszystkie testy jednostkowe przechodzą
- [ ] Wszystkie testy integracyjne przechodzą
- [ ] Nie ma regression w istniejących endpointach
- [ ] Kod zgodny z ESLint rules
- [ ] TypeScript nie zgłasza błędów
- [ ] Dokumentacja zaktualizowana
- [ ] Error messages są user-friendly
- [ ] Nie ma hardcoded values (magic numbers, strings)
- [ ] Funkcje mają JSDoc comments

### Krok 7: Deployment i monitoring
Po wdrożeniu na produkcję:

1. **Monitoring:**
   - Śledź error rate dla endpointu
   - Monitoruj czas odpowiedzi (latency)
   - Sprawdź logi błędów (404, 500)

2. **Smoke tests:**
   - Wykonaj testowe żądanie PATCH z produkcji
   - Zweryfikuj poprawność odpowiedzi
   - Sprawdź czy zmiana zapisała się w bazie

3. **Rollback plan:**
   - W razie błędów: git revert commit
   - Redeploy poprzedniej wersji
   - Komunikat dla użytkowników (jeśli dotyczy)

### Krok 8: Post-deployment
1. Usuń feature flag (jeśli był użyty)
2. Zaktualizuj metryki sukcesu
3. Zbierz feedback od użytkowników
4. Zaplanuj optymalizacje na podstawie real-world usage

---

## Podsumowanie

Endpoint PATCH /api/questions/:id pozwala na aktualizację właściwości pytania (głównie `isAnswered`). Kluczowe aspekty implementacji:

- **Publiczny dostęp** - brak wymaga uwierzytelnienia w MVP
- **Walidacja ścisła** - UUID i boolean types
- **Optymalizacja bazy** - UPDATE ... RETURNING zamiast SELECT + UPDATE + SELECT
- **Obsługa błędów** - szczegółowe komunikaty i logowanie
- **Testy** - pełne pokrycie unit i integration tests

Plan implementacji jest podzielony na 8 kroków, od przygotowania walidacji, przez implementację serwisu i endpoint, po deployment i monitoring.
