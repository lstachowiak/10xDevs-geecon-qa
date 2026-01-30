import { useState, useEffect, useCallback } from "react";
import type { SessionDTO, QuestionDTO, CreateQuestionCommand, QuestionsListResponseDTO } from "@/types";

export interface SessionViewModel {
  name: string;
  speaker: string;
}

export interface QuestionViewModel extends QuestionDTO {
  isUpvotedByUser: boolean;
}

interface UseSessionDataReturn {
  session: SessionViewModel | null;
  questions: QuestionViewModel[];
  isLoading: boolean;
  error: Error | null;
  addQuestion: (command: CreateQuestionCommand) => Promise<void>;
  upvoteQuestion: (questionId: string) => Promise<void>;
}

const REFRESH_INTERVAL = 5000; // 5 seconds
const UPVOTED_QUESTIONS_KEY = "upvotedQuestions";

function getUpvotedQuestions(): Set<string> {
  try {
    const stored = localStorage.getItem(UPVOTED_QUESTIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveUpvotedQuestions(upvoted: Set<string>): void {
  try {
    localStorage.setItem(UPVOTED_QUESTIONS_KEY, JSON.stringify(Array.from(upvoted)));
  } catch {
    // Ignore localStorage errors
  }
}

export function useSessionData(slug: string): UseSessionDataReturn {
  const [session, setSession] = useState<SessionViewModel | null>(null);
  const [questions, setQuestions] = useState<QuestionViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(getUpvotedQuestions());

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Sesja nie została znaleziona");
        }
        throw new Error("Nie udało się pobrać danych sesji");
      }

      const data: SessionDTO = await response.json();
      setSession({
        name: data.name,
        speaker: data.speaker,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nieznany błąd"));
    }
  }, [slug]);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${slug}/questions`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać pytań");
      }

      const data: QuestionsListResponseDTO = await response.json();
      const questionsWithUpvoteState: QuestionViewModel[] = data.data.map((q) => ({
        ...q,
        isUpvotedByUser: upvotedQuestions.has(q.id),
      }));

      // Sort by upvote count (descending) and then by creation date (newest first)
      const sortedQuestions = questionsWithUpvoteState.sort((a, b) => {
        if (a.upvoteCount !== b.upvoteCount) {
          return b.upvoteCount - a.upvoteCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setQuestions(sortedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  }, [slug, upvotedQuestions]);

  const addQuestion = useCallback(
    async (command: CreateQuestionCommand) => {
      const response = await fetch(`/api/sessions/${slug}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się dodać pytania");
      }

      // Refresh questions list after adding
      await fetchQuestions();
    },
    [slug, fetchQuestions]
  );

  const upvoteQuestion = useCallback(
    async (questionId: string): Promise<void> => {
      if (upvotedQuestions.has(questionId)) {
        return;
      }

      const response = await fetch(`/api/questions/${questionId}/upvote`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Nie udało się zagłosować na pytanie");
      }

      const newUpvoted = new Set(upvotedQuestions);
      newUpvoted.add(questionId);
      setUpvotedQuestions(newUpvoted);
      saveUpvotedQuestions(newUpvoted);

      // Refresh questions to get updated upvote count
      await fetchQuestions();
    },
    [upvotedQuestions, fetchQuestions]
  );

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchSession();
      await fetchQuestions();
      setIsLoading(false);
    };

    loadInitialData();
  }, [fetchSession, fetchQuestions]);

  // Periodic refresh of questions
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchQuestions();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchQuestions]);

  return {
    session,
    questions,
    isLoading,
    error,
    addQuestion,
    upvoteQuestion,
  };
}
