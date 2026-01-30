# Plan implementacji widoku Strona Główna

## 1. Przegląd
Widok "Strona Główna" jest punktem wejścia dla uczestników konferencji. Jego głównym celem jest umożliwienie użytkownikom szybkiego dołączenia do istniejącej sesji Q&A poprzez wprowadzenie unikalnego kodu (slug). Widok charakteryzuje się minimalistycznym interfejsem, skupionym na jednej, kluczowej akcji, aby zapewnić maksymalną prostotę i szybkość obsługi.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką aplikacji: `/`.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie prosta i skoncentrowana na interakcji z użytkownikiem.

```
- Welcome (Astro)
  - SessionJoinForm (React)
    - Input (Shadcn/ui)
    - Button (Shadcn/ui)
  - Toaster (Shadcn/ui)
```

- `Welcome.astro`: Główny komponent strony, renderowany po stronie serwera. Odpowiada za statyczną zawartość, taką jak tytuł i instrukcje.
- `SessionJoinForm.tsx`: Komponent kliencki (React) zawierający logikę formularza dołączania do sesji.
- `Toaster`: Komponent z biblioteki `sonner` do wyświetlania powiadomień (toastów) o błędach.

## 4. Szczegóły komponentów
### SessionJoinForm.tsx
- **Opis komponentu**: Interaktywny formularz React, który umożliwia użytkownikowi wprowadzenie kodu sesji i próbę dołączenia do niej. Komponent zarządza stanem formularza, walidacją i komunikacją z API.
- **Główne elementy**:
  - `<form>`: Główny element HTML.
  - `Input`: Komponent z `shadcn/ui` do wprowadzania kodu sesji.
  - `Button`: Komponent z `shadcn/ui` do wysłania formularza.
- **Obsługiwane interakcje**:
  - `onChange` na polu `Input`: Aktualizacja stanu komponentu z wartością wprowadzonego kodu.
  - `onSubmit` na elemencie `<form>`: Uruchomienie logiki walidacji i wysłanie zapytania do API w celu weryfikacji kodu sesji.
- **Obsługiwana walidacja**:
  - **Puste pole**: Przycisk "Dołącz" jest nieaktywny (`disabled`), jeśli pole `Input` jest puste.
  - **Długość kodu**: Walidacja minimalnej i maksymalnej długości kodu sesji (np. min. 3 znaki), aby uniknąć niepotrzebnych zapytań do API.
- **Typy**:
  - `SessionJoinFormViewModel`: `{ slug: string; isLoading: boolean; }`
- **Propsy**: Brak. Komponent jest w pełni autonomiczny.

## 5. Typy
Do implementacji tego widoku nie są wymagane nowe typy DTO. Wykorzystane zostaną istniejące definicje. Wprowadzony zostanie jeden lokalny typ dla modelu widoku (ViewModel) w celu zarządzania stanem formularza.

- **`SessionJoinFormViewModel`**:
  - `slug: string`: Przechowuje aktualną wartość wprowadzoną w polu `Input`.
  - `isLoading: boolean`: Flaga informująca, czy trwa proces weryfikacji kodu sesji (zapytanie do API). Służy do blokowania przycisku i wyświetlania wskaźnika ładowania.

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane lokalnie w komponencie `SessionJoinForm.tsx` przy użyciu hooka `useState` z Reacta. Nie ma potrzeby tworzenia dedykowanego customowego hooka ani globalnego stanu, ponieważ logika jest prosta i zamknięta w obrębie jednego komponentu.

```typescript
const [viewModel, setViewModel] = useState<SessionJoinFormViewModel>({
  slug: '',
  isLoading: false,
});
```

## 7. Integracja API
Integracja z backendem będzie polegała na obsłudze jednego punktu końcowego: `GET /api/sessions/:slug`.

- **Akcja**: Po zatwierdzeniu formularza, komponent `SessionJoinForm` wyśle zapytanie `GET` pod adres `/api/sessions/{slug}`, gdzie `{slug}` to wartość z pola `Input`.
- **Typy**:
  - **Żądanie**: Parametr `slug` jest częścią ścieżki URL.
  - **Odpowiedź (Sukces 200 OK)**: `SessionDTO`. Po otrzymaniu poprawnej odpowiedzi, aplikacja przekieruje użytkownika na stronę sesji: `/session/{slug}`.
  - **Odpowiedź (Błąd 404 Not Found)**: `ErrorResponseDTO`. W przypadku błędu, komponent wyświetli powiadomienie (toast) z komunikatem "Nie znaleziono sesji o podanym kodzie."

## 8. Interakcje użytkownika
1.  **Wprowadzanie kodu**: Użytkownik wpisuje kod sesji w polu `Input`. Przycisk "Dołącz" staje się aktywny, gdy pole nie jest puste.
2.  **Zatwierdzenie**: Użytkownik klika przycisk "Dołącz" lub naciska Enter.
    - Przycisk zostaje zablokowany, a na nim pojawia się wskaźnik ładowania.
    - Aplikacja wysyła zapytanie do API.
3.  **Wynik (Sukces)**: Jeśli API zwróci status 200, następuje automatyczne przekierowanie na stronę `/session/{slug}`.
4.  **Wynik (Błąd)**: Jeśli API zwróci status 404 lub inny błąd, przycisk zostaje odblokowany, a na ekranie pojawia się powiadomienie toast z odpowiednim komunikatem błędu.

## 9. Warunki i walidacja
- **Warunek**: Pole `Input` nie może być puste.
  - **Komponent**: `SessionJoinForm.tsx`.
  - **Wpływ na interfejs**: Atrybut `disabled` na komponencie `Button` jest dynamicznie ustawiany na podstawie stanu `viewModel.slug`.
- **Warunek**: Proces weryfikacji jest w toku (`isLoading === true`).
  - **Komponent**: `SessionJoinForm.tsx`.
  - **Wpływ na interfejs**: Atrybut `disabled` na komponencie `Button` jest ustawiony na `true`, a wewnątrz przycisku wyświetlany jest spinner.

## 10. Obsługa błędów
- **Nie znaleziono sesji (404)**: Po otrzymaniu odpowiedzi 404 z API, komponent `SessionJoinForm` użyje funkcji `toast.error()` z biblioteki `sonner`, aby wyświetlić komunikat: "Nie znaleziono sesji o podanym kodzie."
- **Błąd serwera (500)**: W przypadku błędu serwera, zostanie wyświetlony ogólny komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Problem z siecią**: Standardowe mechanizmy przeglądarki (np. `fetch` rzucający wyjątek) zostaną przechwycone w bloku `try...catch`, a użytkownik zobaczy komunikat: "Błąd połączenia. Sprawdź swoje połączenie z internetem."

## 11. Kroki implementacji
1.  **Utworzenie komponentu `SessionJoinForm.tsx`**: Stworzenie pliku `src/components/SessionJoinForm.tsx`.
2.  **Implementacja stanu i logiki**: W `SessionJoinForm.tsx` zaimplementować lokalny stan przy użyciu `useState` do przechowywania `slug` i `isLoading`.
3.  **Budowa formularza**: Dodać elementy JSX dla formularza, używając komponentów `Input` i `Button` z `shadcn/ui`. Powiązać ich właściwości (`value`, `disabled`, `onClick`) ze stanem komponentu.
4.  **Implementacja obsługi zdarzeń**: Dodać funkcje obsługujące `onChange` dla `Input` oraz `onSubmit` dla formularza.
5.  **Integracja z API**: W funkcji `onSubmit` zaimplementować wywołanie `fetch` do endpointu `GET /api/sessions/:slug`.
6.  **Obsługa odpowiedzi API**: Dodać logikę obsługującą sukces (przekierowanie za pomocą `window.location.href`) i błędy (wyświetlanie powiadomień `toast`).
7.  **Dodanie `Toaster`**: W głównym layoucie aplikacji (`src/layouts/Layout.astro`) lub w komponencie `Welcome.astro` dodać komponent `<Toaster />` z `sonner`, aby powiadomienia były widoczne.
8.  **Integracja z `Welcome.astro`**: Zaimportować i umieścić komponent `<SessionJoinForm client:load />` w pliku `src/pages/index.astro` (lub w komponencie `Welcome.astro`, jeśli taki jest używany na stronie głównej), aby umożliwić jego renderowanie po stronie klienta.
9.  **Stylowanie i dostępność**: Dodać odpowiednie etykiety `aria-label` i upewnić się, że interfejs jest w pełni responsywny i dostępny.
10. **Testowanie**: Przeprowadzić manualne testy, sprawdzając wszystkie ścieżki interakcji, w tym poprawne kody, niepoprawne kody i scenariusze błędów.
