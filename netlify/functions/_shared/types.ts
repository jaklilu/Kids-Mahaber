export type Vote = "yes" | "no" | null;

export interface Member {
  name: string;
  photo: string;
  status: "" | "Hosting" | "Passed";
  isCurrent: boolean;
  hostingDate: string;
  proposedDate?: string;
  vote: Vote;
}

export interface HistoryEntry {
  name: string;
  date: string;
  round?: number;
}

export interface ScheduleProposalResponse {
  firstName: string;
  vote: "yes" | "no";
}

export interface ScheduleProposal {
  title: string;
  summary: string;
  createdAt: string;
  deadlineAt: string;
  adopted: boolean;
  threshold: number;
  responses: ScheduleProposalResponse[];
}

export interface TrackerData {
  members: Member[];
  history: HistoryEntry[];
  passStartIndex: number | null;
  currentRoundPassers: number[];
  hostConfirmed: boolean;
  lastHostIndex: number;
  scheduleProposal?: ScheduleProposal | null;
}

export interface Kid {
  name: string;
  photo: string;
  vote: Vote;
}

export interface KidsData {
  kids: Kid[];
}
