import type { StreamEvent } from "./types";

const ANSWER = [
  "Marcus is improving at discovery, especially when he slows down and follows the buyer's language.",
  " His strongest recent moment was turning a vague security concern into a concrete success measure.",
  " The next coaching opportunity is to involve more stakeholders before proposing a solution.",
];

const COACHING_CARD: Extract<StreamEvent, { type: "artifact" }> = {
  type: "artifact",
  kind: "coaching-card",
  data: {
    rep: "Marcus Bell",
    period: "Last 6 discovery calls · Q3",
    summary: "Clear progress, with one repeatable gap in stakeholder discovery.",
    rows: [
      {
        id: "question-depth",
        skill: "Question depth",
        score: 4.1,
        evidence: "“What would need to be true for your team to trust an autonomous patrol?”",
      },
      {
        id: "active-listening",
        skill: "Active listening",
        score: 3.8,
        evidence: "Marcus reflected Omar's compliance concern before moving to product detail.",
      },
      {
        id: "multithreading",
        skill: "Stakeholder discovery",
        score: 2.9,
        evidence: "Three calls ended without confirming who else shapes the decision.",
      },
    ],
    nextStep: "In the next Brookfield call, ask who must validate operational and legal readiness.",
  },
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * The whole candidate contract: one status, three text deltas, one complete
 * artifact, and done. Set speed to 0 in tests or while iterating.
 */
export async function* streamAnswer(
  _prompt: string,
  options: { speed?: number } = {},
): AsyncGenerator<StreamEvent> {
  const speed = options.speed ?? 1;
  const pause = (milliseconds: number) => (speed === 0 ? Promise.resolve() : wait(milliseconds / speed));

  await pause(360);
  yield { type: "status", label: "Reviewing 6 discovery calls" };

  for (const delta of ANSWER) {
    await pause(460);
    yield { type: "text", delta };
  }

  await pause(520);
  yield COACHING_CARD;
  yield { type: "done" };
}
