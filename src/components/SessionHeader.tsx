import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthActions } from "./AuthActions";

interface SessionViewModel {
  name: string;
  speaker: string;
}

interface SessionHeaderProps {
  session: SessionViewModel | null;
  isAuthenticated?: boolean;
}

export function SessionHeader({ session, isAuthenticated = false }: SessionHeaderProps) {
  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>{session.name}</CardTitle>
            <CardDescription>Prowadzący: {session.speaker}</CardDescription>
          </div>
          <AuthActions isAuthenticated={isAuthenticated} />
        </div>
      </CardHeader>
    </Card>
  );
}
