import type { CSSProperties } from "react";
import type { CoachingCard as CoachingCardData } from "../mock/types";
import { Icons } from "./icons";

type CoachingCardProps = {
  card: CoachingCardData;
  openId: string | null;
  compact: boolean;
  folded: boolean;
  filled: boolean;
  sentHint: string | null;
  onToggleSkill: (id: string, name: string) => void;
};

function band(score: number) {
  return score < 3.5 ? "watch" : "strong";
}

export function CoachingCard({
  card,
  openId,
  compact,
  folded,
  filled,
  sentHint,
  onToggleSkill,
}: CoachingCardProps) {
  const scores = card.rows.map((row) => row.score.toFixed(1)).join(" / ");

  return (
    <article className={`answer-card${compact ? " compact" : ""}${folded ? " folded" : ""}${filled ? " filled" : ""}`}>
      <div className="answer-card-head">
        {compact ? (
          <div className="fold">
            <span className="fold-title">Discovery skills</span>
            <span className="fold-scores">{scores}</span>
          </div>
        ) : (
          <>
            <h3>Discovery skills</h3>
            <p className="answer-card-sub">{card.summary}</p>
          </>
        )}
      </div>

      <ul className="skills" id="card-body">
        {card.rows.map((row) => {
          const open = openId === row.id;
          const evidenceId = `evidence-${row.id}`;
          const buttonId = `skill-${row.id}`;
          return (
            <li className={`skill${open ? " open" : ""}`} key={row.id} data-band={band(row.score)}>
              <button
                id={buttonId}
                className="skill-btn"
                type="button"
                aria-expanded={open}
                aria-controls={evidenceId}
                onClick={() => onToggleSkill(row.id, row.skill)}
              >
                <span className="skill-name">{row.skill}</span>
                <span className="meter" aria-hidden="true">
                  <span className="track">
                    <span className="fill" style={{ "--score": row.score } as CSSProperties} />
                  </span>
                  <span className="score">{row.score.toFixed(1)}</span>
                </span>
                <Icons.chevronDown className="chev" aria-hidden="true" />
                <span className="sr-only">{row.score.toFixed(1)} out of 5. Show the evidence behind this score.</span>
              </button>
              <div className="evidence" id={evidenceId} role="region" aria-labelledby={buttonId} aria-hidden={!open}>
                <div>
                  <div className="evidence-in">
                    <blockquote className="quote">
                      <p>{row.evidence}</p>
                    </blockquote>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="next">
        <p>{card.nextStep}</p>
        {sentHint ? <p className="hint">{sentHint}</p> : null}
      </div>
    </article>
  );
}
