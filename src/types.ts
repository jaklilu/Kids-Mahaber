export type Vote = "yes" | "no" | null;

export interface Member {
  name: string;
  photo: string;
  status: "" | "Hosting" | "Passed";
  isCurrent: boolean;
  hostingDate: string;
  proposedDate?: string;
  /** Host confirmed their proposed date */
  dateConfirmed?: boolean;
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
  /** Temporary process votes from kids — remove after voting ends */
  kidsResponses: ScheduleProposalResponse[];
}

export interface TrackerData {
  members: Member[];
  history: HistoryEntry[];
  passStartIndex: number | null;
  currentRoundPassers: number[];
  hostConfirmed: boolean;
  lastHostIndex: number;
  scheduleProposal?: ScheduleProposal | null;
  /** Monotonic-ish write stamp (ms) so clients can ignore stale polls */
  updatedAt?: number;
}

export interface Kid {
  name: string;
  photo: string;
  vote: Vote;
}

export interface KidsData {
  kids: Kid[];
  updatedAt?: number;
}

export type TabId = "tracker" | "admin" | "kids";
