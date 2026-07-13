import type { Kid, Vote } from "../types";

type Props = {
  kids: Kid[];
  onVote: (name: string, vote: Vote) => void;
};

export function KidsPanel({ kids, onVote }: Props) {
  return (
    <div className="panel">
      <div className="card">
        <h2 className="section-title">Kids RSVP</h2>
        <p className="status-line" style={{ marginBottom: "1rem" }}>
          Tap thumbs up or down next to your name.
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
                  <span className="please-vote">Please Vote</span>
                  <div className="vote-row">
                    <button
                      type="button"
                      className={`vote-btn thumb yes ${kid.vote === "yes" ? "active" : ""}`}
                      onClick={() => onVote(kid.name, "yes")}
                      aria-label={`${kid.name} yes`}
                      title="Yes"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      className={`vote-btn thumb no ${kid.vote === "no" ? "active" : ""}`}
                      onClick={() => onVote(kid.name, "no")}
                      aria-label={`${kid.name} no`}
                      title="No"
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
