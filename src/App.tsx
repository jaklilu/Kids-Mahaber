import { useCallback, useEffect, useState } from "react";
import {
  api,
  clearAdminPassword,
  getAdminPassword,
  setAdminPassword,
} from "./api";
import { AdminPanel } from "./components/AdminPanel";
import { KidsPanel } from "./components/KidsPanel";
import { Modal } from "./components/Modal";
import { TrackerPanel } from "./components/TrackerPanel";
import type { Kid, TabId, TrackerData, Vote } from "./types";
import { todayIso } from "./utils";

const emptyTracker: TrackerData = {
  members: [],
  history: [],
  passStartIndex: null,
  currentRoundPassers: [],
  hostConfirmed: false,
  lastHostIndex: -1,
};

export default function App() {
  const [tab, setTab] = useState<TabId>("tracker");
  const [data, setData] = useState<TrackerData>(emptyTracker);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminOk, setAdminOk] = useState(Boolean(getAdminPassword()));

  const [dateOpen, setDateOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [changeDateIndex, setChangeDateIndex] = useState<number | null>(null);
  const [pendingKidVote, setPendingKidVote] = useState<{
    name: string;
    vote: Vote;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tracker, kidsData] = await Promise.all([
        api.getTracker(),
        api.getKids(),
      ]);
      setData({
        ...emptyTracker,
        ...tracker,
        members: tracker.members ?? [],
        history: tracker.history ?? [],
        currentRoundPassers: tracker.currentRoundPassers ?? [],
      });
      setKids(kidsData.kids ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function selectTab(next: TabId) {
    if (next === "admin" && !adminOk) {
      setAdminOpen(true);
      return;
    }
    setTab(next);
  }

  async function handleAdminLogin(password?: string) {
    if (!password) return;
    try {
      await api.adminLogin(password);
      setAdminPassword(password);
      setAdminOk(true);
      setAdminOpen(false);
      setTab("admin");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function confirmHost(date?: string) {
    if (!date) return;
    const index = data.members.findIndex((m) => m.isCurrent);
    if (index < 0) return;
    try {
      const res = await api.host(index, date);
      setData(res.data);
      setDateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set host");
    }
  }

  async function confirmPass() {
    const index = data.members.findIndex((m) => m.isCurrent);
    if (index < 0) return;
    try {
      const res = await api.pass(index);
      setData(res.data);
      setPassOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not pass");
    }
  }

  async function castMemberVote(index: number, vote: Vote) {
    const next = structuredClone(data);
    next.members[index].vote = vote;
    setData(next);
    try {
      await api.saveTracker(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed");
      void refresh();
    }
  }

  async function castKidVote(name: string, vote: Vote) {
    setPendingKidVote({ name, vote });
  }

  async function confirmKidVote() {
    if (!pendingKidVote) return;
    const { name, vote } = pendingKidVote;
    setKids((prev) =>
      prev.map((k) => (k.name === name ? { ...k, vote } : k)),
    );
    setPendingKidVote(null);
    try {
      await api.voteKid(name, vote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kids vote failed");
      void refresh();
    }
  }

  async function moveMember(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const next = structuredClone(data);
    const temp = next.members[index];
    next.members[index] = next.members[newIndex];
    next.members[newIndex] = temp;
    setData(next);
    try {
      await api.saveTracker(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      void refresh();
    }
  }

  async function deleteHistory(index: number) {
    const next = structuredClone(data);
    next.history.splice(index, 1);
    setData(next);
    try {
      await api.saveTracker(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      void refresh();
    }
  }

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <h1>Kids Mahaber</h1>
        <p>Family hosting rotation, RSVP votes, and kids attendance — all in one place.</p>
      </header>

      <nav className="tabs" aria-label="Main">
        <button
          type="button"
          className={`tab ${tab === "tracker" ? "active" : ""}`}
          onClick={() => void selectTab("tracker")}
        >
          Tracker
        </button>
        <button
          type="button"
          className={`tab ${tab === "admin" ? "active" : ""}`}
          onClick={() => void selectTab("admin")}
        >
          Admin
        </button>
        <button
          type="button"
          className={`tab ${tab === "kids" ? "active" : ""}`}
          onClick={() => void selectTab("kids")}
        >
          Kids
        </button>
      </nav>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading gathering data…</div>
      ) : (
        <>
          {tab === "tracker" && (
            <TrackerPanel
              data={data}
              onHost={() => setDateOpen(true)}
              onPass={() => setPassOpen(true)}
              onVote={castMemberVote}
              onProposalVote={async (name, vote) => {
                const confirmed = window.confirm(
                  `Cast ${vote === "yes" ? "Yes" : "No"} as ${name} for the schedule proposal?`,
                );
                if (!confirmed) return;
                try {
                  const res = await api.voteProposal(name, vote);
                  setData(res.data);
                  setError(null);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Proposal vote failed",
                  );
                }
              }}
            />
          )}
          {tab === "admin" && adminOk && (
            <AdminPanel
              data={data}
              onResetAll={async () => {
                if (!window.confirm("Reset all members and kids votes?")) return;
                try {
                  await api.resetAll();
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Reset failed");
                }
              }}
              onClearHistory={async () => {
                if (!window.confirm("Clear all hosting history?")) return;
                try {
                  const res = await api.clearHistory();
                  setData(res.data);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Clear failed",
                  );
                }
              }}
              onResetMember={async (index) => {
                const name = data.members[index]?.name ?? "this member";
                if (
                  !window.confirm(
                    `Reset ${name}? This clears their status and hosted dates.`,
                  )
                ) {
                  return;
                }
                try {
                  const res = await api.resetMember(index);
                  setData(res.data);
                  setError(null);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Reset failed",
                  );
                }
              }}
              onMove={moveMember}
              onChangeHostDate={(index) => setChangeDateIndex(index)}
              onGenerateSchedule={async () => {
                if (
                  !window.confirm(
                    "Rebuild proposed second-Saturday dates and reset proposal votes?",
                  )
                ) {
                  return;
                }
                try {
                  const res = await api.generateSchedule();
                  setData(res.data);
                  setError(null);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Could not generate schedule",
                  );
                }
              }}
              onDeleteHistory={deleteHistory}
            />
          )}
          {tab === "kids" && (
            <KidsPanel kids={kids} onVote={castKidVote} />
          )}
        </>
      )}

      <Modal
        open={dateOpen}
        title="Select hosting date"
        message="Choose the gathering date."
        mode="date"
        minDate={todayIso()}
        confirmLabel="Confirm host"
        onCancel={() => setDateOpen(false)}
        onConfirm={confirmHost}
      />

      <Modal
        open={changeDateIndex !== null}
        title="Change hosting date"
        message={
          changeDateIndex !== null
            ? `Pick a new date for ${data.members[changeDateIndex]?.name ?? "this host"}.`
            : undefined
        }
        mode="date"
        minDate={todayIso()}
        initialDate={
          changeDateIndex !== null
            ? data.members[changeDateIndex]?.hostingDate || todayIso()
            : undefined
        }
        confirmLabel="Save date"
        onCancel={() => setChangeDateIndex(null)}
        onConfirm={async (date) => {
          if (!date || changeDateIndex === null) return;
          try {
            const res = await api.updateHostDate(changeDateIndex, date);
            setData(res.data);
            setChangeDateIndex(null);
            setError(null);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not update date",
            );
          }
        }}
      />

      <Modal
        open={passOpen}
        title="Pass this turn?"
        message="The next family member will become current."
        confirmLabel="Yes, pass"
        onCancel={() => setPassOpen(false)}
        onConfirm={() => void confirmPass()}
      />

      <Modal
        open={adminOpen}
        title="Admin access"
        message="Enter the admin password to manage members."
        mode="password"
        confirmLabel="Unlock"
        onCancel={() => {
          setAdminOpen(false);
          clearAdminPassword();
          setAdminOk(false);
        }}
        onConfirm={(password) => void handleAdminLogin(password)}
      />

      <Modal
        open={Boolean(pendingKidVote)}
        title="Confirm who you are"
        message={
          pendingKidVote
            ? `Are you ${pendingKidVote.name}?`
            : undefined
        }
        confirmLabel="Yes, that's me"
        onCancel={() => setPendingKidVote(null)}
        onConfirm={() => void confirmKidVote()}
      />
    </div>
  );
}
