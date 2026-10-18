import { describe, expect, it } from "vitest";
import { markArrived, moveToReady, resetDemo } from "@/lib/store";
import { useStore } from "@/lib/store";

// Read state directly via the store snapshot helper.
function appts() {
  let out: ReturnType<typeof snapshot> = [];
  function snapshot() { return [] as import("@/lib/fixtures").Appointment[]; }
  // useStore cannot run outside React; peek by triggering a no-op transition.
  void useStore;
  return out;
}
void appts;

import * as store from "@/lib/store";

describe("front desk workflow", () => {
  it("marks arrived once and only from Scheduled", () => {
    resetDemo();
    const id = (store as unknown as { __peek: () => { id: string; status: string }[] }).__peek().find((a) => a.status === "scheduled")!.id;
    expect(markArrived(id)).toBe(true);
    expect(markArrived(id)).toBe(false);
    const a = (store as unknown as { __peek: () => { id: string; history: unknown[] }[] }).__peek().find((x) => x.id === id)!;
    expect(a.history.filter((h) => (h as { text: string }).text === "Marked Arrived")).toHaveLength(1);
  });

  it("moves to Ready only after Arrived, once", () => {
    resetDemo();
    const id = (store as unknown as { __peek: () => { id: string; status: string }[] }).__peek().find((a) => a.status === "scheduled")!.id;
    expect(moveToReady(id)).toBe(false);
    markArrived(id);
    expect(moveToReady(id)).toBe(true);
    expect(moveToReady(id)).toBe(false);
  });
});
