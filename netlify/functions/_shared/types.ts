export type Vote = "yes" | "no" | null;

export interface Member {
  name: string;
  photo: string;
  status: "" | "Hosting" | "Passed";
  isCurrent: boolean;
  hostingDate: string;
  vote: Vote;
}

export interface HistoryEntry {
  name: string;
  date: string;
  round?: number;
}

export interface TrackerData {
  members: Member[];
  history: HistoryEntry[];
  passStartIndex: number | null;
  currentRoundPassers: number[];
  hostConfirmed: boolean;
  lastHostIndex: number;
}

export interface Kid {
  name: string;
  photo: string;
  vote: Vote;
}

export interface KidsData {
  kids: Kid[];
}
