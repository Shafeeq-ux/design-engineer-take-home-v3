# AI Assistant coaching answer: Lead Design Engineer take-home

Build one polished AI assistant moment inside a provided Aria Sales Hub shell.

**Time guidance:** plan for roughly **3–4 hours of building**. Treat that as a useful scope target and use your judgment; we care about the quality of your decisions and what you prioritise, not the number of hours you report. Ideally, we would like to see your solution within **3–4 days of receiving the assignment**.

**AI tools are welcome.** Use whatever tools you are comfortable with. It does not matter which tools you choose or usually work with. In the debrief, we will ask about specific design and code decisions and make one small change together. You may make that change directly or use an AI tool. We want to understand how you work: how you prompt, when you use AI, when you edit directly, and how you evaluate the result.

## The task

### Context you need

**Aria** is a fictional autonomous-drone company selling security systems to large organisations. **Jordan Ashby** manages a team of sales reps. **Marcus Bell** is one of those reps and is working on the Brookfield public-safety deal.

A **discovery call** is an early customer conversation where a rep learns the buyer's needs, success criteria, concerns, and who else is involved in the decision. Jordan reviews moments across these calls to decide what Marcus is doing well and what to coach next. The structured coaching card in the mock combines skill scores, supporting evidence, and one suggested next step.

You do not need prior knowledge of sales enablement. Everything needed for this task is in this README and the mock payload.

The coded app shell is already complete and responsive, with the **AI Assistant entry point at the bottom centre of every page**. You can treat the shell as provided and focus your time on the post-invocation experience. We do not expect you to rebuild or redesign the host app, though small integration changes are welcome when they support your concept. If a different frontend setup helps you work effectively, you may also re-architect parts of the starter or introduce tools such as Tailwind. Use your judgment and keep the main effort focused on the AI Assistant experience.

Your work starts when Jordan invokes the AI Assistant with one question:

> **How is Marcus doing on discovery calls this quarter?**

Design and build the post-invocation experience. Decide where the AI Assistant appears, how the answer takes shape, how it moves, and how Jordan inspects the result.

Use the small fixed stream in `mock/streamAnswer.ts`. It emits:

1. one progress status;
2. three text chunks;
3. one complete coaching card with three scored skills and evidence;
4. `done`.

There are no hidden prompt variants, merge rules, failure protocols, permissions, or extra datasets.

## Required behaviour

- The AI Assistant opens from the provided entry point and can be dismissed. `Escape` closes it and focus returns to the entry point.
- Progress, streamed text, and the coaching card reveal coherently without distracting layout jumps.
- The coaching card has **one meaningful interaction**: expand it, disclose evidence, change its level of detail, or make another choice you can defend.
- The experience works on a desktop and at a narrow mobile width. It may change form on mobile.
- Every action works with a keyboard. Focus is visible and moves intentionally. Announce meaningful status changes to assistive technology without announcing every text chunk.
- Motion communicates state and hierarchy. Respect `prefers-reduced-motion` with a considered alternative.
- Keep the code typed and readable enough for another engineer to extend.

**If you have time:** add one small enhancement that strengthens your concept; tell us why you chose it.

## Start

```bash
npm install
npm run dev
```

`src/App.tsx` owns the host shell and invokes `src/AssistantExperience.tsx`. Replace the neutral placeholder in `AssistantExperience.tsx`; make any small shell changes your concept genuinely needs. You may add any motion library or headless primitive you prefer. Do not use a drop-in chat or assistant UI kit because the answer experience is the exercise.

The mock contract is intentionally small:

```ts
type StreamEvent =
  | { type: "status"; label: string }
  | { type: "text"; delta: string }
  | { type: "artifact"; kind: "coaching-card"; data: CoachingCard }
  | { type: "done" };

streamAnswer(prompt: string, options?: { speed?: number }): AsyncGenerator<StreamEvent>;
```

`npm test` verifies the sequence. `speed: 0` runs it instantly; the default timing is designed for the experience.

## Submit

Share readable source and whatever supporting presentation makes your solution easiest to understand. We suggest:

1. a live preview;
2. a concise `DECISIONS.md` covering what you prioritised, one design or motion decision you are proud of, where AI helped and where you overrode it, and what you would improve next. Around 300 words is usually plenty, but this is guidance rather than a limit;
3. a short screen recording showing the desktop and mobile journey. Roughly 2–5 minutes is often enough, but use your judgment.

These are recommendations, not formatting tests: choose the clearest way to present your solution. Keep your natural commit history. We evaluate design taste, motion and interaction craft, frontend quality, accessibility, prioritisation, and your judgment when working with AI. A panel discussion will give you space to walk us through the submission, explain decisions, and make a small change with us. We will not use your work outside the hiring process, and you remain free to publish it afterward.

Aria, Aria Sales Hub, Jordan, Marcus, Brookfield, and all coaching data are fictional and exist only for this exercise.
