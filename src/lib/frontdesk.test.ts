import { describe, expect, it } from "vitest";
import { stageOf } from "./store";
import type { Appointment } from "./fixtures";

const a = (p: Partial<Appointment>): Appointment => ({ id: "x", date: "", time: "", duration: 20, patientId: "", providerId: "", type: "", room: "", status: "scheduled", notes: [], history: [], ...p });

describe("front desk stages", () => {
  it("maps statuses to the four columns", () => {
    expect(stageOf(a({ status: "scheduled" }))).toBe("expected");
    expect(stageOf(a({ status: "arrived" }))).toBe("waiting");
    expect(stageOf(a({ status: "ready" }))).toBe("waiting");
    expect(stageOf(a({ status: "in_room" }))).toBe("with_provider");
    expect(stageOf(a({ status: "completed" }))).toBe("checkout");
  });
  it("checked-out, cancelled and no-show visits leave the board", () => {
    expect(stageOf(a({ status: "completed", checkedOutAt: "t" }))).toBe("done");
    expect(stageOf(a({ status: "cancelled" }))).toBe("done");
    expect(stageOf(a({ status: "no_show" }))).toBe("done");
  });
});
