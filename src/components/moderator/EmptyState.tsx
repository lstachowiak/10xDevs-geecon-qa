import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first session to start collecting questions from your audience
            </p>
          </div>
          <Button asChild>
            <a href="/moderator/sessions/new">Create New Session</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
