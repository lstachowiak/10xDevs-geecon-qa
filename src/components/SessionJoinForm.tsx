import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SessionDTO } from "@/types";

interface SessionJoinFormViewModel {
  slug: string;
  isLoading: boolean;
}

export function SessionJoinForm() {
  const [viewModel, setViewModel] = useState<SessionJoinFormViewModel>({
    slug: "",
    isLoading: false,
  });

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setViewModel((prev) => ({
      ...prev,
      slug: e.target.value.trim(),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!viewModel.slug || viewModel.slug.length < 3) {
      return;
    }

    setViewModel((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/sessions/${viewModel.slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Nie znaleziono sesji o podanym kodzie.");
        } else if (response.status === 500) {
          toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
        } else {
          toast.error("Wystąpił nieoczekiwany błąd.");
        }
        setViewModel((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const session: SessionDTO = await response.json();
      window.location.href = `/session/${session.uniqueUrlSlug}`;
    } catch {
      toast.error("Błąd połączenia. Sprawdź swoje połączenie z internetem.");
      setViewModel((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const isButtonDisabled = !viewModel.slug || viewModel.slug.length < 3 || viewModel.isLoading;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <label htmlFor="session-code" className="text-sm font-medium text-blue-100/90 block">
          Kod sesji
        </label>
        <Input
          id="session-code"
          type="text"
          value={viewModel.slug}
          onChange={handleSlugChange}
          placeholder="Wprowadź kod sesji..."
          disabled={viewModel.isLoading}
          aria-label="Pole do wprowadzenia kodu sesji"
          aria-describedby="session-code-hint"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-blue-400 focus-visible:ring-blue-400/50"
          data-testid="session-slug-input"
        />
        <p id="session-code-hint" className="text-xs text-blue-100/70">
          Wprowadź co najmniej 3 znaki
        </p>
      </div>

      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Przycisk dołączenia do sesji"
        data-testid="session-join-button"
      >
        {viewModel.isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Weryfikacja...
          </>
        ) : (
          "Dołącz"
        )}
      </Button>
    </form>
  );
}
