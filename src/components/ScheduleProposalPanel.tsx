import type { ScheduleProposal } from "../types";
import { formatDate } from "../utils";
import { proposalStats } from "../schedule";

type Props = {
  proposal: ScheduleProposal | null | undefined;
};

/** Summary + progress only — votes live in the family schedule table. */
export function ScheduleProposalPanel({ proposal }: Props) {
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
      <p className="status-line proposal-summary">
        {proposal.summary.includes("−1 wk")
          ? proposal.summary
          : `${proposal.summary} If a date does not work, use −1 wk or +1 wk under Proposed date to move it one week earlier or later.`}
      </p>

      <div className="proposal-progress">
        <div className="proposal-progress-meta">
          <strong>{stats.yes}</strong> of <strong>{stats.total}</strong> Yes
          ({percent}%) — need more than 70% ({stats.needed}+ Yes)
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
            : `${stats.pending} still deciding · ${stats.no} No · Vote in the table below`}
        </p>
      </div>
      <p className="status-line">Proposal opened {formatDate(proposal.createdAt)}.</p>
    </div>
  );
}
