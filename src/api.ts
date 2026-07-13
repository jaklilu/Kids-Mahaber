import type { KidsData, TrackerData, Vote } from "./types";

const ADMIN_KEY = "kids-mahaber-admin";

export function getAdminPassword(): string | null {
  return sessionStorage.getItem(ADMIN_KEY);
}

export function setAdminPassword(password: string) {
  sessionStorage.setItem(ADMIN_KEY, password);
}

export function clearAdminPassword() {
  sessionStorage.removeItem(ADMIN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  admin = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (admin) {
    const pw = getAdminPassword();
    if (pw) headers.set("x-admin-password", pw);
  }

  const res = await fetch(`/api/${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export const api = {
  getTracker: () => request<TrackerData>("data"),
  saveTracker: (data: TrackerData) =>
    request<{ status: string }>("data", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  host: (memberIndex: number, date: string) =>
    request<{ status: string; data: TrackerData }>("host", {
      method: "POST",
      body: JSON.stringify({ memberIndex, date }),
    }),
  pass: (currentIndex: number) =>
    request<{ status: string; data: TrackerData }>("pass", {
      method: "POST",
      body: JSON.stringify({ currentIndex }),
    }),
  resetMember: (index: number) =>
    request<{ status: string; data: TrackerData }>(
      "reset",
      { method: "POST", body: JSON.stringify({ index }) },
      true,
    ),
  resetAll: () =>
    request<{ status: string }>("reset-all", { method: "POST" }, true),
  clearHistory: () =>
    request<{ status: string; data: TrackerData }>(
      "clear-history",
      { method: "POST" },
      true,
    ),
  updateHostDate: (index: number, date: string) =>
    request<{ status: string; data: TrackerData }>(
      "update-host-date",
      { method: "POST", body: JSON.stringify({ index, date }) },
      true,
    ),
  generateSchedule: () =>
    request<{ status: string; data: TrackerData }>(
      "generate-schedule",
      { method: "POST" },
      true,
    ),
  voteProposal: (name: string, vote: Vote) =>
    request<{ status: string; data: TrackerData }>("proposal-vote", {
      method: "POST",
      body: JSON.stringify({ name, vote }),
    }),
  shiftProposedDate: (name: string, weeks: 1 | -1) =>
    request<{ status: string; data: TrackerData }>("shift-proposed-date", {
      method: "POST",
      body: JSON.stringify({ name, weeks }),
    }),
  getKids: () => request<KidsData>("kids"),
  voteKid: (name: string, vote: Vote) =>
    request<{ success: boolean }>("kids/vote", {
      method: "POST",
      body: JSON.stringify({ name, vote }),
    }),
  adminLogin: (password: string) =>
    request<{ status: string }>("admin-login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};
