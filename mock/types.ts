export type CoachingRow = {
  id: string;
  skill: string;
  score: number;
  evidence: string;
};

export type CoachingCard = {
  rep: string;
  period: string;
  summary: string;
  rows: CoachingRow[];
  nextStep: string;
};

export type StreamEvent =
  | { type: "status"; label: string }
  | { type: "text"; delta: string }
  | { type: "artifact"; kind: "coaching-card"; data: CoachingCard }
  | { type: "done" };
