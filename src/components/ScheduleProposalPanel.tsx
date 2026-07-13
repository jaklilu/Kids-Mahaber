import type { ScheduleProposal, Vote } from "../types";
import { formatDate } from "../utils";
import { proposalStats } from "../schedule";

type Props = {
  proposal: ScheduleProposal | null | undefined;
  onVote: (name: string, vote: Vote) => void;
};

export function ScheduleProposalPanel({ proposal, onVote }: Props) {
  if (!proposal) return null;

  const stats = proposalStats(proposal);
  const percent = Math.round(stats.yesShare * 100);
  const barWidth = Math.min(100, percent);

  return (
    <div className="card proposal-card">
      <div className="proposal-header">
        <h3 className="section-title">{proposal.title}</h3>
        {stats.adopted ? (
          <span className="badge">Adopted</span>
        ) : (
          <span className="badge warn">Open for votes</span>
        )}
      </div>
      <p className="status-line proposal-summary">{proposal.summary}</p>

      <div className="proposal-progress">
        <div className="proposal-progress-meta">
          <strong>{stats.yes}</strong> of <strong>{stats.total}</strong> Yes
          ({percent}%) — need more than 70% ({stats.needed}+ Yes)
        </div>
        <div className="proposal-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`proposal-bar-fill ${stats.adopted ? "adopted" : ""}`}
            style={{ width: `${barWidth}%` }}
          />
          <div className="proposal-bar-threshold" title="70%" />
        </div>
        <p className="status-line">
          {stats.adopted
            ? "More than 70% agreed — this is our new hosting process."
            : `${stats.pending} still deciding · ${stats.no} No`}
        </p>
      </div>

      <div className="proposal-voters">
        {proposal.votes.map((voter) => (
          <div className="proposal-voter" key={voter.name}>
            <div className="person">
              <img
                className="avatar"
                src={voter.photo}
                alt={voter.name}
                onError={(e) => {
                  e.currentTarget.src = "/kids/placeholder.jpg";
                }}
              />
              <div>
                <div className="person-name" style={{ fontSize: "1.05rem" }}>
                  {voter.name}
                </div>
                <div className="vote-row">
                  <button
                    type="button"
                    className={`vote-btn yes ${voter.vote === "yes" ? "active" : ""}`}
                    onClick={() => onVote(voter.name, "yes")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`vote-btn no ${voter.vote === "no" ? "active" : ""}`}
                    onClick={() => onVote(voter.name, "no")}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
            <span
              className={`hosted-date-value ${voter.vote ? "" : "empty"}`}
            >
              {voter.vote === "yes"
                ? "Agreed"
                : voter.vote === "no"
                  ? "Declined"
                  : "—"}
            </span>
          </div>
        ))}
      </div>
      <p className="status-line" style={{ marginTop: "0.75rem" }}>
        Proposal opened {formatDate(proposal.createdAt)}.
      </p>
    </div>
  );
}
