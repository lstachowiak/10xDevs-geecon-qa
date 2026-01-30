import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Trash2, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SessionViewModel } from "@/types";

interface SessionsTableProps {
  sessions: SessionViewModel[];
  onDelete: (sessionId: string) => void;
  onCopy: (slug: string) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
}

export default function SessionsTable({
  sessions,
  onDelete,
  onCopy,
  onSortChange,
  currentSortBy = "sessionDate",
  currentSortOrder = "desc",
}: SessionsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      setDeletingId(sessionToDelete);
      onDelete(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      // Reset deleting state after a delay (will be handled by parent component refresh)
      setTimeout(() => setDeletingId(null), 2000);
    }
  };

  const handleSort = (field: string) => {
    if (!onSortChange) return;

    // Toggle sort order if clicking the same field, otherwise default to desc
    const newSortOrder = currentSortBy === field ? (currentSortOrder === "asc" ? "desc" : "asc") : "desc";

    onSortChange(field, newSortOrder);
  };

  const getSortIcon = (field: string) => {
    if (currentSortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    return currentSortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-8 -ml-3 flex items-center font-semibold"
                >
                  Name
                  {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead className="min-w-[120px]">Speaker</TableHead>
              <TableHead className="min-w-[140px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("sessionDate")}
                  className="h-8 -ml-3 flex items-center font-semibold"
                >
                  Session Date
                  {getSortIcon("sessionDate")}
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">Slug</TableHead>
              <TableHead className="text-right min-w-[100px]">Questions</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const isDeleting = deletingId === session.id;
              return (
                <TableRow key={session.id} className={isDeleting ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{session.speaker}</TableCell>
                  <TableCell>{formatDate(session.sessionDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{session.uniqueUrlSlug}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onCopy(session.uniqueUrlSlug)}
                        aria-label="Copy slug to clipboard"
                        disabled={isDeleting}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{session.questionCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Manage questions">
                        <a href={`/session/${session.uniqueUrlSlug}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(session.id)}
                        aria-label="Delete session"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session and all associated questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
