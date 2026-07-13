import type {
  Member,
  ScheduleProposal,
  ScheduleProposalResponse,
  TrackerData,
  Vote,
} from "./types";

export const PROPOSAL_TITLE = "Vote on the New Hosting Process";

/** Wednesday, July 15, 2026, 5:00 PM Pacific */
export const PROPOSAL_DEADLINE_AT = "2026-07-15T17:00:00-07:00";
export const PROPOSAL_DEADLINE_LABEL = "Wednesday, July 15, 2026 at 5:00 PM";

export const PROPOSAL_SUMMARY = [
  "We propose a new hosting schedule:",
  "Frea will host on Saturday, one month from now.",
  "After that, hosting will rotate to the next person every three months, always on the second Saturday, following the established order.",
  "Which means we will see each other every three months for sure.",
  "If the scheduled date does not work for a host, it may be moved one week earlier or one week later (−1 week or +1 week), as shown in the schedule table below.",
  "This vote is only to approve the hosting process. It is not a vote on any specific hosting date.",
  "If more than 70% of the family votes in favor, this will become our new hosting process.",
].join("\n\n");

export function isProposalVotingOpen(
  proposal: ScheduleProposal | null | undefined,
  now: Date = new Date(),
): boolean {
  const deadline = proposal?.deadlineAt || PROPOSAL_DEADLINE_AT;
  return now.getTime() <= new Date(deadline).getTime();
}

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

function migrateLegacyVotes(
  proposal: ScheduleProposal | null | undefined,
): ScheduleProposalResponse[] {
  if (!proposal) return [];
  if (proposal.responses?.length) return proposal.responses;
  const legacy = (proposal as { votes?: { name: string; vote: Vote }[] }).votes;
  if (!legacy) return [];
  return legacy
    .filter((v) => v.vote === "yes" || v.vote === "no")
    .map((v) => ({ firstName: v.name, vote: v.vote as "yes" | "no" }));
}

export function applyProposedSchedule(
  data: TrackerData,
  from: Date = new Date(),
  preserveResponses = false,
): TrackerData {
  const schedule = buildQuarterlySecondSaturdaySchedule(data.members, from);
  const byName = new Map(schedule.map((s) => [s.name, s.date]));

  const members = data.members.map((m) => ({
    ...m,
    proposedDate: byName.get(m.name) ?? "",
  }));

  const previous = preserveResponses
    ? migrateLegacyVotes(data.scheduleProposal)
    : [];
  const previousKids = preserveResponses
    ? (data.scheduleProposal?.kidsResponses ?? [])
    : [];

  const scheduleProposal: ScheduleProposal = {
    title: PROPOSAL_TITLE,
    summary: PROPOSAL_SUMMARY,
    createdAt: toIsoDate(from),
    deadlineAt: PROPOSAL_DEADLINE_AT,
    adopted: false,
    threshold: 0.7,
    responses: previous,
    kidsResponses: previousKids,
  };

  const stats = proposalStats(scheduleProposal, members.length);
  scheduleProposal.adopted = stats.adopted;

  return {
    ...data,
    members,
    scheduleProposal,
  };
}

export function ensureScheduleProposal(data: TrackerData): TrackerData {
  const missingDates = data.members.some((m) => !m.proposedDate);
  const missingProposal = !data.scheduleProposal;
  if (missingDates || missingProposal) {
    return applyProposedSchedule(data, new Date(), true);
  }

  let updated = data;
  const responses = migrateLegacyVotes(data.scheduleProposal);
  if (
    data.scheduleProposal &&
    (!data.scheduleProposal.responses ||
      data.scheduleProposal.responses.length !== responses.length ||
      !Array.isArray(data.scheduleProposal.kidsResponses))
  ) {
    updated = {
      ...data,
      scheduleProposal: {
        ...data.scheduleProposal,
        responses,
        kidsResponses: data.scheduleProposal.kidsResponses ?? [],
      },
    };
  }

  if (
    updated.scheduleProposal &&
    (updated.scheduleProposal.summary !== PROPOSAL_SUMMARY ||
      updated.scheduleProposal.title !== PROPOSAL_TITLE ||
      updated.scheduleProposal.deadlineAt !== PROPOSAL_DEADLINE_AT)
  ) {
    updated = {
      ...updated,
      scheduleProposal: {
        ...updated.scheduleProposal,
        summary: PROPOSAL_SUMMARY,
        title: PROPOSAL_TITLE,
        deadlineAt: PROPOSAL_DEADLINE_AT,
        kidsResponses: updated.scheduleProposal.kidsResponses ?? [],
      },
    };
  }

  return updated;
}

export function proposalStats(
  proposal: ScheduleProposal | null | undefined,
  familySize: number,
  audience: "adults" | "kids" = "adults",
) {
  const responses =
    audience === "kids"
      ? (proposal?.kidsResponses ?? [])
      : migrateLegacyVotes(proposal);
  const yes = responses.filter((r) => r.vote === "yes").length;
  const no = responses.filter((r) => r.vote === "no").length;
  const voted = yes + no;
  const threshold = proposal?.threshold ?? 0.7;
  const yesShare = familySize === 0 ? 0 : yes / familySize;
  const meetsThreshold = familySize > 0 && yesShare > threshold;
  const adopted =
    audience === "adults"
      ? Boolean(proposal?.adopted) || meetsThreshold
      : meetsThreshold;
  const needed = Math.floor(familySize * threshold) + 1;

  return {
    familySize,
    yes,
    no,
    voted,
    yesShare,
    adopted,
    needed,
    threshold,
    yesNames: responses.filter((r) => r.vote === "yes").map((r) => r.firstName),
    noNames: responses.filter((r) => r.vote === "no").map((r) => r.firstName),
  };
}

export function shiftIsoDateByWeeks(isoDate: string, weeks: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return toIsoDate(date);
}
