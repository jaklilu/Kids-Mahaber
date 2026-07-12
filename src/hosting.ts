import type { HistoryEntry, Member } from "./types";
import { formatDate } from "./utils";

/** Most recent hosted date for a member (current host date or latest history). */
export function getLastHostedDate(
  member: Member,
  history: HistoryEntry[] = [],
): string | null {
  if (member.status === "Hosting" && member.hostingDate) {
    return member.hostingDate;
  }

  const entry = history.find((h) => h.name === member.name);
  return entry?.date ?? null;
}

export function displayHostedDate(date: string | null): string {
  if (!date) return "—";
  return date.includes("-") ? formatDate(date) : date;
}
