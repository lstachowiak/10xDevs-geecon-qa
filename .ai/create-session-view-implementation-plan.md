# Plan implementacji widoku: Tworzenie Sesji

## 1. Przegląd
Celem tego widoku jest umożliwienie moderatorom tworzenia nowych sesji Q&A. Widok będzie zawierał formularz do wprowadzania danych sesji, takich jak nazwa, prelegent, data i opcjonalny opis. Po pomyślnym utworzeniu sesji, użytkownik zobaczy podsumowanie z unikalnym linkiem do nowo utworzonej sesji, który będzie można łatwo skopiować.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- `/moderator/sessions/new`

## 3. Struktura komponentów
Hierarchia komponentów dla widoku tworzenia sesji będzie wyglądać następująco:

```
/pages/moderator/sessions/new.astro
└── SessionCreator.tsx (komponent kliencki)
    ├── SessionForm.tsx
    │   ├── Input (dla nazwy sesji)
    │   ├── Input (dla prelegenta)
    │   ├── Input (dla daty sesji)
    │   ├── Textarea (dla opisu)
    │   └── Button (do wysłania formularza)
    └── SessionSummary.tsx
        ├── Card
        ├── p (dla wyświetlenia danych sesji)
        └── Button (do kopiowania linku)
```

## 4. Szczegóły komponentów

### `SessionCreator.tsx`
- **Opis komponentu:** Główny komponent kontenerowy, który zarządza stanem całego procesu tworzenia sesji. Renderuje `SessionForm` lub `SessionSummary` w zależności od stanu (czy sesja została już utworzona).
- **Główne elementy:** Renderuje warunkowo `SessionForm` lub `SessionSummary`.
- **Obsługiwane interakcje:**
    - Przesłanie formularza z `SessionForm`.
    - Kopiowanie linku z `SessionSummary`.
- **Typy:** `Session`, `CreateSessionDTO`.
- **Propsy:** Brak.

### `SessionForm.tsx`
- **Opis komponentu:** Formularz służący do wprowadzania danych nowej sesji. Składa się z pól tekstowych i przycisku.
- **Główne elementy:** `form`, `Input`, `Textarea`, `Button`.
- **Obsługiwane interakcje:**
    - `onChange` na polach `Input` i `Textarea` do aktualizacji stanu formularza.
    - `onSubmit` na elemencie `form` w celu uruchomienia logiki tworzenia sesji.
- **Obsługiwana walidacja:**
    - `name`: Wymagane, minimum 1 znak.
    - `speaker`: Wymagane, minimum 1 znak.
    - `sessionDate`: Wymagane, format daty i czasu ISO 8601.
    - `description`: Opcjonalne.
- **Typy:** `CreateSessionDTO`.
- **Propsy:**
    - `onSubmit: (data: CreateSessionDTO) => void;`
    - `isSubmitting: boolean;`

### `SessionSummary.tsx`
- **Opis komponentu:** Wyświetla podsumowanie nowo utworzonej sesji, w tym jej dane i unikalny link.
- **Główne elementy:** `Card`, `p`, `Button`.
- **Obsługiwane interakcje:**
    - `onClick` na przycisku "Kopiuj link", aby skopiować URL sesji do schowka.
- **Typy:** `Session`.
- **Propsy:**
    - `session: Session;`

## 5. Typy
Do implementacji widoku wymagane będą następujące typy:

- **`CreateSessionDTO` (Data Transfer Object):** Obiekt wysyłany do API w celu utworzenia nowej sesji.
  ```typescript
  interface CreateSessionDTO {
    name: string;
    speaker: string;
    description?: string;
    sessionDate: string; // ISO 8601 datetime string
  }
  ```

- **`Session` (ViewModel):** Obiekt reprezentujący sesję otrzymany z API po jej utworzeniu. Będzie używany w komponencie `SessionSummary`.
  ```typescript
  interface Session {
    id: string; // uuid
    name: string;
    speaker: string;
    description?: string;
    sessionDate: string; // ISO 8601 datetime string
    uniqueUrlSlug: string;
    createdAt: string; // ISO 8601 datetime string
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane wewnątrz komponentu `SessionCreator.tsx` przy użyciu hooków `useState` z Reacta. Rozważone zostanie stworzenie dedykowanego hooka `useCreateSession`.

- **`useCreateSession` hook:**
    - **Cel:** Hermetyzacja logiki tworzenia sesji, w tym obsługa stanu formularza, komunikacja z API, zarządzanie stanem ładowania i obsługa błędów.
    - **Zwracane wartości:**
        - `createdSession: Session | null`: Przechowuje dane utworzonej sesji.
        - `isLoading: boolean`: Informuje, czy żądanie do API jest w toku.
        - `error: Error | null`: Przechowuje informacje o błędach.
        - `createSession: (data: CreateSessionDTO) => Promise<void>`: Funkcja do wywołania w celu utworzenia sesji.

## 7. Integracja API
Integracja z API będzie polegała na wysłaniu żądania `POST` na endpoint `/api/sessions`.

- **Żądanie (Request):**
    - **Metoda:** `POST`
    - **Endpoint:** `/api/sessions`
    - **Typ body:** `CreateSessionDTO`
    - **Przykład body:**
      ```json
      {
        "name": "Wprowadzenie do Astro",
        "speaker": "Jan Kowalski",
        "description": "Podstawy tworzenia aplikacji w Astro.",
        "sessionDate": "2026-06-20T10:00:00Z"
      }
      ```

- **Odpowiedź (Response):**
    - **Status:** `201 Created`
    - **Typ body:** `Session`
    - **Przykład body:**
      ```json
      {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Wprowadzenie do Astro",
        "speaker": "Jan Kowalski",
        "description": "Podstawy tworzenia aplikacji w Astro.",
        "sessionDate": "2026-06-20T10:00:00Z",
        "uniqueUrlSlug": "wprowadzenie-do-astro-xyz",
        "createdAt": "2026-01-30T12:00:00Z"
      }
      ```

## 8. Interakcje użytkownika
- **Wypełnianie formularza:** Użytkownik wprowadza dane w polach formularza. Stan komponentu `SessionForm` jest aktualizowany na bieżąco.
- **Wysyłanie formularza:** Użytkownik klika przycisk "Utwórz sesję". Przycisk jest nieaktywny podczas wysyłania.
- **Wyświetlanie podsumowania:** Po pomyślnym utworzeniu sesji, formularz jest ukrywany, a na jego miejscu pojawia się komponent `SessionSummary` z danymi nowej sesji.
- **Kopiowanie linku:** Użytkownik klika przycisk "Kopiuj link" w `SessionSummary`, co powoduje skopiowanie pełnego adresu URL sesji do schowka. Użytkownik powinien otrzymać wizualne potwierdzenie (np. zmiana tekstu przycisku, tooltip).

## 9. Warunki i walidacja
- **Walidacja po stronie klienta:**
    - Pola `name` i `speaker` nie mogą być puste.
    - Pole `sessionDate` musi być poprawną datą.
    - Przycisk "Utwórz sesję" jest nieaktywny, dopóki wymagane pola nie zostaną poprawnie wypełnione.
- **Walidacja po stronie serwera:**
    - Endpoint `/api/sessions` wykonuje pełną walidację danych zgodnie ze schematem Zod. W przypadku błędu walidacji, frontend powinien wyświetlić odpowiednie komunikaty przy polach formularza.

## 10. Obsługa błędów
- **Błędy walidacji (400 Bad Request):** Komunikaty o błędach z API (`details`) powinny być wyświetlane pod odpowiednimi polami formularza.
- **Brak autoryzacji (401 Unauthorized):** Użytkownik powinien zostać przekierowany na stronę logowania.
- **Konflikt (409 Conflict):** Chociaż endpoint powinien próbować ponowić operację, w rzadkich przypadkach błąd może dotrzeć do klienta. Należy wyświetlić ogólny komunikat o błędzie z prośbą o ponowną próbę.
- **Inne błędy serwera (5xx):** Należy wyświetlić ogólny komunikat o błędzie (np. za pomocą komponentu `Sonner`), informujący o problemie po stronie serwera i zachęcający do ponownej próby.

## 11. Kroki implementacji
1.  **Utworzenie pliku strony:** Stworzyć plik `/src/pages/moderator/sessions/new.astro`.
2.  **Implementacja endpointu API:** Zaimplementować logikę dla `POST /api/sessions` w pliku `/src/pages/api/sessions/index.ts`, włączając walidację Zod i obsługę błędów.
3.  **Stworzenie komponentu `SessionCreator.tsx`:** Zaimplementować główny komponent kliencki, który będzie zarządzał stanem i renderował warunkowo formularz lub podsumowanie.
4.  **Stworzenie komponentu `SessionForm.tsx`:** Zbudować formularz z polami `Input`, `Textarea` i `Button` z wykorzystaniem komponentów z `shadcn/ui`. Dodać obsługę stanu i walidacji po stronie klienta.
5.  **Stworzenie komponentu `SessionSummary.tsx`:** Zaimplementować widok podsumowania sesji z użyciem komponentu `Card`. Dodać logikę kopiowania linku do schowka.
6.  **Implementacja hooka `useCreateSession`:** Opcjonalnie, wyodrębnić logikę zarządzania stanem, wywołań API i obsługi błędów do dedykowanego hooka.
7.  **Integracja komponentów:** Połączyć wszystkie komponenty w pliku `new.astro`, zapewniając poprawny przepływ danych i zdarzeń.
8.  **Styling i UI:** Dopracować wygląd widoku zgodnie z systemem designu, używając Tailwind CSS.
9.  **Testowanie:** Przeprowadzić testy manualne w celu weryfikacji wszystkich interakcji użytkownika, walidacji i obsługi błędów.
10. **Dokumentacja:** Upewnić się, że kod jest dobrze udokumentowany, a typy i propsy są jasno zdefiniowane.
