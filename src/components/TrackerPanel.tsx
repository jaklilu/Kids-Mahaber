import type { Member, TrackerData, Vote } from "../types";
import { formatDate, isDatePassed } from "../utils";
import { MemberRow } from "./MemberRow";
import { ScheduleProposalPanel } from "./ScheduleProposalPanel";

type Props = {
  data: TrackerData;
  onHost: () => void;
  onPass: () => void;
  onVote: (index: number, vote: Vote) => void;
  onProposalVote: (name: string, vote: Vote) => void;
  onShiftProposedDate: (name: string, weeks: 1 | -1) => void;
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
  onProposalVote,
  onShiftProposedDate,
}: Props) {
  const members = data?.members ?? [];
  const current = members.find((m) => m.isCurrent);
  const currentIndex = members.findIndex((m) => m.isCurrent);
  const interactive = canInteract(data, current);
  const hostConfirmed = members.some((m) => m.status === "Hosting");
  const proposalVotes = new Map(
    (data.scheduleProposal?.votes ?? []).map((v) => [v.name, v.vote]),
  );

  return (
    <div className="panel">
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

      <ScheduleProposalPanel proposal={data.scheduleProposal} />

      <div className="card">
        <h3 className="section-title">Family schedule &amp; votes</h3>
        <div
          className="member-list-header member-list-header-schedule"
          aria-hidden="true"
        >
          <span>Member</span>
          <span>Proposed date</span>
          <span>Date hosted</span>
          <span>Schedule vote</span>
        </div>
        {members.map((member, index) => (
          <MemberRow
            key={member.name}
            member={member}
            history={data.history ?? []}
            showRsvpVotes={
              hostConfirmed &&
              !member.isCurrent &&
              member.status !== "Hosting"
            }
            proposalVote={proposalVotes.get(member.name) ?? null}
            onRsvpVote={(vote) => onVote(index, vote)}
            onProposalVote={(vote) => onProposalVote(member.name, vote)}
            onShiftProposedDate={(weeks) =>
              onShiftProposedDate(member.name, weeks)
            }
          />
        ))}
      </div>
    </div>
  );
}
