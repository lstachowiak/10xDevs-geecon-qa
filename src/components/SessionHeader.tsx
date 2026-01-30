import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SessionViewModel {
  name: string;
  speaker: string;
}

interface SessionHeaderProps {
  session: SessionViewModel | null;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{session.name}</CardTitle>
        <CardDescription>Prowadzący: {session.speaker}</CardDescription>
      </CardHeader>
    </Card>
  );
}
