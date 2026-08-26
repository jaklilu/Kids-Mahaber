import type { Member, TrackerData, Vote } from "../types";
import { formatDate, isDatePassed } from "../utils";
import { MemberRow } from "./MemberRow";
import { ScheduleProposalPanel } from "./ScheduleProposalPanel";

type Props = {
  data: TrackerData;
  onHost: () => void;
  onPass: () => void;
  onVote: (index: number, vote: Vote) => void;
  onCastProposalVote: (vote: "yes" | "no") => void;
  onShiftProposedDate: (name: string, weeks: 1 | -1) => void;
  onConfirmProposedDate: (name: string) => void;
};

function canInteract(data: TrackerData | null | undefined, current: Member | undefined): boolean {
  if (!data || !current) return false;
  const host = data.members?.find((m) => m.status === "Hosting");
  if (host?.hostingDate && !isDatePassed(host.hostingDate)) return false;
  return true;
}

export function TrackerPanel({
  data,
  onHost,
  onPass,
  onVote,
  onCastProposalVote,
  onShiftProposedDate,
  onConfirmProposedDate,
}: Props) {
  const members = data?.members ?? [];
  const current = members.find((m) => m.isCurrent);
  const currentIndex = members.findIndex((m) => m.isCurrent);
  const interactive = canInteract(data, current);
  const hostConfirmed = members.some((m) => m.status === "Hosting");
  /** Temporarily hidden while the family votes on the hosting process. */
  const showCurrentTurn = false;

  return (
    <div className="panel">
      {showCurrentTurn ? (
        <div className="card current-turn">
          {current ? (
            <>
              <div className="person">
                <img
                  className="avatar lg"
                  src={current.photo}
                  alt={current.name}
                  onError={(e) => {
                    e.currentTarget.src = "/kids/placeholder.jpg";
                  }}
                />
                <div>
                  <span className="badge">Current turn</span>
                  <h2 className="person-name">{current.name}</h2>
                  {current.status === "Hosting" && current.hostingDate ? (
                    <p className="status-line">
                      Hosting on {formatDate(current.hostingDate)}
                    </p>
                  ) : current.proposedDate ? (
                    <p className="status-line">
                      Proposed: {formatDate(current.proposedDate)}
                    </p>
                  ) : (
                    <p className="status-line">Ready to host or pass</p>
                  )}
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-host"
                  disabled={!interactive}
                  onClick={onHost}
                >
                  I Will Host
                </button>
                <button
                  type="button"
                  className="btn btn-pass"
                  disabled={!interactive || currentIndex < 0}
                  onClick={onPass}
                >
                  I Will Pass
                </button>
              </div>
            </>
          ) : (
            <p className="empty">No current turn set. Reset from Admin.</p>
          )}
        </div>
      ) : null}

      <ScheduleProposalPanel
        proposal={data.scheduleProposal}
        familySize={members.length}
        onCastVote={onCastProposalVote}
      />

      <div className="card">
        <h3 className="section-title">Family schedule</h3>
        {members.length === 0 ? (
          <p className="empty">
            No schedule data loaded. Use{" "}
            <code>npm run dev</code> (http://localhost:8889) so the API is
            available — Vite preview alone has no backend.
          </p>
        ) : (
          <>
            <div
              className="member-list-header member-list-header-schedule"
              aria-hidden="true"
            >
              <span>Member</span>
              <span>Proposed date</span>
            </div>
            {members.map((member, index) => (
              <MemberRow
                key={member.name}
                member={member}
                showRsvpVotes={
                  hostConfirmed &&
                  !member.isCurrent &&
                  member.status !== "Hosting"
                }
                onRsvpVote={(vote) => onVote(index, vote)}
                onShiftProposedDate={(weeks) =>
                  onShiftProposedDate(member.name, weeks)
                }
                onConfirmProposedDate={() =>
                  onConfirmProposedDate(member.name)
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
