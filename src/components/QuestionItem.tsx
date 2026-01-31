import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import type { QuestionViewModel } from "./hooks/useSessionData";

interface QuestionItemProps {
  question: QuestionViewModel;
  onUpvote: (questionId: string) => Promise<void>;
}

export function QuestionItem({ question, onUpvote }: QuestionItemProps) {
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async () => {
    if (!question.isUpvotedByUser && !isUpvoting) {
      setIsUpvoting(true);
      try {
        await onUpvote(question.id);
        toast.success("Zagłosowano na pytanie!");
      } catch (err) {
        toast.error("Nie udało się zagłosować");
      } finally {
        setIsUpvoting(false);
      }
    }
  };

  return (
    <Card 
      className={question.isAnswered ? "border-green-200 dark:border-green-800" : ""} 
      data-testid="question-item"
      data-question-id={question.id}
    >
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 min-w-[48px]">
            <Button
              variant={question.isUpvotedByUser ? "default" : "outline"}
              size="icon"
              onClick={handleUpvote}
              disabled={question.isUpvotedByUser || isUpvoting}
              aria-label="Głosuj na pytanie"
              className="transition-all hover:scale-110"
              data-testid="question-upvote-button"
            >
              <ArrowBigUp className={`h-4 w-4 ${isUpvoting ? "animate-pulse" : ""}`} />
            </Button>
            <span className="text-sm font-medium tabular-nums" data-testid="question-upvote-count">{question.upvoteCount}</span>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-base leading-relaxed">{question.content}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{question.authorName || "Anonim"}</span>
              {question.isAnswered && (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
                  Odpowiedziano
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
