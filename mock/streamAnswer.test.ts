import { describe, expect, it } from "vitest";
import { streamAnswer } from "./streamAnswer";
import type { StreamEvent } from "./types";

async function collect(): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of streamAnswer("How is Marcus doing on discovery?", { speed: 0 })) {
    events.push(event);
  }
  return events;
}

describe("streamAnswer", () => {
  it("returns the small documented sequence", async () => {
    const events = await collect();
    expect(events.map((event) => event.type)).toEqual([
      "status",
      "text",
      "text",
      "text",
      "artifact",
      "done",
    ]);
  });

  it("returns one complete coaching card with stable rows", async () => {
    const events = await collect();
    const artifact = events.find((event) => event.type === "artifact");
    expect(artifact?.kind).toBe("coaching-card");
    expect(artifact?.data.rep).toBe("Marcus Bell");
    expect(artifact?.data.rows).toHaveLength(3);
    expect(new Set(artifact?.data.rows.map((row) => row.id)).size).toBe(3);
  });
});
