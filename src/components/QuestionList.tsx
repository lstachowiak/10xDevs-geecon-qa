import { QuestionItem } from "./QuestionItem";
import { EmptyState } from "./EmptyState";
import type { QuestionViewModel } from "./hooks/useSessionData";

interface QuestionListProps {
  questions: QuestionViewModel[];
  onUpvote: (questionId: string) => Promise<void>;
}

export function QuestionList({ questions, onUpvote }: QuestionListProps) {
  if (questions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pytania</h2>
        <span className="text-sm text-muted-foreground">
          {questions.length} {questions.length === 1 ? "pytanie" : "pytań"}
        </span>
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            onUpvote={onUpvote}
          />
        ))}
      </div>
    </div>
  );
}
