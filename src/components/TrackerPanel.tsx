import type { Member, TrackerData, Vote } from "../types";
import { formatDate, isDatePassed } from "../utils";
import { MemberRow } from "./MemberRow";

type Props = {
  data: TrackerData;
  onHost: () => void;
  onPass: () => void;
  onVote: (index: number, vote: Vote) => void;
};

function canInteract(data: TrackerData | null | undefined, current: Member | undefined): boolean {
  if (!data || !current) return false;
  const host = data.members?.find((m) => m.status === "Hosting");
  if (host?.hostingDate && !isDatePassed(host.hostingDate)) return false;
  return true;
}

export function TrackerPanel({ data, onHost, onPass, onVote }: Props) {
  const members = data?.members ?? [];
  const current = members.find((m) => m.isCurrent);
  const currentIndex = members.findIndex((m) => m.isCurrent);
  const interactive = canInteract(data, current);
  const hostConfirmed = members.some((m) => m.status === "Hosting");

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

      <div className="card">
        <h3 className="section-title">Family</h3>
        <div className="member-list-header" aria-hidden="true">
          <span>Member</span>
          <span>Date hosted</span>
        </div>
        {members.map((member, index) => (
          <MemberRow
            key={member.name}
            member={member}
            history={data.history ?? []}
            showVotes={
              hostConfirmed &&
              !member.isCurrent &&
              member.status !== "Hosting"
            }
            onVote={(vote) => onVote(index, vote)}
          />
        ))}
      </div>
    </div>
  );
}
