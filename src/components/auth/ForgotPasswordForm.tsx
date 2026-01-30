import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/auth.schema";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Zawsze pokazujemy sukces, aby nie ujawniać, czy email istnieje
      setSuccess(true);
    } catch {
      // Ignorujemy błędy z bezpieczeństwa
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-500/10 p-4">
          <p className="text-sm text-green-600 dark:text-green-400">
            Jeśli konto z podanym adresem email istnieje, wysłaliśmy link do resetowania hasła.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onBackToLogin}>
          Wróć do logowania
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="twoj@email.com"
          {...register("email")}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        <p className="text-xs text-muted-foreground">Wyślemy Ci link do resetowania hasła, jeśli konto istnieje</p>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={isSubmitting}
        >
          Wróć do logowania
        </button>
      </div>
    </form>
  );
}
