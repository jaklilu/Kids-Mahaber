import type { TrackerData } from "../types";
import { displayHostedDate, getLastHostedDate } from "../hosting";
import { formatDate } from "../utils";

type Props = {
  data: TrackerData;
  onResetAll: () => void;
  onClearHistory: () => void;
  onResetMember: (index: number) => void;
  onChangeHostDate: (index: number) => void;
  onGenerateSchedule: () => void;
  onShiftProposedDate: (name: string, weeks: 1 | -1) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDeleteHistory: (index: number) => void;
};

export function AdminPanel({
  data,
  onResetAll,
  onClearHistory,
  onResetMember,
  onChangeHostDate,
  onGenerateSchedule,
  onShiftProposedDate,
  onMove,
  onDeleteHistory,
}: Props) {
  return (
    <div className="panel">
      <div className="card">
        <h2 className="section-title">Admin controls</h2>
        <div className="admin-actions">
          <button type="button" className="btn btn-amber" onClick={onResetAll}>
            Reset all members
          </button>
          <button
            type="button"
            className="btn btn-pass"
            onClick={onClearHistory}
          >
            Clear history
          </button>
          <button
            type="button"
            className="btn btn-host"
            onClick={onGenerateSchedule}
          >
            Refresh proposed schedule
          </button>
        </div>
        <p className="status-line">
          Refresh rebuilds second-Saturday dates (Frea next month, then every 3
          months) and resets proposal votes.
        </p>
      </div>

      <div className="card">
        <h2 className="section-title">Member order</h2>
        <div className="member-list-header member-list-header-schedule" aria-hidden="true">
          <span>Member</span>
          <span>Proposed date</span>
          <span>Date hosted</span>
        </div>
        {data.members.map((member, index) => {
          const hostedDate = getLastHostedDate(member, data.history ?? []);
          const isHosting = member.status === "Hosting" && Boolean(member.hostingDate);
          return (
            <div className="member-row member-row-schedule" key={member.name}>
              <div className="person">
                <img
                  className="avatar"
                  src={member.photo}
                  alt={member.name}
                  onError={(e) => {
                    e.currentTarget.src = "/kids/placeholder.jpg";
                  }}
                />
                <div>
                  <div className="person-name" style={{ fontSize: "1.05rem" }}>
                    {member.name}
                  </div>
                  <p className="status-line">
                    {isHosting
                      ? `Hosting ${formatDate(member.hostingDate)}`
                      : member.status || "Pending"}
                  </p>
                  <div className="actions" style={{ marginTop: "0.45rem" }}>
                    {isHosting && (
                      <button
                        type="button"
                        className="btn btn-host btn-sm"
                        onClick={() => onChangeHostDate(index)}
                      >
                        Change date
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onResetMember(index)}
                    >
                      Reset
                    </button>
                    {index > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onMove(index, "up")}
                      >
                        Up
                      </button>
                    )}
                    {index < data.members.length - 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onMove(index, "down")}
                      >
                        Down
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="hosted-date-cell proposed-date-cell">
                <span className="hosted-date-label">Proposed</span>
                <span
                  className={`hosted-date-value ${member.proposedDate ? "" : "empty"}`}
                >
                  {member.proposedDate
                    ? formatDate(member.proposedDate)
                    : "—"}
                </span>
                {member.proposedDate ? (
                  <div className="week-shift-row">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm week-shift-btn"
                      onClick={() => onShiftProposedDate(member.name, -1)}
                    >
                      −1 wk
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm week-shift-btn"
                      onClick={() => onShiftProposedDate(member.name, 1)}
                    >
                      +1 wk
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="hosted-date-cell">
                <span className="hosted-date-label">Hosted</span>
                <span
                  className={`hosted-date-value ${hostedDate ? "" : "empty"}`}
                >
                  {displayHostedDate(hostedDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="section-title">Hosting history</h2>
        {data.history.length === 0 ? (
          <p className="empty">No history yet.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.history.map((entry, index) => (
                <tr key={`${entry.name}-${entry.date}-${index}`}>
                  <td>{entry.name}</td>
                  <td>
                    {entry.date.includes("-")
                      ? formatDate(entry.date)
                      : entry.date}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onDeleteHistory(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
