import { describe, expect, it } from "vitest";
import { createOrGetFollowUpForShotDate } from "@/lib/followups/service";

describe("followup grouping", () => {
  it("reuses one follow-up for the same patient and shot date", async () => {
    const first = await createOrGetFollowUpForShotDate("pat-1001", "2026-04-21");
    const second = await createOrGetFollowUpForShotDate("pat-1001", "2026-04-21");

    expect(first.id).toBe(second.id);
  });

  it("creates separate follow-ups when the shot date changes", async () => {
    const first = await createOrGetFollowUpForShotDate("pat-1001", "2026-04-21");
    const second = await createOrGetFollowUpForShotDate("pat-1001", "2026-04-22");

    expect(first.id).not.toBe(second.id);
  });
});
