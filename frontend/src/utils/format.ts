import { formatDistanceToNow, parseISO } from "date-fns";

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  }

  return `${secs}s`;
}

export function formatRelativeDate(date: string) {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function truncate(text: string | undefined | null, length: number) {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
