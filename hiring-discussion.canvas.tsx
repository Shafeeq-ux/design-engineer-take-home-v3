import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Table,
  Text,
  useCanvasState,
} from "cursor/canvas";

type SectionId =
  | "room"
  | "flow"
  | "sources"
  | "craft"
  | "decisions"
  | "ai"
  | "next"
  | "live";

const NAV: { id: SectionId; label: string }[] = [
  { id: "room", label: "The room" },
  { id: "flow", label: "End to end" },
  { id: "sources", label: "Checkable" },
  { id: "craft", label: "Craft" },
  { id: "decisions", label: "Decisions" },
  { id: "ai", label: "With AI" },
  { id: "next", label: "More time" },
  { id: "live", label: "Live change" },
];

export default function HiringDiscussion() {
  const [section, setSection] = useCanvasState<SectionId>("section", "room");

  return (
    <Stack gap={20}>
      <Stack gap={6}>
        <H1>30-minute discussion</H1>
        <Text tone="secondary">
          Aria Sales Hub. Share the running app and the editor. This is the map for the four things the hiring manager asked about, plus the decisions, the AI overrides, and what you would do with more time.
        </Text>
      </Stack>

      <Callout tone="info" title="Say this, then start the app">
        Jordan reviews discovery calls to decide what to coach next. She asks from the composer already on Home. I treated the answer as the start of that coaching. I'll walk the path from the question to a booked rehearsal, then three decisions, including one I built and dropped.
      </Callout>

      <Row gap={6} wrap>
        {NAV.map((item) => (
          <Pill key={item.id} active={section === item.id} onClick={() => setSection(item.id)}>
            {item.label}
          </Pill>
        ))}
      </Row>

      {section === "room" ? <Room /> : null}
      {section === "flow" ? <Flow /> : null}
      {section === "sources" ? <Sources /> : null}
      {section === "craft" ? <Craft /> : null}
      {section === "decisions" ? <Decisions /> : null}
      {section === "ai" ? <WithAi /> : null}
      {section === "next" ? <MoreTime /> : null}
      {section === "live" ? <LiveChange /> : null}
    </Stack>
  );
}

function Room() {
  return (
    <Stack gap={16}>
      <H2>How to use the half hour</H2>
      <Text>
        Lead with the product. The hiring manager wants the thought process, and they will ask for a small live change near the end. Leave the last five minutes open.
      </Text>
      <Table
        headers={["Clock", "Min", "On screen"]}
        columnAlign={["left", "right", "left"]}
        rows={[
          ["0:00", "2", "The sentence above, then submit the question"],
          ["0:02", "6", "Answer through Booked, then the Home number"],
          ["0:08", "5", "Open the 2.9, edit the note, show the receipt"],
          ["0:13", "4", "Escape, dock, then a narrow window"],
          ["0:17", "8", "Three decisions, including the score scale you dropped"],
          ["0:25", "5", "What you would fix first, then their change"],
        ]}
        rowTone={["info", undefined, undefined, undefined, "warning", "success"]}
      />
      <Text size="small" tone="tertiary">
        Source: the hiring note for this discussion, mapped onto the current React app.
      </Text>

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Have open</H3>
          <Text>`src/AssistantExperience.tsx` for stages, focus, and the stream.</Text>
          <Text>`src/CoachingCard.tsx` for the score-to-quote row.</Text>
          <Text>`src/assistant.css` for dock, motion, and reduced motion.</Text>
          <Text>`mock/streamAnswer.ts` for the only data the answer is allowed to use.</Text>
          <Text>`DECISIONS.md` if they want the short written version.</Text>
        </Stack>
        <Stack gap={8}>
          <H3>Demo path, in order</H3>
          <Text>Home is up. The composer already holds the Marcus question. Press Enter.</Text>
          <Text>Let the three sentences land, then the card. Scores are 4.1, 3.8, and 2.9.</Text>
          <Text>Open Stakeholder discovery. Read the sentence under 2.9.</Text>
          <Text>Draft the note. Change one word. Remove the attachment. Send.</Text>
          <Text>The receipt says the note went with her edits. Book tomorrow at 9:00 AM.</Text>
          <Text>Coaching follow-ups on Home moves from 4 to 5.</Text>
        </Stack>
      </Grid>
    </Stack>
  );
}

function Flow() {
  return (
    <Stack gap={16}>
      <H2>End-to-end experience</H2>
      <Text>
        The assistant is a step in Jordan's morning. She asked from the bottom of Home, so the sheet uses that field's width and rises over the brief. The host page stays visible. On a wide screen she can dock the sheet into a right sidebar for this visit, and Home stays usable beside it. Reopening always starts floating. On a phone the sheet stays above the composer, and the dock control is gone.
      </Text>

      <Grid columns="1.1fr 1fr" gap={16}>
        <Stack gap={8}>
          <H3>Show</H3>
          <Text>The composer is the entry point that was already on every page. You did not add a second ask surface.</Text>
          <Text>The spine names the live stage. The footer holds one primary action.</Text>
          <Text>Nothing leaves until she presses Send to Marcus.</Text>
          <Text>Booking is the write-back. The morning brief's follow-up count changes, with a note about Marcus's rehearsal.</Text>
        </Stack>
        <Stack gap={8}>
          <H3>Say</H3>
          <Text>The mock ends in a suggested next step, so the sheet follows that step until something on Home changes.</Text>
          <Text>Stages replace each other. One action is live at a time, so she is never choosing among five buttons.</Text>
          <Text>The input is a question. The output is a coaching card, a note, and a booking. A chat transcript would make the artifact harder to act on.</Text>
        </Stack>
      </Grid>

      <Table
        headers={["Stage", "What she sees", "The one action"]}
        rows={[
          ["Answer", "Status, three streamed sentences, then the skills card", "Draft the coaching note"],
          ["Evidence", "One score open, with the sentence behind it", "Same draft action. The spine moves on the first open"],
          ["Draft", "Editable note, removable attachment, scores stay with her", "Send to Marcus"],
          ["Sent", "Receipt, and tomorrow at 9:00 AM, both free", "Book the rehearsal. Recall is available for 10 minutes"],
          ["Booked", "Short timeline, then back to Home", "Back to Home"],
        ]}
      />
      <Text size="small" tone="tertiary">
        The five stages in `AssistantExperience.tsx`. The Home change is `followUpsBumped` in `App.tsx`.
      </Text>
    </Stack>
  );
}

function Sources() {
  return (
    <Stack gap={16}>
      <H2>Checkable answers</H2>
      <Text>
        A score is a claim. The interaction is the path from that number back to the sentence that produced it. One row is open at a time. The first open moves the spine from Answer to Evidence and announces which skill she opened.
      </Text>

      <Table
        headers={["Skill", "Score", "What opening it shows"]}
        columnAlign={["left", "right", "left"]}
        rows={[
          ["Question depth", "4.1", "The patrol question Marcus asked"],
          ["Active listening", "3.8", "He reflected Omar's compliance concern before product detail"],
          ["Stakeholder discovery", "2.9", "Three calls ended without confirming who else shapes the decision"],
        ]}
        rowTone={[undefined, undefined, "warning"]}
      />
      <Text size="small" tone="tertiary">
        Scores and evidence strings from `mock/streamAnswer.ts`. The 2.9 row is the gap the draft attaches.
      </Text>

      <H3>The trace continues after the card</H3>
      <Text>
        The draft is built from the three streamed sentences, the lowest skill and its evidence, and the Brookfield next step. If another row is open, that skill is attached too. She can edit the note and remove an attachment. The receipt then says whether it went as drafted or with her edits, and which moments were attached. The line under the draft stays true because the attachment can actually come off: scores stay with Jordan, and Marcus sees only what is attached.
      </Text>
      <Text>
        The screen reader gets one polite summary when the card lands, naming all three skills and scores. The streamed sentences stay out of that live region, so the trace is on screen without every chunk being read aloud.
      </Text>

      <Callout tone="warning" title="Say this limit before they ask">
        The mock gives one evidence string per skill. There is no call id, timestamp, or recording. I did not invent a link that goes nowhere. Jordan can check the sentence behind the number. She cannot yet open the call. That is the next checkable step, and it needs the stream to include a source.
      </Callout>
    </Stack>
  );
}

function Craft() {
  return (
    <Stack gap={16}>
      <H2>Craft and execution</H2>
      <Text>
        Motion tells her where the answer is in its life. The sheet's dock and float are one measured move. Scores fill after the card settles. A quote opens by growing its row. A new stage arrives with a short rise. Reduced motion keeps the sequence and drops the travel. The stream runs faster, and entrances fade in about 120ms.
      </Text>

      <Table
        headers={["Concern", "What is in the app", "Where"]}
        rows={[
          ["Keyboard", "Escape closes from any stage. Focus returns to the composer. While floating, Tab stays inside the sheet.", "AssistantExperience.tsx"],
          ["Docked keyboard", "Docked, the sheet is not modal, so Home stays in the tab order.", "aria-modal flips with placement"],
          ["Screen reader", "Dialog labelled by her question. The spine is a progressbar. Each score is a button with expanded state. One polite live region.", "App.tsx portal + the sheet"],
          ["Focus on arrival", "Close takes focus when the sheet opens, without a ring until the next Tab. After booking, focus lands on Back to Home the same way.", "data-focus-quiet"],
          ["Phone", "Below 761px the dock control is removed. The sheet sits above the composer.", "dockAvailable media query"],
          ["Reduced motion", "Sequence and state stay. Travel, score fill, and the evidence height animation stop.", "assistant.css"],
        ]}
      />

      <H3>Found by using it</H3>
      <Text>
        An earlier prototype looked right in screenshots and failed in the hands. An invisible form sat over the mobile Send and Book buttons, because a child with pointer-events auto beat a parent set to none. Focus rings were clipped by overflow, so fields inside the sheet now draw an inset ring. A recall announcement was wiped because close cleared the live region after it was set. Those checks are why the React version treats the stream with a run token: closing mid-stream cannot write into a sheet that is already gone.
      </Text>
    </Stack>
  );
}

function Decisions() {
  return (
    <Stack gap={16}>
      <H2>Three decisions to walk</H2>
      <Text>
        Offer these when they ask how you chose. Spend the most time on the third. It is the one you built and then dropped.
      </Text>

      <H3>1. A score opens its quote</H3>
      <Text>
        This is the interaction I would defend. Jordan is about to coach someone, so the shortest path from a number to the sentence behind it is the one worth building. One row open. Opening a second row closes the first. The first open is what moves Answer to Evidence, so the spine follows what she did.
      </Text>
      <Text tone="secondary">
        I tried leaving all three quotes open, and a separate control that entered an evidence mode. Both added a step between the claim and the proof. The row itself is the control.
      </Text>

      <Divider />

      <H3>2. The answer grows from the composer</H3>
      <Text>
        The ask bar sits at the bottom centre of every page, so the reply uses that width and rises from that edge. Dock is optional and lasts for this visit, which lets her read the morning brief beside the answer. Float brings the sheet back. Close, from the button or Escape, returns focus to the prompt.
      </Text>
      <Text tone="secondary">
        I built a version where a side panel was the only place the answer lived. It put the reply away from the question. I kept the sheet, and made the sidebar something she chooses.
      </Text>

      <Divider />

      <Card>
        <CardHeader trailing="Dropped">The 100-point scale, and stopping at the card</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>
              An earlier pass invented scores of 82, 74, and 41. The mock is 4.1, 3.8, and 2.9 across the last six discovery calls. I kept the mock. A made-up scale would have looked more precise than the data.
            </Text>
            <Text>
              The first version also ended when the card appeared. The payload's last line is a next step about the Brookfield call, so the flow continues through a note she can edit, a receipt, and one rehearsal. Booking that slot is the only change on Home.
            </Text>
            <Text>
              I also left out a calendar, because tomorrow at 9:00 AM was already free for both of them, and a shortcut to another rep, because a second question returns this same answer.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function WithAi() {
  return (
    <Stack gap={16}>
      <H2>Where AI helped, and where you overrode it</H2>
      <Text>
        AI tools were part of the brief. The useful story is the judgment around them, especially when a generated idea implied a capability the mock does not have.
      </Text>
      <Table
        headers={["Drafted with the tool", "What you did with it"]}
        rows={[
          ["Stage machine, focus moves, measuring dock and float", "Kept. These are structural and easy to check by using the keyboard."],
          ["Scores of 82, 74, and 41", "Cut. The mock already had 4.1, 3.8, and 2.9."],
          ["A sparkle as the assistant mark, and monospace on scores and times", "Cut. The Aria mark was already the identity. Tabular figures solve the alignment without a terminal face."],
          ["A flow map inside the sheet, feedback thumbs, a scope chip on the ask bar", "Cut. The map was a design note addressed to Jordan. The chip claimed the question was filtered by the page. The mock returns one fixed answer."],
          ["A chain of thought, a retrieval inspector, a competency radar", "Cut. They need data the brief excludes, and a reasoning trace would look like proof."],
          ["An AI badge on the draft", "Cut. She edits and sends the note as herself. The receipt records her edits instead."],
        ]}
        rowTone={["success", "danger", "danger", "danger", "warning", "warning"]}
      />
      <Callout tone="neutral" title="The rule you can say out loud">
        If a control states a constraint, the engine has to honour it, or the control does not ship. That is why the scope chip went, and why there is no shortcut to Lena.
      </Callout>
      <Text>
        In the room, edit a label or a motion timing by hand. Ask the tool for a structural change, then read the diff and click through keyboard, dock, and a narrow width before you call it done.
      </Text>
    </Stack>
  );
}

function MoreTime() {
  return (
    <Stack gap={16}>
      <H2>If you had more time</H2>
      <Text>
        Say the first item without hedging. The others are real, and two of them wait on data the mock does not include.
      </Text>
      <Table
        headers={["Order", "What", "Why this order"]}
        rows={[
          ["1", "Recall should restore the draft", "Recall currently announces that nothing was sent, then closes the sheet. The control promises an undo. I would put the note back and leave her in Draft."],
          ["2", "A source she can open", "The quote is checkable. The call is not. I would add a call name and a way back only when the stream includes an id. I would not invent Brookfield call 4."],
          ["3", "A team benchmark beside each score", "This is the improvement in DECISIONS.md. It needs peer numbers this payload does not have, so it stays a recommendation."],
          ["4", "Clock times that come from the action", "The booked timeline says 9:12 and 9:14. Those should be when she actually sent, not fixed copy."],
        ]}
        rowTone={["danger", "warning", "info", undefined]}
      />
      <Text size="small" tone="tertiary">
        Priority 3 is the written next step in DECISIONS.md. Priority 1 is the behaviour I would fix before adding a comparison the data cannot support.
      </Text>
    </Stack>
  );
}

function LiveChange() {
  return (
    <Stack gap={16}>
      <H2>The live change</H2>
      <Text>
        They said no specific preparation. Make it the way you normally would: by hand for copy and motion, with the tool for a structural edit. Talk while you do it. Read the result in the browser before you say it is done.
      </Text>
      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Likely and small</H3>
          <Text>A label on the receipt, the rehearsal line, or the hint under the draft. Those live in `AssistantExperience.tsx`.</Text>
          <Text>How a score opens, or the words a screen reader hears on a row. That is `CoachingCard.tsx`.</Text>
          <Text>A timing or the reduced-motion path. That is `assistant.css`.</Text>
        </Stack>
        <Stack gap={8}>
          <H3>If they ask for a new capability</H3>
          <Text>Name the constraint. `streamAnswer` emits one status, three sentences, one card, and done. A second rep, a real calendar, or a link into a recording is a new dataset.</Text>
          <Text>Offer the honest version in scope. For example, change the receipt so a removed attachment is named, or make Recall return to the draft instead of closing.</Text>
          <Text>Leave `mock/streamAnswer.ts` alone unless they ask you to change the contract.</Text>
        </Stack>
      </Grid>
      <Callout tone="info" title="Close the half hour">
        I would fix Recall first, because it claims an undo and then dismisses the work. The benchmark beside each score is the feature I want, and it waits on data the brief does not include.
      </Callout>
    </Stack>
  );
}
