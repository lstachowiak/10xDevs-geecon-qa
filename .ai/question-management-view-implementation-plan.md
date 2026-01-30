# Plan implementacji widoku Zarządzanie Pytaniami

## 1. Przegląd
Widok "Zarządzanie Pytaniami" stanowi centralny panel dla moderatorów do zarządzania pytaniami zadanymi podczas konkretnej sesji Q&A. Umożliwia on przeglądanie pytań w czasie rzeczywistym, oznaczanie ich jako "odpowiedziane" oraz usuwanie nieodpowiednich treści. Celem jest zapewnienie płynnej i efektywnej moderacji, co bezpośrednio wpływa na jakość sesji z prelegentem.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką: `/moderator/sessions/[slug]`, gdzie `[slug]` jest unikalnym identyfikatorem sesji.

## 3. Struktura komponentów
```
/moderator/sessions/[slug].astro
└── SessionDetailsView (React)
    ├── SessionHeader (React)
    ├── QuestionsTable (React)
    │   ├── QuestionsTableRow (React)
    │   │   ├── Switch (Shadcn/ui)
    │   │   └── DeleteQuestionButton (React)
    │   │       └── AlertDialog (Shadcn/ui)
    │   └── EmptyState (React)
    └── Toaster (Shadcn/ui)
```

## 4. Szczegóły komponentów

### SessionDetailsView
- **Opis komponentu:** Główny komponent kontenerowy dla widoku zarządzania pytaniami. Odpowiada za pobieranie danych sesji i pytań, zarządzanie stanem oraz obsługę logiki biznesowej.
- **Główne elementy:** `SessionHeader`, `QuestionsTable`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, deleguje je do komponentów podrzędnych.
- **Obsługiwana walidacja:** Sprawdza, czy sesja o danym `slug` istnieje.
- **Typy:** `SessionDTO`, `QuestionViewModel`.
- **Propsy:** `slug: string`.

### SessionHeader
- **Opis komponentu:** Wyświetla kluczowe informacje o sesji, takie jak nazwa, prelegent i data.
- **Główne elementy:** Tytuł `<h2>` z nazwą sesji, paragrafy `<p>` z danymi prelegenta i datą.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `SessionDTO`.
- **Propsy:** `session: SessionDTO`.

### QuestionsTable
- **Opis komponentu:** Renderuje tabelę z listą pytań. Obsługuje sortowanie i wyświetla stan pusty, gdy nie ma pytań.
- **Główne elementy:** Komponent `Table` z `Shadcn/ui`, `QuestionsTableRow` dla każdego pytania, `EmptyState` w przypadku braku danych.
- **Obsługiwane interakcje:** Brak, deleguje do `QuestionsTableRow`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `QuestionViewModel[]`.
- **Propsy:** `questions: QuestionViewModel[]`, `onUpdateQuestion: (id: string, data: UpdateQuestionCommand) => void`, `onDeleteQuestion: (id: string) => void`.

### QuestionsTableRow
- **Opis komponentu:** Reprezentuje pojedynczy wiersz w tabeli pytań. Zawiera treść pytania, autora, liczbę głosów oraz kontrolki do moderacji.
- **Główne elementy:** Komponenty `TableRow` i `TableCell` z `Shadcn/ui`, `Switch` do zmiany statusu `isAnswered`, `DeleteQuestionButton`.
- **Obsługiwane interakcje:** Zmiana stanu przełącznika `Switch`, kliknięcie przycisku usuwania.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `QuestionViewModel`.
- **Propsy:** `question: QuestionViewModel`, `onUpdateQuestion: (id: string, data: UpdateQuestionCommand) => void`, `onDeleteQuestion: (id: string) => void`.

### DeleteQuestionButton
- **Opis komponentu:** Przycisk inicjujący proces usuwania pytania, wraz z modalem potwierdzającym.
- **Główne elementy:** Komponent `Button` z ikoną kosza, `AlertDialog` z `Shadcn/ui` do potwierdzenia.
- **Obsługiwane interakcje:** Kliknięcie przycisku usuwania, potwierdzenie lub anulowanie w modalu.
- **Obsługiwana walidacja:** Wymaga potwierdzenia od użytkownika przed wykonaniem akcji.
- **Typy:** Brak.
- **Propsy:** `questionId: string`, `onDelete: (id: string) => void`.

## 5. Typy
- **`QuestionViewModel`**: Rozszerzenie `QuestionDTO` o pola stanu UI.
  ```typescript
  export interface QuestionViewModel extends QuestionDTO {
    isUpdating?: boolean; // Flaga informująca o trwającej aktualizacji (np. zmiana statusu)
    isDeleting?: boolean; // Flaga informująca o trwającym procesie usuwania
  }
  ```
- **`UpdateQuestionCommand`**: Obiekt wysyłany w ciele żądania `PATCH /api/questions/:id`.
  ```typescript
  export interface UpdateQuestionCommand {
    isAnswered?: boolean;
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane przy użyciu customowego hooka `useQuestionManagement(slug: string)`.

- **Cel hooka:** Abstrakcja logiki pobierania danych, subskrypcji zmian w czasie rzeczywistym oraz wykonywania akcji moderacyjnych (aktualizacja, usuwanie).
- **Zwracane wartości:**
  - `session: SessionDTO | null`: Dane aktualnej sesji.
  - `questions: QuestionViewModel[]`: Lista pytań.
  - `isLoading: boolean`: Stan ładowania początkowych danych.
  - `error: Error | null`: Obiekt błędu.
  - `handleUpdateQuestion(id: string, data: UpdateQuestionCommand): Promise<void>`: Funkcja do aktualizacji pytania.
  - `handleDeleteQuestion(id: string): Promise<void>`: Funkcja do usuwania pytania.
- **Logika wewnętrzna:**
  - Użycie `useState` do przechowywania `session`, `questions`, `isLoading`, `error`.
  - Użycie `useEffect` do pobrania danych sesji i pytań przy pierwszym renderowaniu.
  - Użycie `useEffect` do ustanowienia subskrypcji Supabase Realtime dla tabeli `questions`, aby automatycznie aktualizować listę pytań.
  - Implementacja funkcji `handleUpdateQuestion` i `handleDeleteQuestion`, które optymistycznie aktualizują UI, wysyłają żądania do API, a w razie błędu przywracają poprzedni stan i wyświetlają powiadomienie.

## 7. Integracja API
- **`GET /api/sessions/:slug/questions?includeAnswered=true`**
  - **Cel:** Pobranie wszystkich pytań (w tym już odpowiedzianych) dla danej sesji.
  - **Typ odpowiedzi:** `QuestionsListResponseDTO`.
  - **Użycie:** Wywoływane przy inicjalizacji widoku wewnątrz hooka `useQuestionManagement`.
- **`PATCH /api/questions/:id`**
  - **Cel:** Zmiana statusu pytania (np. `isAnswered`).
  - **Typ żądania:** `UpdateQuestionCommand`.
  - **Typ odpowiedzi:** `QuestionDTO`.
  - **Użycie:** Wywoływane przez `handleUpdateQuestion` po interakcji z komponentem `Switch`.
- **`DELETE /api/questions/:id`**
  - **Cel:** Usunięcie pytania.
  - **Typ odpowiedzi:** `204 No Content`.
  - **Użycie:** Wywoływane przez `handleDeleteQuestion` po potwierdzeniu w `AlertDialog`.

## 8. Interakcje użytkownika
- **Oznaczanie pytania jako odpowiedziane:**
  1. Moderator klika `Switch` przy pytaniu.
  2. UI jest natychmiast aktualizowane (optimistic update), a `Switch` jest tymczasowo nieaktywny.
  3. Wywoływane jest żądanie `PATCH /api/questions/:id`.
  4. Po pomyślnej odpowiedzi, stan jest finalizowany. W razie błędu, UI wraca do poprzedniego stanu, a użytkownik widzi powiadomienie o błędzie.
- **Usuwanie pytania:**
  1. Moderator klika przycisk z ikoną kosza.
  2. Pojawia się `AlertDialog` z prośbą o potwierdzenie.
  3. Po potwierdzeniu, wiersz w tabeli jest wyszarzany lub oznaczany jako "usuwanie" (optimistic update).
  4. Wywoływane jest żądanie `DELETE /api/questions/:id`.
  5. Po pomyślnej odpowiedzi, pytanie znika z listy. W razie błędu, UI wraca do normalnego stanu, a użytkownik widzi powiadomienie.

## 9. Warunki i walidacja
- **Dostęp do widoku:** Widok musi być chroniony i dostępny tylko dla uwierzytelnionych użytkowników z rolą moderatora (obsługiwane przez middleware Astro).
- **Istnienie sesji:** Przed renderowaniem komponentów, system musi zweryfikować, czy sesja o podanym `slug` istnieje. W przeciwnym razie należy wyświetlić stronę błędu 404.
- **Potwierdzenie usunięcia:** Akcja usunięcia pytania jest destrukcyjna i wymaga jawnego potwierdzenia przez użytkownika w modalu `AlertDialog`.

## 10. Obsługa błędów
- **Błąd pobierania danych (404 Not Found):** Jeśli sesja lub pytania nie zostaną znalezione, hook `useQuestionManagement` zwróci błąd, co spowoduje wyświetlenie komponentu błędu lub przekierowanie na stronę 404.
- **Błąd sieci lub serwera (5xx):** W przypadku problemów z komunikacją z API, użytkownik zobaczy powiadomienie (toast) z informacją o niepowodzeniu operacji. Jeśli operacja była optymistyczna, stan UI zostanie przywrócony do stanu sprzed interakcji.
- **Brak pytań:** Jeśli dla sesji nie ma żadnych pytań, komponent `QuestionsTable` wyświetli komponent `EmptyState` z odpowiednim komunikatem.

## 11. Kroki implementacji
1. **Stworzenie pliku strony:** Utworzyć plik `/src/pages/moderator/sessions/[slug].astro`. Dodać podstawową strukturę i zabezpieczenie routingu w middleware.
2. **Implementacja `useQuestionManagement`:** Stworzyć plik `/src/components/hooks/useQuestionManagement.ts`. Zaimplementować w nim logikę pobierania danych, subskrypcji Supabase Realtime oraz funkcje `handleUpdateQuestion` i `handleDeleteQuestion`.
3. **Stworzenie komponentu `SessionDetailsView`:** Utworzyć plik `/src/components/moderator/SessionDetailsView.tsx`. Zintegrować w nim hook `useQuestionManagement` i renderować komponenty podrzędne.
4. **Stworzenie komponentu `QuestionsTable`:** Utworzyć plik `/src/components/moderator/QuestionsTable.tsx`. Zaimplementować tabelę przy użyciu komponentów Shadcn/ui i mapować dane pytań do `QuestionsTableRow`.
5. **Stworzenie komponentu `QuestionsTableRow`:** Utworzyć plik `/src/components/moderator/QuestionsTableRow.tsx`. Dodać logikę renderowania pojedynczego pytania oraz integrację `Switch` i `DeleteQuestionButton`.
6. **Stworzenie komponentu `DeleteQuestionButton`:** Utworzyć plik `/src/components/moderator/DeleteQuestionButton.tsx`. Zaimplementować logikę wyświetlania `AlertDialog` i wywoływania funkcji `onDelete`.
7. **Aktualizacja typów:** Dodać definicję `QuestionViewModel` w pliku `/src/types.ts`.
8. **Integracja w stronie Astro:** W pliku `[slug].astro` zaimportować i wyrenderować komponent `SessionDetailsView`, przekazując `slug` z parametrów URL.
9. **Testowanie:** Przeprowadzić testy manualne obejmujące wszystkie interakcje użytkownika i scenariusze błędów.
