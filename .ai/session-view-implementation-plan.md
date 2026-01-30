# Plan implementacji widoku Sesji

## 1. Przegląd
Widok Sesji (`/session/[slug]`) jest głównym interfejsem dla uczestników sesji Q&A. Umożliwia przeglądanie pytań zadanych przez innych, dodawanie własnych oraz głosowanie na najciekawsze z nich. Widok dynamicznie odświeża listę pytań, zapewniając aktualność danych bez konieczności ręcznego przeładowywania strony.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką: `/session/[slug]`, gdzie `[slug]` jest unikalnym identyfikatorem sesji.

## 3. Struktura komponentów
```
/src/pages/session/[slug].astro
└── SessionView.tsx (React, "use client")
    ├── SessionHeader.tsx (React)
    │   └── Card (Shadcn/ui)
    ├── QuestionForm.tsx (React)
    │   ├── Textarea (Shadcn/ui)
    │   ├── Input (Shadcn/ui)
    │   └── Button (Shadcn/ui)
    ├── QuestionList.tsx (React)
    │   ├── QuestionItem.tsx (React)
    │   │   ├── Button (Shadcn/ui, do upvote)
    │   │   └── Badge (Shadcn/ui, "Answered")
    │   └── EmptyState.tsx (React, gdy brak pytań)
    └── Toaster.tsx (React, z react-hot-toast lub podobnej biblioteki)
```

## 4. Szczegóły komponentów

### SessionView.tsx
- **Opis:** Główny komponent-kontener, który zarządza stanem całego widoku, pobiera dane i obsługuje logikę biznesową.
- **Główne elementy:** `SessionHeader`, `QuestionForm`, `QuestionList`.
- **Obsługiwane interakcje:** Pobieranie danych o sesji i pytań przy pierwszym renderowaniu, cykliczne odświeżanie listy pytań.
- **Typy:** `SessionViewModel`, `QuestionViewModel`.
- **Propsy:** `slug: string` (z Astro).

### SessionHeader.tsx
- **Opis:** Wyświetla informacje o bieżącej sesji (nazwa, prelegent).
- **Główne elementy:** `Card` z `CardHeader`, `CardTitle`, `CardDescription`.
- **Typy:** `SessionViewModel`.
- **Propsy:** `session: SessionViewModel | null`.

### QuestionForm.tsx
- **Opis:** Formularz do dodawania nowego pytania.
- **Główne elementy:** `Textarea` (treść pytania), `Input` (opcjonalne imię autora), `Button` (wyślij).
- **Obsługiwane interakcje:** Wprowadzanie tekstu, wysłanie formularza.
- **Warunki walidacji:** Treść pytania nie może być pusta.
- **Typy:** `CreateQuestionCommand`.
- **Propsy:** `onSubmit: (command: CreateQuestionCommand) => Promise<void>`, `isSubmitting: boolean`.

### QuestionList.tsx
- **Opis:** Renderuje listę pytań lub komponent `EmptyState`.
- **Główne elementy:** `QuestionItem[]` lub `EmptyState`.
- **Obsługiwane interakcje:** Głosowanie na pytanie (przekazanie akcji w górę).
- **Typy:** `QuestionViewModel[]`.
- **Propsy:** `questions: QuestionViewModel[]`, `onUpvote: (questionId: string) => void`.

### QuestionItem.tsx
- **Opis:** Reprezentuje pojedyncze pytanie na liście.
- **Główne elementy:** Treść pytania, autor, liczba głosów, `Button` do głosowania, `Badge` dla pytań z odpowiedzią.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Upvote".
- **Typy:** `QuestionViewModel`.
- **Propsy:** `question: QuestionViewModel`, `onUpvote: (questionId: string) => void`.

## 5. Typy
- **`SessionViewModel`**: Obiekt reprezentujący dane sesji na potrzeby widoku.
  ```typescript
  interface SessionViewModel {
    name: string;
    speaker: string;
  }
  ```
- **`QuestionViewModel`**: Obiekt reprezentujący pytanie na liście, wzbogacony o stan UI.
  ```typescript
  interface QuestionViewModel extends QuestionDTO {
    isUpvotedByUser: boolean; // Czy użytkownik już zagłosował
  }
  ```
- **`CreateQuestionCommand`**: Zgodny z DTO z `src/types.ts`.
- **`QuestionDTO`**, **`SessionDTO`**: Zgodne z DTO z `src/types.ts`.

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane za pomocą hooków React w komponencie `SessionView.tsx`. Proponuje się stworzenie customowego hooka `useSessionData`.

- **`useSessionData(slug: string)`**:
  - **Cel:** Hermetyzacja logiki pobierania danych sesji, pytań, cyklicznego odświeżania oraz dodawania pytań i głosowania.
  - **Zwracane wartości:**
    - `session: SessionViewModel | null`
    - `questions: QuestionViewModel[]`
    - `isLoading: boolean`
    - `error: Error | null`
    - `addQuestion: (command: CreateQuestionCommand) => Promise<void>`
    - `upvoteQuestion: (questionId: string) => Promise<void>`
  - **Logika wewnętrzna:**
    - `useState` do przechowywania `session`, `questions`, `loading`, `error`.
    - `useEffect` do pobrania danych o sesji i pytań przy montowaniu komponentu.
    - `setInterval` wewnątrz `useEffect` do cyklicznego pobierania pytań co 5 sekund.
    - Stan głosów użytkownika (`upvotedQuestions`) będzie przechowywany w `localStorage` i synchronizowany ze stanem komponentu.

## 7. Integracja API
- **Pobieranie danych sesji:**
  - `GET /api/sessions/[slug]`
  - Odpowiedź: `SessionDTO`
- **Pobieranie pytań:**
  - `GET /api/sessions/[slug]/questions`
  - Odpowiedź: `QuestionsListResponseDTO`
- **Dodawanie pytania:**
  - `POST /api/sessions/[slug]/questions`
  - Request Body: `CreateQuestionCommand`
  - Odpowiedź: `QuestionDTO`
- **Głosowanie na pytanie:**
  - `POST /api/questions/[id]/upvote`
  - Odpowiedź: `UpvoteResponseDTO`

## 8. Interakcje użytkownika
- **Dodawanie pytania:** Użytkownik wypełnia formularz i klika "Wyślij". Przycisk jest blokowany na czas wysyłania. Po sukcesie lista pytań jest odświeżana, a formularz czyszczony.
- **Głosowanie:** Użytkownik klika przycisk "Upvote". Przycisk zmienia stan na "wciśnięty", a licznik głosów aktualizuje się. Stan głosu jest zapisywany w `localStorage`, aby uniemożliwić kolejne głosy na to samo pytanie z tej samej przeglądarki.

## 9. Warunki i walidacja
- **Formularz dodawania pytania:** Pole `content` (`Textarea`) jest wymagane i nie może być puste. Walidacja będzie realizowana po stronie klienta przed wysłaniem żądania.

## 10. Obsługa błędów
- **Nie znaleziono sesji (404):** Komponent `SessionView` wyświetli komunikat o błędzie i nie będzie próbował pobierać pytań.
- **Błąd serwera (500):** Wyświetlony zostanie generyczny komunikat o błędzie za pomocą komponentu `Toast`.
- **Błąd walidacji formularza:** Komunikaty o błędach wyświetlane będą pod odpowiednimi polami formularza.
- **Błąd dodawania/głosowania:** Informacja o niepowodzeniu operacji zostanie wyświetlona w `Toast`.

## 11. Kroki implementacji
1.  **Stworzenie plików komponentów:** Utworzenie pustych plików `.tsx` dla `SessionView`, `SessionHeader`, `QuestionForm`, `QuestionList`, `QuestionItem` i `EmptyState` w katalogu `src/components/`.
2.  **Implementacja `[slug].astro`:** Stworzenie strony w `src/pages/session/`, która importuje i renderuje komponent `SessionView.tsx`, przekazując do niego `slug` z URL.
3.  **Implementacja `useSessionData`:** Stworzenie customowego hooka, który będzie zarządzał pobieraniem i aktualizacją danych.
4.  **Implementacja `SessionView`:** Zintegrowanie hooka `useSessionData` i poskładanie widoku z pozostałych komponentów.
5.  **Implementacja `SessionHeader`:** Stworzenie komponentu wyświetlającego dane sesji.
6.  **Implementacja `QuestionForm`:** Budowa formularza wraz z logiką walidacji i wysyłania.
7.  **Implementacja `QuestionList` i `QuestionItem`:** Stworzenie komponentów do wyświetlania listy pytań, logiki głosowania i obsługi stanu "answered".
8.  **Implementacja `EmptyState`:** Stworzenie komponentu wyświetlanego w przypadku braku pytań.
9.  **Stylowanie:** Dopracowanie wyglądu wszystkich komponentów przy użyciu Tailwind CSS i komponentów Shadcn/ui.
10. **Testowanie:** Manualne przetestowanie wszystkich interakcji, obsługi błędów i przypadków brzegowych.
