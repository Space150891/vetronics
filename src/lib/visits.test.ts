import { describe, expect, it } from "vitest";
import { noteStatus, overdue, upcoming } from "./visits";
import type { Appointment } from "./fixtures";

const a = (p: Partial<Appointment>): Appointment => ({ id: "x", date: "2026-10-22", time: "10:00", duration: 20, patientId: "", providerId: "", type: "", room: "", status: "scheduled", notes: [], history: [], ...p });
const at = (t: string) => new Date(`2026-10-22T${t}:00`).getTime();

describe("appointments upcoming / overdue", () => {
  it("only future, not-started visits are upcoming", () => {
    const list = [a({ id: "past", time: "09:00" }), a({ id: "next", time: "11:00" }), a({ id: "done", time: "12:00", status: "completed" }), a({ id: "cx", time: "13:00", status: "cancelled" })];
    expect(upcoming(list, at("10:30")).map((x) => x.id)).toEqual(["next"]);
    expect(overdue(list, at("10:30"), "2026-10-22").map((x) => x.id)).toEqual(["past"]);
  });
  it("note status is separate from appointment status", () => {
    expect(noteStatus(a({ status: "completed" }), undefined, at("09:00"))).toBe("missing");
    expect(noteStatus(a({}), undefined, at("09:00"))).toBe("not_started");
    expect(noteStatus(a({ status: "completed" }), { apptId: "x", text: "", status: "final", startedAt: "", savedAt: "" }, 0)).toBe("final");
  });
});
