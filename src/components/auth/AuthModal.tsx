import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { LoginForm } from "./LoginForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthView = "login" | "forgot-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset do widoku logowania po zamknięciu
      setTimeout(() => setCurrentView("login"), 200);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{currentView === "login" ? "Logowanie moderatora" : "Resetowanie hasła"}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentView === "login"
              ? "Zaloguj się, aby uzyskać dostęp do panelu moderatora"
              : "Wprowadź swój adres email, aby otrzymać link do resetowania hasła"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {currentView === "login" ? (
          <LoginForm onForgotPassword={() => setCurrentView("forgot-password")} />
        ) : (
          <ForgotPasswordForm onBackToLogin={() => setCurrentView("login")} />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
