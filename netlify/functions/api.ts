import type { Handler, HandlerEvent } from "@netlify/functions";
import { sendHostEmail } from "./_shared/email";
import {
  applyProposedSchedule,
  isProposalVotingOpen,
  PROPOSAL_DEADLINE_LABEL,
  proposalStats,
  shiftIsoDateByWeeks,
} from "./_shared/schedule";
import { getKids, getStorageMode, getTracker, saveKids, saveTracker, connectBlobs } from "./_shared/store";
import type { TrackerData, ScheduleProposalResponse } from "./_shared/types";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...cors },
    body: JSON.stringify(body),
  };
}

function requireAdmin(event: HandlerEvent) {
  const expected = process.env.ADMIN_PASSWORD || "change-me";
  const provided = event.headers["x-admin-password"];
  return provided === expected;
}

function parseBody<T>(event: HandlerEvent): T {
  try {
    return JSON.parse(event.body || "{}") as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function isDatePassed(dateStr: string): boolean {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date <= today;
}

function hostIsLocked(data: TrackerData): boolean {
  const host = data.members.find((m) => m.status === "Hosting");
  if (!host?.hostingDate) return false;
  return !isDatePassed(host.hostingDate);
}

function mergeNamedVotes(
  a: ScheduleProposalResponse[] | undefined,
  b: ScheduleProposalResponse[] | undefined,
): ScheduleProposalResponse[] {
  const map = new Map<string, ScheduleProposalResponse>();
  for (const entry of [...(a ?? []), ...(b ?? [])]) {
    const key = entry.firstName.trim().toLowerCase();
    if (!key) continue;
    map.set(key, entry);
  }
  return [...map.values()];
}

/** Keep process votes when a client POSTs a stale full tracker snapshot. */
function mergeTrackerOnClientSave(
  incoming: TrackerData,
  oldData: TrackerData,
): TrackerData {
  const oldProposal = oldData.scheduleProposal;
  const nextProposal = incoming.scheduleProposal;
  if (!oldProposal && !nextProposal) return incoming;

  return {
    ...incoming,
    scheduleProposal: {
      title: nextProposal?.title ?? oldProposal?.title ?? "",
      summary: nextProposal?.summary ?? oldProposal?.summary ?? "",
      createdAt: nextProposal?.createdAt ?? oldProposal?.createdAt ?? "",
      deadlineAt: nextProposal?.deadlineAt ?? oldProposal?.deadlineAt ?? "",
      adopted: Boolean(nextProposal?.adopted || oldProposal?.adopted),
      threshold: nextProposal?.threshold ?? oldProposal?.threshold ?? 0.7,
      responses: mergeNamedVotes(
        oldProposal?.responses,
        nextProposal?.responses,
      ),
      kidsResponses: mergeNamedVotes(
        oldProposal?.kidsResponses,
        nextProposal?.kidsResponses,
      ),
    },
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  // Wire Blobs credentials for Functions v1 Lambda compatibility mode.
  connectBlobs(event);

  const rawPath = event.path || "";
  const parts = rawPath
    .replace(/^\/\.netlify\/functions\/api\/?/, "")
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);

  const route = parts[0] === "api" ? parts.slice(1) : parts;

  try {
    const action = route[0];

    if (action === "data" && event.httpMethod === "GET") {
      return json(200, await getTracker());
    }

    if (action === "data" && event.httpMethod === "POST") {
      const incoming = parseBody<TrackerData>(event);
      const oldData = await getTracker();
      const oldHost = oldData.members.find((m) => m.status === "Hosting");
      const merged = mergeTrackerOnClientSave(incoming, oldData);
      const newHost = merged.members.find((m) => m.status === "Hosting");

      await saveTracker(merged);

      if (
        newHost &&
        (!oldHost || oldHost.name !== newHost.name) &&
        newHost.hostingDate
      ) {
        await sendHostEmail(newHost.name, newHost.hostingDate);
      }

      return json(200, { status: "success" });
    }

    if (action === "host" && event.httpMethod === "POST") {
      const { memberIndex, date } = parseBody<{
        memberIndex: number;
        date: string;
      }>(event);

      if (!date) return json(400, { error: "Date required" });
      const [y, m, d] = date.split("-").map(Number);
      const selected = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        return json(400, { error: "Date must be today or in the future" });
      }

      const data = await getTracker();
      if (memberIndex < 0 || memberIndex >= data.members.length) {
        return json(400, { error: "Invalid member" });
      }

      const hosted = data.members.splice(memberIndex, 1)[0];
      hosted.status = "Hosting";
      hosted.hostingDate = date;
      hosted.isCurrent = true;
      hosted.vote = null;

      data.members.forEach((m) => {
        m.isCurrent = false;
        m.vote = null;
      });
      data.members.unshift(hosted);
      data.history.unshift({ name: hosted.name, date });
      data.passStartIndex = null;
      data.currentRoundPassers = [];
      data.hostConfirmed = true;
      data.lastHostIndex = 0;

      await saveTracker(data);
      await sendHostEmail(hosted.name, date);
      return json(200, { status: "success", data });
    }

    if (action === "update-host-date" && event.httpMethod === "POST") {
      if (!requireAdmin(event)) return json(401, { error: "Unauthorized" });
      const { index, date } = parseBody<{ index: number; date: string }>(event);

      if (!date) return json(400, { error: "Date required" });
      const [y, m, d] = date.split("-").map(Number);
      const selected = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(selected.getTime())) {
        return json(400, { error: "Invalid date format" });
      }
      if (selected < today) {
        return json(400, { error: "Date must be today or in the future" });
      }

      const data = await getTracker();
      if (index < 0 || index >= data.members.length) {
        return json(400, { error: "Invalid member" });
      }

      const member = data.members[index];
      if (member.status !== "Hosting") {
        return json(400, { error: "Member is not currently hosting" });
      }

      const oldDate = member.hostingDate;
      member.hostingDate = date;

      // Keep history in sync with the new gathering date
      const historyEntry = data.history.find(
        (h) => h.name === member.name && (!oldDate || h.date === oldDate),
      );
      if (historyEntry) {
        historyEntry.date = date;
      } else {
        data.history.unshift({ name: member.name, date });
      }

      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "pass" && event.httpMethod === "POST") {
      const { currentIndex } = parseBody<{ currentIndex: number }>(event);
      const data = await getTracker();

      if (hostIsLocked(data)) {
        return json(400, { error: "Hosting is locked until the gathering date" });
      }

      if (currentIndex < 0 || currentIndex >= data.members.length) {
        return json(400, { error: "Invalid index" });
      }

      const current = data.members[currentIndex];
      current.status = "Passed";
      current.isCurrent = false;

      if (data.passStartIndex === null) {
        data.passStartIndex = currentIndex;
        data.currentRoundPassers = [];
      }
      data.currentRoundPassers.push(currentIndex);

      let nextIndex = (currentIndex + 1) % data.members.length;
      let loops = 0;
      while (loops < data.members.length) {
        const member = data.members[nextIndex];
        const skipped = data.currentRoundPassers.includes(nextIndex);
        const blocked =
          member.status === "Hosting" && !isDatePassed(member.hostingDate);
        if (!skipped && !blocked) break;
        nextIndex = (nextIndex + 1) % data.members.length;
        loops += 1;
      }

      data.members.forEach((m) => {
        m.isCurrent = false;
      });
      data.members[nextIndex].isCurrent = true;

      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "reset" && event.httpMethod === "POST") {
      if (!requireAdmin(event)) return json(401, { error: "Unauthorized" });
      const { index } = parseBody<{ index: number }>(event);
      const data = await getTracker();
      if (index < 0 || index >= data.members.length) {
        return json(400, { error: "Invalid index" });
      }
      const name = data.members[index].name;
      data.members[index].status = "";
      data.members[index].hostingDate = "";
      data.members[index].isCurrent = false;
      data.members[index].vote = null;
      // Remove hosted dates for this member so the Date hosted column clears
      data.history = data.history.filter((h) => h.name !== name);

      if (!data.members.some((m) => m.isCurrent)) {
        const pending = data.members.find((m) => m.status === "");
        if (pending) pending.isCurrent = true;
      }

      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "reset-all" && event.httpMethod === "POST") {
      if (!requireAdmin(event)) return json(401, { error: "Unauthorized" });
      const data = await getTracker();
      data.members.forEach((m, i) => {
        m.status = "";
        m.hostingDate = "";
        m.isCurrent = i === 0;
        m.vote = null;
      });
      data.passStartIndex = null;
      data.currentRoundPassers = [];
      data.hostConfirmed = false;
      data.lastHostIndex = -1;
      await saveTracker(data);

      const kids = await getKids();
      kids.kids.forEach((k) => {
        k.vote = null;
      });
      await saveKids(kids);

      return json(200, { status: "success" });
    }

    if (action === "clear-history" && event.httpMethod === "POST") {
      if (!requireAdmin(event)) return json(401, { error: "Unauthorized" });
      const data = await getTracker();
      data.history = [];
      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "generate-schedule" && event.httpMethod === "POST") {
      if (!requireAdmin(event)) return json(401, { error: "Unauthorized" });
      const current = await getTracker();
      const next = applyProposedSchedule(current, new Date(), false);
      await saveTracker(next);
      return json(200, { status: "success", data: next });
    }

    if (action === "shift-proposed-date" && event.httpMethod === "POST") {
      const { name, weeks } = parseBody<{ name: string; weeks: number }>(event);
      if (!name || (weeks !== 1 && weeks !== -1)) {
        return json(400, { error: "name and weeks (+1 or -1) required" });
      }

      const data = await getTracker();
      const member = data.members.find((m) => m.name === name);
      if (!member) return json(404, { error: "Member not found" });
      if (!member.proposedDate) {
        return json(400, { error: "No proposed date to adjust" });
      }

      member.proposedDate = shiftIsoDateByWeeks(member.proposedDate, weeks);
      member.dateConfirmed = false;
      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "confirm-proposed-date" && event.httpMethod === "POST") {
      const { name } = parseBody<{ name: string }>(event);
      if (!name) return json(400, { error: "name required" });

      const data = await getTracker();
      const member = data.members.find((m) => m.name === name);
      if (!member) return json(404, { error: "Member not found" });
      if (!member.proposedDate) {
        return json(400, { error: "No proposed date to confirm" });
      }

      member.dateConfirmed = true;
      await saveTracker(data);
      return json(200, { status: "success", data });
    }

    if (action === "proposal-vote" && event.httpMethod === "POST") {
      const { firstName, vote, audience } = parseBody<{
        firstName: string;
        vote: "yes" | "no";
        audience?: "adults" | "kids";
      }>(event);
      const normalized = (firstName || "").trim();
      const group = audience === "kids" ? "kids" : "adults";
      if (!normalized || (vote !== "yes" && vote !== "no")) {
        return json(400, { error: "firstName and vote required" });
      }

      const data = await getTracker();
      if (!data.scheduleProposal) {
        Object.assign(data, applyProposedSchedule(data, new Date(), true));
      }
      if (!data.scheduleProposal) {
        return json(500, { error: "Proposal not initialized" });
      }

      if (!isProposalVotingOpen(data.scheduleProposal)) {
        return json(400, {
          error: `Voting closed after ${PROPOSAL_DEADLINE_LABEL}`,
        });
      }

      if (group === "kids") {
        const kidsResponses = data.scheduleProposal.kidsResponses ?? [];
        const key = normalized.toLowerCase();
        if (kidsResponses.some((r) => r.firstName.toLowerCase() === key)) {
          return json(400, { error: "That name already voted" });
        }
        kidsResponses.push({ firstName: normalized, vote });
        data.scheduleProposal.kidsResponses = kidsResponses;
      } else {
        const responses = data.scheduleProposal.responses ?? [];
        const key = normalized.toLowerCase();
        if (responses.some((r) => r.firstName.toLowerCase() === key)) {
          return json(400, { error: "That name already voted" });
        }
        responses.push({ firstName: normalized, vote });
        data.scheduleProposal.responses = responses;

        const stats = proposalStats(
          data.scheduleProposal,
          data.members.length,
          "adults",
        );
        data.scheduleProposal.adopted = stats.adopted;
      }

      await saveTracker(data);
      return json(200, {
        status: "success",
        data,
      });
    }

    if (action === "kids" && event.httpMethod === "GET") {
      return json(200, await getKids());
    }

    if (action === "kids" && route[1] === "vote" && event.httpMethod === "POST") {
      const { name, vote } = parseBody<{ name: string; vote: "yes" | "no" }>(
        event,
      );
      const kids = await getKids();
      const kid = kids.kids.find((k) => k.name === name);
      if (!kid) return json(404, { error: "Kid not found" });
      kid.vote = vote;
      await saveKids(kids);
      return json(200, { success: true });
    }

    if (action === "admin-login" && event.httpMethod === "POST") {
      const { password } = parseBody<{ password: string }>(event);
      const expected = process.env.ADMIN_PASSWORD || "change-me";
      if (password !== expected) {
        return json(401, { error: "Incorrect password" });
      }
      return json(200, { status: "success" });
    }

    if (action === "health" && event.httpMethod === "GET") {
      return json(200, {
        status: "ok",
        service: "Kids Mahaber API",
        storage: getStorageMode(),
      });
    }

    return json(404, { error: "Not found", route });
  } catch (err) {
    console.error(err);
    return json(500, {
      error: err instanceof Error ? err.message : "Server error",
    });
  }
};
