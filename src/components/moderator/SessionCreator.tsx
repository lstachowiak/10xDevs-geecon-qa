import { useState } from "react";
import { toast } from "sonner";
import type { SessionDTO, CreateSessionCommand, ErrorResponseDTO } from "@/types";
import SessionForm from "@/components/moderator/SessionForm";
import SessionSummary from "@/components/moderator/SessionSummary";

/**
 * SessionCreator - Main container component for creating new sessions
 *
 * Manages the state for the entire session creation process.
 * Renders either SessionForm or SessionSummary depending on whether
 * a session has been created.
 */
export default function SessionCreator() {
  const [createdSession, setCreatedSession] = useState<SessionDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission to create a new session
   */
  const handleCreateSession = async (data: CreateSessionCommand) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          toast.error("Authentication required", {
            description: "Please log in to create a session",
          });
          throw new Error("Unauthorized");
        }

        if (response.status === 400 && errorData.details) {
          // Show validation errors in toast
          const errorMessages = Object.values(errorData.details).join(", ");
          toast.error("Validation failed", {
            description: errorMessages,
          });
        } else {
          toast.error("Failed to create session", {
            description: errorData.error || "An unexpected error occurred",
          });
        }

        throw new Error(errorData.error || "Failed to create session");
      }

      const session: SessionDTO = await response.json();

      // Show success toast
      toast.success("Session created successfully!", {
        description: `${session.name} is ready for questions`,
      });

      setCreatedSession(session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);

      // Only show generic toast if we didn't already show a specific one
      if (err instanceof Error && err.message === "An unexpected error occurred") {
        toast.error("Something went wrong", {
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show summary if session was created
  if (createdSession) {
    return <SessionSummary session={createdSession} />;
  }

  // Show form if session hasn't been created yet
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Session</h1>
        <p className="text-gray-600">Set up a new Q&A session for collecting questions from attendees</p>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <SessionForm onSubmit={handleCreateSession} isSubmitting={isSubmitting} />
    </div>
  );
}
