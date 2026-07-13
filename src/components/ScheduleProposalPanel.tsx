import type { ScheduleProposal } from "../types";
import { formatDate } from "../utils";
import {
  isProposalVotingOpen,
  PROPOSAL_DEADLINE_LABEL,
  proposalStats,
} from "../schedule";

type Props = {
  proposal: ScheduleProposal | null | undefined;
  familySize: number;
  onCastVote: (vote: "yes" | "no") => void;
};

export function ScheduleProposalPanel({
  proposal,
  familySize,
  onCastVote,
}: Props) {
  if (!proposal) return null;

  const stats = proposalStats(proposal, familySize);
  const percent = Math.round(stats.yesShare * 100);
  const barWidth = Math.min(100, percent);
  const votingOpen = isProposalVotingOpen(proposal);

  return (
    <div className="card proposal-card">
      <div className="proposal-header">
        <h3 className="section-title">{proposal.title}</h3>
        {stats.adopted ? (
          <span className="badge">Adopted</span>
        ) : votingOpen ? (
          <span className="badge warn">Open for Voting</span>
        ) : (
          <span className="badge">Voting Closed</span>
        )}
      </div>

      <p className="proposal-deadline">
        Deadline: <strong>{PROPOSAL_DEADLINE_LABEL}</strong>
      </p>

      <div className="proposal-summary">
        {proposal.summary.split(/\n\n+/).map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="status-line">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="proposal-vote-cta">
        <p className="please-vote">
          {votingOpen ? "Please Vote" : "Voting has closed"}
        </p>
        {votingOpen ? (
          <>
            <div className="proposal-vote-buttons">
              <button
                type="button"
                className="vote-btn thumb yes large"
                onClick={() => onCastVote("yes")}
                aria-label="Agree with proposal"
              >
                👍
              </button>
              <button
                type="button"
                className="vote-btn thumb no large"
                onClick={() => onCastVote("no")}
                aria-label="Disagree with proposal"
              >
                👎
              </button>
            </div>
            <p className="status-line">
              Please vote by {PROPOSAL_DEADLINE_LABEL}. Voting closes after that.
            </p>
          </>
        ) : (
          <p className="status-line">
            The deadline was {PROPOSAL_DEADLINE_LABEL}. New votes are no longer
            accepted.
          </p>
        )}
      </div>

      <div className="proposal-progress">
        <div className="proposal-progress-meta">
          <strong>{stats.yes}</strong> of <strong>{stats.familySize}</strong>{" "}
          family members agree ({percent}%) — need more than 70% (
          {stats.needed}+ 👍)
        </div>
        <div
          className="proposal-bar"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`proposal-bar-fill ${stats.adopted ? "adopted" : ""}`}
            style={{ width: `${barWidth}%` }}
          />
          <div className="proposal-bar-threshold" title="70%" />
        </div>
        <p className="status-line">
          {stats.adopted
            ? "More than 70% agreed — this is our new hosting process."
            : `${stats.voted} vote(s) recorded · ${stats.no} 👎`}
        </p>
      </div>

      <div className="proposal-tally">
        <div className="proposal-tally-col">
          <h4>👍 Agree ({stats.yes})</h4>
          {stats.yesNames.length === 0 ? (
            <p className="empty">No votes yet</p>
          ) : (
            <ul className="proposal-name-list">
              {stats.yesNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="proposal-tally-col">
          <h4>👎 Disagree ({stats.no})</h4>
          {stats.noNames.length === 0 ? (
            <p className="empty">No votes yet</p>
          ) : (
            <ul className="proposal-name-list">
              {stats.noNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="status-line">Proposal opened {formatDate(proposal.createdAt)}.</p>
    </div>
  );
}
