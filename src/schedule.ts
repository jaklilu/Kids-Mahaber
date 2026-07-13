import type { Member, ScheduleProposal, TrackerData, Vote } from "./types";

export function secondSaturdayOfMonth(year: number, monthIndex: number): Date {
  const first = new Date(year, monthIndex, 1);
  const day = first.getDay();
  const firstSaturday = day === 6 ? 1 : ((6 - day + 7) % 7) + 1;
  return new Date(year, monthIndex, firstSaturday + 7);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildQuarterlySecondSaturdaySchedule(
  members: Member[],
  from: Date = new Date(),
): { name: string; date: string }[] {
  const start = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  let year = start.getFullYear();
  let month = start.getMonth();

  return members.map((member) => {
    const date = secondSaturdayOfMonth(year, month);
    const entry = { name: member.name, date: toIsoDate(date) };
    month += 3;
    if (month > 11) {
      month -= 12;
      year += 1;
    }
    return entry;
  });
}

export function applyProposedSchedule(
  data: TrackerData,
  from: Date = new Date(),
  preserveVotes = false,
): TrackerData {
  const schedule = buildQuarterlySecondSaturdaySchedule(data.members, from);
  const byName = new Map(schedule.map((s) => [s.name, s.date]));
  const previousVotes = new Map(
    (data.scheduleProposal?.votes ?? []).map((v) => [v.name, v.vote]),
  );

  const members = data.members.map((m) => ({
    ...m,
    proposedDate: byName.get(m.name) ?? "",
  }));

  const votes = members.map((m) => ({
    name: m.name,
    photo: m.photo,
    vote: (preserveVotes ? previousVotes.get(m.name) ?? null : null) as Vote,
  }));

  const scheduleProposal: ScheduleProposal = {
    title: "Quarterly second-Saturday hosting",
    summary:
      "Frea hosts on the second Saturday one month from now; then every three months on the second Saturday for each person in order. If more than 70% vote Yes, this becomes our process.",
    createdAt: toIsoDate(from),
    adopted: false,
    threshold: 0.7,
    votes,
  };

  const yes = votes.filter((v) => v.vote === "yes").length;
  const total = votes.length;
  if (total > 0 && yes / total > scheduleProposal.threshold) {
    scheduleProposal.adopted = true;
  }

  return {
    ...data,
    members,
    scheduleProposal,
  };
}

export function proposalStats(proposal: ScheduleProposal | null | undefined) {
  const votes = proposal?.votes ?? [];
  const total = votes.length;
  const yes = votes.filter((v) => v.vote === "yes").length;
  const no = votes.filter((v) => v.vote === "no").length;
  const pending = votes.filter((v) => v.vote == null).length;
  const threshold = proposal?.threshold ?? 0.7;
  const yesShare = total === 0 ? 0 : yes / total;
  const adopted = Boolean(proposal?.adopted) || yesShare > threshold;
  const needed = Math.floor(total * threshold) + 1;

  return { total, yes, no, pending, yesShare, adopted, needed, threshold };
}

/** Shift an ISO date by whole weeks (e.g. -1 or +1). */
export function shiftIsoDateByWeeks(isoDate: string, weeks: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return toIsoDate(date);
}
