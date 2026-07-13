export type Vote = "yes" | "no" | null;

export interface Member {
  name: string;
  photo: string;
  status: "" | "Hosting" | "Passed";
  isCurrent: boolean;
  hostingDate: string;
  /** Planned date from the quarterly second-Saturday proposal */
  proposedDate?: string;
  vote: Vote;
}

export interface HistoryEntry {
  name: string;
  date: string;
  round?: number;
}

export interface ScheduleProposalVote {
  name: string;
  photo: string;
  vote: Vote;
}

export interface ScheduleProposal {
  title: string;
  summary: string;
  createdAt: string;
  adopted: boolean;
  /** Fraction required to adopt (more than this wins). Default 0.7 */
  threshold: number;
  votes: ScheduleProposalVote[];
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

export type TabId = "tracker" | "admin" | "kids";
