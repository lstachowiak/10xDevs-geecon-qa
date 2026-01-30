import { SessionHeader } from "./SessionHeader";
import { QuestionForm } from "./QuestionForm";
import { QuestionList } from "./QuestionList";
import { useSessionData } from "./hooks/useSessionData";
import { Toaster } from "@/components/ui/sonner";
import type { CreateQuestionCommand } from "@/types";

interface SessionViewProps {
  slug: string;
}

export function SessionView({ slug }: SessionViewProps) {
  const { session, questions, isLoading, error, addQuestion, upvoteQuestion } =
    useSessionData(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-destructive">
          Wystąpił błąd: {error.message}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">
          Nie znaleziono sesji
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="container mx-auto py-8 space-y-8">
        <SessionHeader session={session} />
        <QuestionForm onSubmit={addQuestion} />
        <QuestionList questions={questions} onUpvote={upvoteQuestion} />
      </div>
    </>
  );
}
