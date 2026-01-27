# API Endpoint Implementation Plan: POST /api/questions/:id/upvote

## 1. Przegląd punktu końcowego

Endpoint umożliwia zwiększenie liczby głosów pozytywnych (upvotes) dla konkretnego pytania. Jest publicznie dostępny i nie wymaga uwierzytelnienia. W wersji MVP nie ma mechanizmu zapobiegającego wielokrotnym głosom od tego samego użytkownika/urządzenia - kontrola odbywa się jedynie po stronie klienta.

**Cel**: Zwiększenie licznika `upvote_count` dla wybranego pytania o 1.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/questions/:id/upvote`
- **Parametry**:
  - **Wymagane**:
    - `id` (path parameter) - UUID pytania, którego dotyczy głos
  - **Opcjonalne**: brak
- **Request Body**: brak (puste żądanie POST)
- **Uwierzytelnienie**: nie wymagane (public access)
- **Content-Type**: nie dotyczy (brak body)

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

```typescript
/**
 * Response for upvote endpoint
 * Used in: POST /api/questions/:id/upvote response
 */
export interface UpvoteResponseDTO {
  id: string;
  upvoteCount: number;
}

/**
 * Standard error response
 * Used in: All error responses
 */
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string>;
}
```

### Wymagania walidacyjne:

- Walidacja parametru `id` za pomocą Zod:
  ```typescript
  z.string().uuid()
  ```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "upvoteCount": 43
}
```

### Błędy:

#### 404 Not Found:
```json
{
  "error": "Question not found"
}
```

#### 400 Bad Request (nieprawidłowy UUID):
```json
{
  "error": "Validation failed",
  "details": {
    "id": "Invalid UUID format"
  }
}
```

#### 500 Internal Server Error:
```json
{
  "error": "Failed to upvote question"
}
```

## 5. Przepływ danych

### Diagram przepływu:

```
1. Klient → POST /api/questions/:id/upvote
2. Route handler → walidacja parametru :id (Zod)
3. Route handler → wywołanie questionsService.upvoteQuestion(id, supabase)
4. Service → wykonanie UPDATE questions SET upvote_count = upvote_count + 1 WHERE id = :id RETURNING id, upvote_count
5. Service → sprawdzenie czy pytanie istnieje (data.length === 0 → 404)
6. Service → mapowanie wyniku do UpvoteResponseDTO
7. Route handler → zwrócenie odpowiedzi 200 z DTO
```

### Szczegóły implementacji w service:

**Lokalizacja**: `src/lib/services/questions.service.ts`

**Nowa metoda**:
```typescript
async upvoteQuestion(
  id: string,
  supabase: SupabaseClient
): Promise<UpvoteResponseDTO>
```

**Logika**:
1. Wykonać zapytanie:
   ```typescript
   const { data, error } = await supabase
     .from('questions')
     .update({ upvote_count: supabase.sql`upvote_count + 1` })
     .eq('id', id)
     .select('id, upvote_count')
     .single();
   ```
   
2. Obsługa błędów:
   - Jeśli `error?.code === 'PGRST116'` (no rows) → rzuć błąd 404
   - Jeśli inny `error` → rzuć błąd 500

3. Mapowanie do camelCase:
   ```typescript
   return {
     id: data.id,
     upvoteCount: data.upvote_count
   };
   ```

### Interakcja z bazą danych:

- **Tabela**: `questions`
- **Operacja**: UPDATE z atomic increment
- **Kolumny**:
  - UPDATE: `upvote_count = upvote_count + 1`
  - SELECT: `id, upvote_count`
- **Ograniczenia**: CHECK (upvote_count >= 0) zapewnia, że wartość nie będzie ujemna

## 6. Względy bezpieczeństwa

### Uwierzytelnienie i autoryzacja:
- Endpoint jest **publicznie dostępny** - nie wymaga uwierzytelnienia
- Każdy użytkownik może zagłosować na dowolne pytanie

### Walidacja danych wejściowych:
- **Parametr :id**: musi być poprawnym UUID
  - Walidacja przez Zod: `z.string().uuid()`
  - Zapobiega SQL injection poprzez walidację formatu UUID
  - Supabase używa parametryzowanych zapytań

### Potencjalne zagrożenia:

1. **Vote manipulation (głosowanie wielokrotne)**:
   - MVP: brak ochrony po stronie serwera
   - Kontrola jedynie po stronie klienta (localStorage/cookies)
   - **Przyszłe usprawnienie**: tracking IP/user-agent, rate limiting, captcha

2. **Rate limiting**:
   - Brak rate limitingu w MVP
   - **Przyszłe usprawnienie**: implementacja rate limiting per IP (np. max 10 upvotes/minute)

3. **DDoS/Abuse**:
   - Endpoint może być nadużywany do generowania wysokiego obciążenia DB
   - **Przyszłe usprawnienie**: middleware z rate limiting, WAF

### Zabezpieczenia na poziomie bazy danych:
- CHECK constraint: `upvote_count >= 0` - zapobiega ujemnym wartościom
- Atomic increment: `upvote_count + 1` - zapobiega race conditions
- UUID format: wbudowana walidacja PostgreSQL

## 7. Obsługa błędów

### Tabela scenariuszy błędów:

| Scenariusz | Detekcja | Kod HTTP | Komunikat | Szczegóły techniczne |
|------------|----------|----------|-----------|---------------------|
| Nieprawidłowy format UUID | Walidacja Zod | 400 | "Validation failed" | details: { id: "Invalid UUID format" } |
| Pytanie nie istnieje | Supabase error PGRST116 | 404 | "Question not found" | Brak danych w bazie dla podanego ID |
| Błąd bazy danych | Supabase error (inne) | 500 | "Failed to upvote question" | Logowanie szczegółów błędu do konsoli |
| Ogólny błąd serwera | try-catch | 500 | "Internal server error" | Logowanie pełnego stack trace |

### Implementacja obsługi błędów w route handler:

```typescript
try {
  // 1. Walidacja parametru
  const idSchema = z.string().uuid();
  const validationResult = idSchema.safeParse(params.id);
  
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: { id: "Invalid UUID format" }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Wywołanie service
  const result = await questionsService.upvoteQuestion(
    validationResult.data,
    context.locals.supabase
  );

  // 3. Zwrócenie sukcesu
  return new Response(
    JSON.stringify(result),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

} catch (error) {
  // 4. Obsługa błędów z service
  if (error instanceof NotFoundError) {
    return new Response(
      JSON.stringify({ error: "Question not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  console.error("Error upvoting question:", error);
  return new Response(
    JSON.stringify({ error: "Failed to upvote question" }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Logowanie błędów:

- Błędy 500: pełne logowanie z `console.error()` z stack trace
- Błędy 404: opcjonalne logowanie z `console.warn()` dla monitoringu
- Błędy 400: brak logowania (user error)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Pojedyncze UPDATE na rekord**:
   - Operacja atomowa `upvote_count + 1` jest wydajna
   - Baza danych obsługuje konkurencyjne żądania bez race conditions
   - **Optymalizacja**: indeks na kolumnie `id` (już istnieje jako PRIMARY KEY)

2. **Brak cachowania**:
   - Każde upvote wykonuje UPDATE do DB
   - W MVP akceptowalne dla małego ruchu
   - **Przyszła optymalizacja**: Redis cache dla agregacji upvotes przed zapisem do DB

3. **Brak batch operations**:
   - Pojedyncze żądanie = pojedyncze UPDATE
   - **Przyszła optymalizacja**: batch API dla wielu upvotes naraz

### Strategie optymalizacji:

1. **Indeksowanie** (już zaimplementowane):
   - PRIMARY KEY index na `questions.id` - O(log n) lookup

2. **Connection pooling**:
   - Supabase automatycznie zarządza connection pool
   - Zmniejsza overhead tworzenia nowych połączeń

3. **Monitoring wydajności**:
   - Śledzenie czasu wykonania UPDATE queries
   - Alerting przy przekroczeniu 100ms średniego czasu odpowiedzi

### Szacowana wydajność:

- **Pojedyncze upvote**: ~10-30ms (w zależności od obciążenia DB)
- **Concurrent requests**: PostgreSQL obsługuje tysiące concurrent UPDATEs
- **Bottleneck**: maksymalna przepustowość Supabase tier (sprawdzić limity planu)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie questions.service.ts

**Plik**: `src/lib/services/questions.service.ts`

1. Dodać nową metodę `upvoteQuestion`:
   ```typescript
   async upvoteQuestion(
     id: string,
     supabase: SupabaseClient
   ): Promise<UpvoteResponseDTO> {
     const { data, error } = await supabase
       .from('questions')
       .update({ upvote_count: supabase.rpc('increment', { 
         row_id: id, 
         x: 1 
       }) })
       .eq('id', id)
       .select('id, upvote_count')
       .single();

     if (error) {
       if (error.code === 'PGRST116') {
         throw new Error('Question not found');
       }
       throw new Error(`Failed to upvote question: ${error.message}`);
     }

     return {
       id: data.id,
       upvoteCount: data.upvote_count
     };
   }
   ```

2. Dodać import `UpvoteResponseDTO` z `src/types.ts`

### Krok 2: Utworzenie route handler

**Plik**: `src/pages/api/questions/[id]/upvote.ts`

1. Utworzyć nowy folder `src/pages/api/questions/[id]/` (jeśli nie istnieje)

2. Utworzyć plik `upvote.ts`:
   ```typescript
   import type { APIRoute } from 'astro';
   import { z } from 'zod';
   import { questionsService } from '@/lib/services/questions.service';
   import type { UpvoteResponseDTO, ErrorResponseDTO } from '@/types';

   export const prerender = false;

   const idParamSchema = z.string().uuid();

   export const POST: APIRoute = async ({ params, locals }) => {
     try {
       // Walidacja parametru :id
       const validationResult = idParamSchema.safeParse(params.id);
       
       if (!validationResult.success) {
         const errorResponse: ErrorResponseDTO = {
           error: "Validation failed",
           details: { id: "Invalid UUID format" }
         };
         return new Response(JSON.stringify(errorResponse), {
           status: 400,
           headers: { "Content-Type": "application/json" }
         });
       }

       // Wywołanie service
       const result = await questionsService.upvoteQuestion(
         validationResult.data,
         locals.supabase
       );

       // Sukces
       return new Response(JSON.stringify(result), {
         status: 200,
         headers: { "Content-Type": "application/json" }
       });

     } catch (error) {
       // Obsługa błędu "not found"
       if (error instanceof Error && error.message === 'Question not found') {
         const errorResponse: ErrorResponseDTO = {
           error: "Question not found"
         };
         return new Response(JSON.stringify(errorResponse), {
           status: 404,
           headers: { "Content-Type": "application/json" }
         });
       }

       // Ogólne błędy serwera
       console.error("Error upvoting question:", error);
       const errorResponse: ErrorResponseDTO = {
         error: "Failed to upvote question"
       };
       return new Response(JSON.stringify(errorResponse), {
         status: 500,
         headers: { "Content-Type": "application/json" }
       });
     }
   };
   ```

### Krok 3: Aktualizacja testów

**Plik**: `src/lib/services/__tests__/questions.service.test.ts`

1. Dodać testy dla `upvoteQuestion`:
   ```typescript
   describe('upvoteQuestion', () => {
     it('should increment upvote_count by 1', async () => {
       // Arrange
       const questionId = 'test-uuid';
       const mockData = { id: questionId, upvote_count: 43 };
       
       // Act & Assert
     });

     it('should throw error when question not found', async () => {
       // Test dla PGRST116 error
     });

     it('should throw error on database failure', async () => {
       // Test dla innych błędów DB
     });
   });
   ```

**Plik**: `src/pages/api/questions/[id]/__tests__/upvote.test.ts`

1. Utworzyć plik testowy dla route:
   ```typescript
   describe('POST /api/questions/:id/upvote', () => {
     it('should return 200 with updated upvote count', async () => {
       // Test happy path
     });

     it('should return 400 for invalid UUID format', async () => {
       // Test walidacji
     });

     it('should return 404 when question does not exist', async () => {
       // Test błędu not found
     });

     it('should return 500 on database error', async () => {
       // Test błędu serwera
     });
   });
   ```

### Krok 4: Weryfikacja i testowanie

1. **Unit testy**:
   - Uruchomić `npm run test` dla testów service i route
   - Zweryfikować 100% code coverage dla nowej funkcjonalności

2. **Integration testy**:
   - Przetestować z rzeczywistym Supabase (test environment)
   - Zweryfikować atomic increment w concurrent scenarios

3. **Manual testing**:
   - Użyć Postman/curl do przetestowania endpointu:
     ```bash
     curl -X POST http://localhost:4321/api/questions/{valid-uuid}/upvote
     ```
   - Zweryfikować wszystkie scenariusze błędów (404, 400, 500)

### Krok 5: Code review i deployment

1. **Linting i formatowanie**:
   - Uruchomić `npm run lint` i naprawić wszystkie błędy
   - Uruchomić `npm run format` dla spójnego formatowania

2. **Code review checklist**:
   - [ ] Walidacja Zod dla UUID
   - [ ] Obsługa wszystkich scenariuszy błędów
   - [ ] Poprawne typy DTO z `src/types.ts`
   - [ ] Atomic increment w SQL
   - [ ] Testy jednostkowe i integracyjne
   - [ ] Zgodność z coding guidelines

3. **Deployment**:
   - Merge do main branch
   - Automatyczny deployment via GitHub Actions
   - Monitorowanie błędów w production

### Krok 6: Dokumentacja

1. Zaktualizować API documentation w `.ai/api-plan.md` (jeśli zmieniono coś w specyfikacji)
2. Dodać przykłady użycia w README.md (jeśli dotyczy)
3. Zaktualizować Postman collection z nowym endpointem

---

## Podsumowanie

Implementacja endpointu POST /api/questions/:id/upvote jest stosunkowo prosta, ale wymaga starannej obsługi błędów i walidacji. Kluczowe aspekty:

- ✅ Atomic increment w bazie danych zapobiega race conditions
- ✅ Walidacja UUID przez Zod
- ✅ Publiczny dostęp bez uwierzytelnienia
- ⚠️ Brak rate limiting w MVP - potencjalne ryzyko abuse
- ⚠️ Brak zapobiegania wielokrotnym upvotes w MVP

Endpoint jest gotowy do użycia w MVP, z planowanymi usprawnieniami bezpieczeństwa w przyszłych iteracjach.
