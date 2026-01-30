import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import SessionsTable from "./SessionsTable.tsx";
import EmptyState from "./EmptyState.tsx";
import Pagination from "./Pagination.tsx";
import { toast } from "sonner";
import type { SessionViewModel, SessionListResponseDTO, PaginationDTO } from "@/types";

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export default function SessionsList() {
  const [sessions, setSessions] = useState<SessionViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 20,
    sortBy: "sessionDate",
    sortOrder: "desc",
  });

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: queryParams.page.toString(),
        limit: queryParams.limit.toString(),
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });

      const response = await fetch(`/api/sessions?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data: SessionListResponseDTO = await response.json();
      setSessions(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions on mount and when query params change
  useEffect(() => {
    fetchSessions();
  }, [queryParams]);

  // Handle session deletion
  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Session deleted successfully");
      // Refresh the list after deletion
      fetchSessions();
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  // Handle slug copy to clipboard
  const handleCopy = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(slug);
      toast.success("Slug copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy slug");
    }
  };

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    setQueryParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder,
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page,
    }));
  };

  // Handle create new session navigation
  const handleCreateSession = () => {
    window.location.href = "/moderator/sessions/new";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={fetchSessions}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your Q&A sessions and questions</p>
        </div>
        <Button onClick={handleCreateSession}>Create New Session</Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SessionsTable
            sessions={sessions}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onSortChange={handleSortChange}
            currentSortBy={queryParams.sortBy}
            currentSortOrder={queryParams.sortOrder}
          />
          {pagination && <Pagination pagination={pagination} onPageChange={handlePageChange} />}
        </>
      )}
    </div>
  );
}
