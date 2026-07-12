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
          Tap Yes or No next to your name.
        </p>
        {kids.map((kid) => (
          <div className="member-row" key={kid.name}>
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
                <div className="vote-row">
                  <button
                    type="button"
                    className={`vote-btn yes ${kid.vote === "yes" ? "active" : ""}`}
                    onClick={() => onVote(kid.name, "yes")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`vote-btn no ${kid.vote === "no" ? "active" : ""}`}
                    onClick={() => onVote(kid.name, "no")}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
