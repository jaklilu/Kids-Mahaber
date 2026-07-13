import type { HistoryEntry, Member, Vote } from "../types";
import { displayHostedDate, getLastHostedDate } from "../hosting";
import { formatDate } from "../utils";

type Props = {
  member: Member;
  history: HistoryEntry[];
  showVotes: boolean;
  onVote: (vote: Vote) => void;
  onShiftProposedDate: (weeks: 1 | -1) => void;
};

export function MemberRow({
  member,
  history,
  showVotes,
  onVote,
  onShiftProposedDate,
}: Props) {
  const hostedDate = getLastHostedDate(member, history);
  const proposed = member.proposedDate
    ? formatDate(member.proposedDate)
    : "—";

  return (
    <div className="member-row member-row-schedule">
      <div className="person">
        <img
          className="avatar"
          src={member.photo}
          alt={member.name}
          onError={(e) => {
            e.currentTarget.src = "/kids/placeholder.jpg";
          }}
        />
        <div className="member-main">
          <div className="person-name" style={{ fontSize: "1.05rem" }}>
            {member.name}
          </div>
          {member.status === "Hosting" && member.hostingDate ? (
            <span className="badge warn">Hosting</span>
          ) : member.status === "Passed" ? (
            <span className="badge danger">Passed</span>
          ) : member.isCurrent ? (
            <span className="badge">Current</span>
          ) : null}
          {showVotes && (
            <div className="vote-row">
              <button
                type="button"
                className={`vote-btn yes ${member.vote === "yes" ? "active" : ""}`}
                onClick={() => onVote("yes")}
                aria-label={`${member.name} yes`}
              >
                Yes
              </button>
              <button
                type="button"
                className={`vote-btn no ${member.vote === "no" ? "active" : ""}`}
                onClick={() => onVote("no")}
                aria-label={`${member.name} no`}
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="hosted-date-cell proposed-date-cell">
        <span className="hosted-date-label">Proposed</span>
        <span
          className={`hosted-date-value ${member.proposedDate ? "" : "empty"}`}
        >
          {proposed}
        </span>
        {member.proposedDate ? (
          <div className="week-shift-row">
            <button
              type="button"
              className="btn btn-ghost btn-sm week-shift-btn"
              onClick={() => onShiftProposedDate(-1)}
              title="One week earlier"
              aria-label={`${member.name} one week earlier`}
            >
              −1 wk
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm week-shift-btn"
              onClick={() => onShiftProposedDate(1)}
              title="One week later"
              aria-label={`${member.name} one week later`}
            >
              +1 wk
            </button>
          </div>
        ) : null}
      </div>
      <div className="hosted-date-cell">
        <span className="hosted-date-label">Hosted</span>
        <span className={`hosted-date-value ${hostedDate ? "" : "empty"}`}>
          {displayHostedDate(hostedDate)}
        </span>
      </div>
    </div>
  );
}
