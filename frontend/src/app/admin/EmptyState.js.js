import { Inbox } from "lucide-react";

export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="h-8 w-8 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
