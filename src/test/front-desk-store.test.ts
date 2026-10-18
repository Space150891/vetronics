import { describe, expect, it } from "vitest";
import { markArrived, moveToReady, peekAppointments, resetDemo } from "@/lib/store";

const firstScheduled = () => peekAppointments().find((a) => a.status === "scheduled")!.id;

describe("front desk workflow", () => {
  it("marks arrived once and only from Scheduled", () => {
    resetDemo();
    const id = firstScheduled();
    expect(markArrived(id)).toBe(true);
    expect(markArrived(id)).toBe(false);
    const a = peekAppointments().find((x) => x.id === id)!;
    expect(a.history.filter((h) => h.text === "Marked Arrived")).toHaveLength(1);
  });

  it("moves to Ready only after Arrived, once", () => {
    resetDemo();
    const id = firstScheduled();
    expect(moveToReady(id)).toBe(false);
    markArrived(id);
    expect(moveToReady(id)).toBe(true);
    expect(moveToReady(id)).toBe(false);
  });
});
