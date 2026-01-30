Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
<prd>
{{prd}} <- zamień na referencję do pliku @prd.md
</prd>

2. Opis widoku:
<view_description>
### Widok 7: Panel Moderatora - Zarządzanie Pytaniami
- **Nazwa widoku:** Zarządzanie Pytaniami
- **Ścieżka widoku:** `/moderator/sessions/[id]`
- **Główny cel:** Moderowanie pytań w czasie rzeczywistym.
- **Kluczowe informacje do wyświetlenia:** Lista pytań z opcjami moderacji.
- **Kluczowe komponenty widoku:**
    - `Table` lub `Card List`: Lista pytań z treścią, autorem i liczbą głosów.
    - `Switch`: Przełącznik do oznaczania pytania jako "odpowiedziane".
    - `Button` z ikoną kosza do usuwania pytania.
    - `AlertDialog`: Modal potwierdzający usunięcie pytania.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Zmiany (oznaczenie jako odpowiedziane, usunięcie) są natychmiast widoczne.
    - **Dostępność:** Interaktywne elementy (`Switch`, `Button`) będą miały etykiety `aria-label`.
    - **Bezpieczeństwo:** Wszystkie akcje moderacyjne wymagają uwierzytelnienia.
</view_description>

3. User Stories:
<user_stories>
### US-007. Zarządzanie pytaniami
Opis: Jako moderator chcę przeglądać i oznaczać pytania, aby przygotować się do odpowiedzi.
Kryteria akceptacji:
- Lista pytań pokazuje treść, nadawcę, liczbę upvote i znacznik czasu.
- Mogę oznaczyć pytanie jako answered; status zmienia się u wszystkich użytkowników.
- Oznaczenie można cofnąć w razie pomyłki.

### US-008. Usuwanie pytań
Opis: Jako moderator chcę usuwać nieodpowiednie pytania, aby utrzymać porządek.
Kryteria akceptacji:
- Każde pytanie ma akcję usuń z potwierdzeniem.
- Po usunięciu pytanie znika z listy użytkowników i archiwum.
</user_stories>

4. Endpoint Description:
<endpoint_description>
#### GET /api/sessions/:slug/questions
Retrieve all questions for a specific session (public access).

**Parameters:**
- Path: `slug` (string) - unique URL identifier for the session

**Query Parameters:**
- `includeAnswered` (boolean, optional, default: false) - whether to include answered questions

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "content": "What is the difference between REST and GraphQL?",
      "authorName": "Jane Smith",
      "isAnswered": false,
      "upvoteCount": 42,
      "createdAt": "2026-01-26T10:30:00Z"
    },
    {
      "id": "uuid",
      "sessionId": "uuid",
      "content": "How do you handle authentication in GraphQL?",
      "authorName": "Anonymous",
      "isAnswered": true,
      "upvoteCount": 38,
      "createdAt": "2026-01-26T10:25:00Z"
    }
  ]
}
```

**Business Logic:**
- Questions are sorted by `upvoteCount DESC, createdAt ASC`
- If `includeAnswered=false`, filter out questions where `isAnswered=true`

**Error Responses:**
- `404 Not Found` - Session with given slug does not exist

---

#### PATCH /api/questions/:id
Update question properties (moderator only - authenticated).

**Parameters:**
- Path: `id` (uuid) - question identifier

**Request Body:**
```json
{
  "isAnswered": true
}
```

**Validation:**
- `isAnswered`: optional, boolean

**Response (200 OK):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "content": "What is the difference between REST and GraphQL?",
  "authorName": "Jane Smith",
  "isAnswered": true,
  "upvoteCount": 42,
  "createdAt": "2026-01-26T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Question does not exist
- `400 Bad Request` - Invalid request body

---

#### DELETE /api/questions/:id
Delete a question (moderator only - authenticated).

**Parameters:**
- Path: `id` (uuid) - question identifier

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - Question does not exist

---

</endpoint_description>

5. Endpoint Implementation:
<endpoint_implementation>
{{endpoint-implementation}} <- zamień na referencję do implementacji endpointów, z których będzie korzystał widok (np. @generations.ts, @flashcards.ts)
</endpoint_implementation>

6. Type Definitions:
<type_definitions>
{{types}} <- zamień na referencję do pliku z definicjami DTOsów (np. @types.ts)
</type_definitions>

7. Tech Stack:
<tech_stack>
{{tech-stack}} <- zamień na referencję do pliku @tech-stack.md
</tech_stack>

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:
1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):
  - Podsumuj kluczowe punkty
 - Wymień wszelkie wymagania lub ograniczenia
 - Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie
2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:
 - Opis komponentu, jego przeznaczenie i z czego się składa
 - Główne elementy HTML i komponenty dzieci, które budują komponent
 - Obsługiwane zdarzenia
 - Warunki walidacji (szczegółowe warunki, zgodnie z API)
 - Typy (DTO i ViewModel) wymagane przez komponent
 - Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)
5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd
[Krótki opis widoku i jego celu]

## 2. Routing widoku
[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów
[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów
### [Nazwa komponentu 1]
- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]
[...]

## 5. Typy
[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem
[Opis zarządzania stanem w widoku]

## 7. Integracja API
[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika
[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja
[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów
[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji
1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.