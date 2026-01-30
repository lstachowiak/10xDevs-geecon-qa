# Plan implementacji widoku Lista Sesji

## 1. Przegląd
Widok "Lista Sesji" jest częścią panelu moderatora i służy do wyświetlania, zarządzania i nawigacji do wszystkich utworzonych sesji Q&A. Umożliwia moderatorom przegląd kluczowych informacji o sesjach, tworzenie nowych oraz usuwanie istniejących. Widok jest dostępny tylko dla uwierzytelnionych użytkowników z rolą moderatora.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/moderator/sessions`. Dostęp do tej ścieżki musi być chroniony i wymagać uwierzytelnienia.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie następująca:

- `SessionsListPage.astro`: Główny plik strony, renderuje layout i osadza komponent React. Odpowiada za ochronę trasy.
  - `SessionsList.tsx` (ładowany po stronie klienta): Główny komponent React, który zarządza stanem, logiką pobierania danych i interakcjami.
    - `Button` (z Shadcn/ui): Przycisk przekierowujący do formularza tworzenia nowej sesji (`/moderator/sessions/new`).
    - `SessionsTable.tsx`: Komponent prezentujący dane sesji w formie tabeli.
      - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` (z Shadcn/ui): Elementy składowe tabeli.
      - `Button` (z Shadcn/ui): Przyciski do akcji "Kopiuj slug" i "Usuń".
      - `AlertDialog` (z Shadcn/ui): Komponent do potwierdzenia operacji usunięcia sesji.
    - `EmptyState.tsx`: Komponent wyświetlany, gdy lista sesji jest pusta.

## 4. Szczegóły komponentów

### `SessionsList.tsx`
- **Opis komponentu:** Kontener orkiestrujący cały widok listy sesji. Odpowiada za pobieranie danych, zarządzanie stanem (paginacja, sortowanie, ładowanie, błędy) i przekazywanie danych do komponentów podrzędnych.
- **Główne elementy:**
  - Nagłówek z tytułem "Sessions" i przyciskiem "Create New Session".
  - Komponent `SessionsTable` lub `EmptyState` w zależności od tego, czy są dostępne dane.
  - Komponent `Pagination` (jeśli jest wymagany i dostępny w Shadcn/ui lub do stworzenia).
- **Obsługiwane interakcje:**
  - Kliknięcie "Create New Session".
  - Zmiana strony w paginacji.
  - Zmiana kryteriów sortowania.
  - Inicjowanie usunięcia sesji.
- **Typy:** `SessionViewModel`, `PaginationDTO`.
- **Propsy:** Brak.

### `SessionsTable.tsx`
- **Opis komponentu:** Wyświetla listę sesji w interaktywnej tabeli. Każdy wiersz reprezentuje jedną sesję i zawiera akcje, które można na niej wykonać.
- **Główne elementy:**
  - Tabela (`Table`) z kolumnami: `Name`, `Speaker`, `Session Date`, `Slug`, `Questions`, `Actions`.
  - W komórce `Slug` przycisk do kopiowania wartości do schowka.
  - W komórce `Actions` link do zarządzania pytaniami (`/session/[slug]`) oraz przycisk do usunięcia sesji.
- **Obsługiwane interakcje:**
  - `onDelete(sessionId: string)`: Emitowane po kliknięciu przycisku "Usuń".
  - `onCopy(slug: string)`: Emitowane po kliknięciu przycisku "Kopiuj".
  - `onSortChange(sortBy: string, sortOrder: 'asc' | 'desc')`: Emitowane po kliknięciu na nagłówek kolumny.
- **Typy:** `SessionViewModel`.
- **Propsy:**
  - `sessions: SessionViewModel[]`: Tablica sesji do wyświetlenia.
  - `onDelete: (sessionId: string) => void`: Funkcja zwrotna do obsługi usunięcia.
  - `onCopy: (slug: string) => void`: Funkcja zwrotna do obsługi kopiowania.

## 5. Typy

### `SessionViewModel` (nowy typ)
Rozszerza istniejący `SessionDTO` o dodatkowe pole wymagane przez widok, zgodnie z historyjką użytkownika US-010.

```typescript
import type { SessionDTO } from "@/types";

/**
 * ViewModel for the session list, extending the base DTO with
 * additional data required for the view.
 */
export interface SessionViewModel extends SessionDTO {
  /**
   * The total number of questions asked in the session.
   * Required by US-010.
   */
  questionCount: number;
}
```
**Uwaga:** Wprowadzenie tego typu wymaga modyfikacji po stronie backendu (w `sessions.service.ts`), aby zliczać pytania dla każdej sesji podczas pobierania listy.

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `SessionsList.tsx` przy użyciu hooka `useState` i `useEffect`. Opcjonalnie, logika ta może zostać wyekstrahowana do customowego hooka `useSessions` w celu poprawy czytelności i reużywalności.

- **Zmienne stanu:**
  - `sessions: SessionViewModel[]`: Lista pobranych sesji.
  - `pagination: PaginationDTO | null`: Dane paginacji z API.
  - `isLoading: boolean`: Flaga informująca o stanie ładowania danych.
  - `error: string | null`: Przechowuje komunikaty o błędach.
  - `queryParams: { page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc' }`: Obiekt przechowujący aktualne parametry zapytania do API.

- **Custom Hook `useSessions` (rekomendowany):**
  Hook ten będzie enkapsulował całą logikę związaną z API: pobieranie, usuwanie, paginację i sortowanie. Zwracałby stan (`sessions`, `isLoading`, etc.) oraz funkcje do modyfikacji tego stanu (`deleteSession`, `setQueryParams`).

## 7. Integracja API

### `GET /api/sessions`
- **Cel:** Pobranie paginowanej i posortowanej listy sesji.
- **Wywołanie:** Przy montowaniu komponentu `SessionsList` oraz przy każdej zmianie `queryParams`.
- **Parametry zapytania:** `page`, `limit`, `sortBy`, `sortOrder`. Zgodnie z US-010, domyślne sortowanie powinno być ustawione na `sortBy=sessionDate`.
- **Typ odpowiedzi:** `SessionListResponseDTO` (zmodyfikowany, aby zawierał `data: SessionViewModel[]`).

### `DELETE /api/sessions/:id`
- **Cel:** Usunięcie wybranej sesji.
- **Wywołanie:** Po potwierdzeniu przez użytkownika w `AlertDialog`.
- **Parametry ścieżki:** `id` (UUID sesji).
- **Typ odpowiedzi:** `204 No Content`. Po otrzymaniu tej odpowiedzi, lista sesji powinna zostać odświeżona.
- **Uwaga:** Ten endpoint musi zostać zaimplementowany po stronie backendu.

## 8. Interakcje użytkownika
- **Przeglądanie listy:** Użytkownik widzi tabelę z sesjami. Jeśli lista jest długa, może używać paginacji.
- **Sortowanie:** Kliknięcie na nagłówek kolumny (np. "Name", "Session Date") powoduje ponowne posortowanie listy po stronie serwera i odświeżenie widoku.
- **Kopiowanie slugu:** Kliknięcie przycisku "Kopiuj" przy slugu sesji kopiuje go do schowka i wyświetla krótkie powiadomienie (toast) o powodzeniu operacji.
- **Usuwanie sesji:**
  1. Użytkownik klika przycisk "Usuń" przy wybranej sesji.
  2. Otwiera się modal `AlertDialog` z prośbą o potwierdzenie.
  3. Kliknięcie "Anuluj" zamyka modal.
  4. Kliknięcie "Potwierdź" wysyła żądanie `DELETE`, zamyka modal i odświeża listę sesji.
- **Tworzenie sesji:** Kliknięcie "Create New Session" przekierowuje użytkownika na stronę `/moderator/sessions/new`.

## 9. Warunki i walidacja
- **Ochrona trasy:** Dostęp do `/moderator/sessions` jest weryfikowany po stronie serwera w pliku `SessionsListPage.astro`. Niezalogowany użytkownik jest przekierowywany na stronę logowania.
- **Uprawnienia do akcji:** API (`DELETE /api/sessions/:id`) musi weryfikować, czy uwierzytelniony użytkownik ma uprawnienia moderatora. Frontend zakłada, że jeśli użytkownik widzi panel, to ma uprawnienia.

## 10. Obsługa błędów
- **Błąd pobierania danych:** Jeśli `GET /api/sessions` zwróci błąd, w miejscu tabeli wyświetlony zostanie komunikat o błędzie z możliwością ponowienia próby.
- **Błąd usuwania sesji:** Jeśli `DELETE /api/sessions/:id` zwróci błąd, użytkownik zobaczy powiadomienie (toast) z informacją o niepowodzeniu operacji.
- **Pusta lista:** Jeśli API zwróci pustą listę sesji, zamiast tabeli zostanie wyświetlony komponent `EmptyState` z zachętą do utworzenia pierwszej sesji.
- **Brak autentykacji (401):** W przypadku utraty sesji, globalny handler zapytań (w kliencie Supabase) powinien przekierować użytkownika do strony logowania.

## 11. Kroki implementacji
1.  **Backend:**
    - Zaimplementować endpoint `DELETE /api/sessions/:id` w `src/pages/api/sessions/[id]/index.ts`.
    - Stworzyć funkcję `deleteSession` w `src/lib/services/sessions.service.ts`.
    - Zmodyfikować funkcję `getAllSessions` w `sessions.service.ts`, aby dołączała i zliczała pytania (`questionCount`) dla każdej sesji.
    - Zaktualizować typ `SessionListResponseDTO` w `src/types.ts`, aby `data` było typu `SessionViewModel[]`.
2.  **Frontend - Struktura:**
    - Utworzyć plik strony `src/pages/moderator/sessions.astro`. Dodać w nim logikę ochrony trasy.
    - Wewnątrz pliku `.astro` osadzić komponent React `SessionsList.tsx` z dyrektywą `client:load`.
    - Utworzyć pliki dla komponentów React: `src/components/moderator/SessionsList.tsx`, `src/components/moderator/SessionsTable.tsx`.
3.  **Frontend - Komponenty i Logika:**
    - Zaimplementować `SessionsList.tsx`, w tym logikę pobierania danych z `GET /api/sessions` przy użyciu `useEffect`.
    - Zaimplementować `SessionsTable.tsx` używając komponentów `Table` z Shadcn/ui do wyświetlania danych przekazanych przez propsy.
    - Dodać obsługę akcji: kopiowania slugu (z użyciem `navigator.clipboard` i `sonner` do powiadomień) oraz usuwania.
    - Zintegrować `AlertDialog` z Shadcn/ui do potwierdzania usunięcia.
    - Dodać obsługę stanów `isLoading` (np. wyświetlając szkielet tabeli) i `error`.
    - Zaimplementować komponent `EmptyState` na wypadek braku sesji.
4.  **Stylowanie i Dostępność:**
    - Użyć Tailwind CSS do stylowania zgodnie z resztą aplikacji.
    - Zapewnić, że tabela i przyciski są w pełni dostępne (odpowiednie atrybuty ARIA, obsługa klawiatury).
5.  **Testowanie:**
    - Przetestować ręcznie wszystkie interakcje użytkownika: tworzenie, sortowanie, kopiowanie, usuwanie.
    - Sprawdzić obsługę błędów i przypadków brzegowych (pusta lista, błędy API).
