import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./auth/AuthModal";
import { LogIn, LogOut } from "lucide-react";

interface AuthActionsProps {
  isAuthenticated: boolean;
}

export function AuthActions({ isAuthenticated }: AuthActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Odświeżamy stronę, aby zaktualizować stan sesji
        window.location.reload();
      }
    } catch {
      // Ignorujemy błędy wylogowania
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isLoggingOut}>
        <LogOut className="h-4 w-4 mr-2" />
        {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
        <LogIn className="h-4 w-4 mr-2" />
        Zaloguj
      </Button>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
