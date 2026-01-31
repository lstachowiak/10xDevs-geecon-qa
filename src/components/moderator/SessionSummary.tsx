import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import type { SessionDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SessionSummaryProps {
  session: SessionDTO;
}

/**
 * SessionSummary - Displays summary of a newly created session
 *
 * Shows session details and provides a button to copy the session URL
 * to the clipboard.
 */
export default function SessionSummary({ session }: SessionSummaryProps) {
  const [copied, setCopied] = useState(false);

  // Construct the full session URL
  const sessionUrl = `${window.location.origin}/session/${session.uniqueUrlSlug}`;

  /**
   * Copy session URL to clipboard
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);

      toast.success("Link copied!", {
        description: "Session URL has been copied to clipboard",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy link", {
        description: "Please try selecting and copying the URL manually",
      });
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-600 mb-2">✓ Session Created Successfully!</h1>
        <p className="text-gray-600">Your Q&A session has been created and is ready to use.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>Share this link with attendees to collect questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Session Name</p>
              <p className="text-lg font-semibold">{session.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Speaker</p>
              <p className="text-lg">{session.speaker}</p>
            </div>

            {session.sessionDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">Session Date</p>
                <p className="text-lg">{formatDate(session.sessionDate)}</p>
              </div>
            )}

            {session.description && (
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-lg">{session.description}</p>
              </div>
            )}
          </div>

          {/* Session URL */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-500 mb-2">Session URL</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={sessionUrl}
                readOnly
                className="flex-1 font-mono text-sm bg-gray-50"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button onClick={handleCopyLink} variant={copied ? "outline" : "default"} className="sm:w-auto">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button asChild className="flex-1">
              <a href={`/session/${session.uniqueUrlSlug}`}>View Session</a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/moderator/sessions">Back to Sessions</a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/moderator/sessions/new">Create Another</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
