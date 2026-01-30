import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Brak pytań
          </p>
          <p className="text-sm text-muted-foreground">
            Bądź pierwszy i zadaj pytanie!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
