import type { Kid, ScheduleProposal, Vote } from "../types";
import { ScheduleProposalPanel } from "./ScheduleProposalPanel";

/** Temporary — set false (or remove this card) after process voting ends. */
export const SHOW_KIDS_PROCESS_VOTE = true;

type Props = {
  kids: Kid[];
  proposal: ScheduleProposal | null | undefined;
  onRsvpVote: (name: string, vote: Vote) => void;
  onCastProposalVote: (vote: "yes" | "no") => void;
};

export function KidsPanel({
  kids,
  proposal,
  onRsvpVote,
  onCastProposalVote,
}: Props) {
  const yesNames = kids.filter((k) => k.vote === "yes").map((k) => k.name);
  const noNames = kids.filter((k) => k.vote === "no").map((k) => k.name);
  const pending = kids.length - yesNames.length - noNames.length;

  return (
    <div className="panel">
      {SHOW_KIDS_PROCESS_VOTE ? (
        <ScheduleProposalPanel
          proposal={proposal}
          familySize={kids.length}
          audience="kids"
          onCastVote={onCastProposalVote}
        />
      ) : null}

      <div className="card kids-tally-card">
        <h3 className="section-title">Coming / not coming</h3>
        <p className="status-line" style={{ marginBottom: "0.85rem" }}>
          RSVP only — separate from the process vote above.
        </p>
        <p className="status-line" style={{ marginBottom: "0.85rem" }}>
          <strong>{yesNames.length}</strong> coming ·{" "}
          <strong>{noNames.length}</strong> not coming
          {pending > 0 ? (
            <>
              {" "}
              · <strong>{pending}</strong> still to vote
            </>
          ) : null}
        </p>
        <div className="proposal-tally">
          <div className="proposal-tally-col">
            <h4>👍 Coming ({yesNames.length})</h4>
            {yesNames.length === 0 ? (
              <p className="empty">No votes yet</p>
            ) : (
              <ul className="proposal-name-list">
                {yesNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="proposal-tally-col">
            <h4>👎 Not coming ({noNames.length})</h4>
            {noNames.length === 0 ? (
              <p className="empty">No votes yet</p>
            ) : (
              <ul className="proposal-name-list">
                {noNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Children RSVP</h2>
        <p className="status-line" style={{ marginBottom: "1rem" }}>
          Tap thumbs up or down next to your name to say if you are coming.
        </p>
        {kids.map((kid) => (
          <div className="member-row member-row-simple" key={kid.name}>
            <div className="person">
              <img
                className="avatar"
                src={kid.photo}
                alt={kid.name}
                onError={(e) => {
                  e.currentTarget.src = "/kids/placeholder.jpg";
                }}
              />
              <div>
                <div className="person-name" style={{ fontSize: "1.05rem" }}>
                  {kid.name}
                </div>
                <div className="vote-block">
                  {kid.vote ? (
                    <span
                      className={`vote-result ${kid.vote === "yes" ? "yes" : "no"}`}
                    >
                      {kid.vote === "yes" ? "👍" : "👎"}
                    </span>
                  ) : (
                    <>
                      <span className="please-vote">Coming?</span>
                      <div className="vote-row">
                        <button
                          type="button"
                          className="vote-btn thumb yes"
                          onClick={() => onRsvpVote(kid.name, "yes")}
                          aria-label={`${kid.name} coming`}
                          title="Coming"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          className="vote-btn thumb no"
                          onClick={() => onRsvpVote(kid.name, "no")}
                          aria-label={`${kid.name} not coming`}
                          title="Not coming"
                        >
                          👎
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
