import type { HistoryEntry, Member, Vote } from "../types";
import { displayHostedDate, getLastHostedDate } from "../hosting";
import { formatDate } from "../utils";

type Props = {
  member: Member;
  history: HistoryEntry[];
  showRsvpVotes: boolean;
  proposalVote: Vote;
  onRsvpVote: (vote: Vote) => void;
  onProposalVote: (vote: Vote) => void;
  onShiftProposedDate: (weeks: 1 | -1) => void;
};

export function MemberRow({
  member,
  history,
  showRsvpVotes,
  proposalVote,
  onRsvpVote,
  onProposalVote,
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
          {showRsvpVotes && (
            <div className="vote-block">
              <span className="please-vote">Please Vote</span>
              <div className="vote-row">
                <button
                  type="button"
                  className={`vote-btn thumb yes ${member.vote === "yes" ? "active" : ""}`}
                  onClick={() => onRsvpVote("yes")}
                  aria-label={`${member.name} RSVP yes`}
                  title="Yes"
                >
                  👍
                </button>
                <button
                  type="button"
                  className={`vote-btn thumb no ${member.vote === "no" ? "active" : ""}`}
                  onClick={() => onRsvpVote("no")}
                  aria-label={`${member.name} RSVP no`}
                  title="No"
                >
                  👎
                </button>
              </div>
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
      <div className="hosted-date-cell proposal-vote-cell">
        <span className="please-vote">Please Vote</span>
        <div className="vote-row">
          <button
            type="button"
            className={`vote-btn thumb yes ${proposalVote === "yes" ? "active" : ""}`}
            onClick={() => onProposalVote("yes")}
            aria-label={`${member.name} agree with schedule`}
            title="Agree"
          >
            👍
          </button>
          <button
            type="button"
            className={`vote-btn thumb no ${proposalVote === "no" ? "active" : ""}`}
            onClick={() => onProposalVote("no")}
            aria-label={`${member.name} disagree with schedule`}
            title="Disagree"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  );
}
