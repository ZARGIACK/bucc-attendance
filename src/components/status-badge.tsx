import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/lib/enums";

/** Color-coded attendance status: 🟢 Present | 🟡 Pending | 🔴 Left */
export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return (
        <Badge tone="green">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" aria-hidden /> Present
        </Badge>
      );
    case AttendanceStatus.PENDING_SIGNOUT:
      return (
        <Badge tone="yellow">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber-500" aria-hidden /> Pending Sign-Out
        </Badge>
      );
    case AttendanceStatus.LEFT:
      return (
        <Badge tone="red">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden /> Left
        </Badge>
      );
    case AttendanceStatus.LEFT_FORCED:
      return (
        <Badge tone="red">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-700" aria-hidden /> Left (Forced)
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
