import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { CreateQuestionCommand } from "@/types";

interface QuestionFormProps {
  onSubmit: (command: CreateQuestionCommand) => Promise<void>;
}

export function QuestionForm({ onSubmit }: QuestionFormProps) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Treść pytania jest wymagana");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        content: content.trim(),
        authorName: authorName.trim() || undefined,
      });
      setContent("");
      setAuthorName("");
      toast.success("Pytanie zostało dodane!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się dodać pytania";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zadaj pytanie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Wpisz swoje pytanie..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[100px]"
              aria-label="Treść pytania"
              data-testid="question-content-input"
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Twoje imię (opcjonalne)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={isSubmitting}
              aria-label="Imię autora"
              data-testid="question-author-input"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} data-testid="question-submit-button">
            {isSubmitting ? "Wysyłanie..." : "Wyślij pytanie"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
