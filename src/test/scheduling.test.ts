import { describe, expect, it } from "vitest";
import { bookingProblem, dayStats, freeSlots, type SchedData } from "@/lib/schedule";
import type { Appointment } from "@/lib/fixtures";

// 2026-10-21 is a Wednesday.
const base = (): SchedData => ({
  shifts: [{ id: "s", providerId: "p1", date: "2026-10-14", recurring: true, start: "08:00", end: "17:00", location: "Clinic", notes: "" }],
  skips: [], timeOff: [], appts: [],
});
const appt = (time: string, status: Appointment["status"] = "scheduled"): Appointment => ({ id: time, date: "2026-10-21", time, duration: 60, patientId: "pt1", providerId: "p1", type: "x", room: "", status, notes: [], history: [] });

describe("scheduling rules", () => {
  it("9h shift minus 1h lunch = 8h bookable", () => {
    const s = dayStats(base(), "2026-10-21", ["p1"]);
    expect(s.sched).toBe(540);
    expect(s.avail).toBe(480);
  });
  it("blocks lunch, weekends and overlaps", () => {
    const d = { ...base(), appts: [appt("09:00")] };
    expect(bookingProblem(d, { date: "2026-10-21", time: "12:00", duration: 20, providerId: "p1" })).not.toBeNull();
    expect(bookingProblem(d, { date: "2026-10-24", time: "09:00", duration: 20, providerId: "p1" })).not.toBeNull();
    expect(bookingProblem(d, { date: "2026-10-21", time: "09:30", duration: 20, providerId: "p1" })).not.toBeNull();
    expect(bookingProblem(d, { date: "2026-10-21", time: "10:00", duration: 20, providerId: "p1" })).toBeNull();
  });
  it("cancelled visits release slots and don't count toward utilisation", () => {
    const d = { ...base(), appts: [appt("09:00", "cancelled")] };
    expect(dayStats(d, "2026-10-21", ["p1"]).util).toBe(0);
    expect(freeSlots(d, "p1", "2026-10-21", 60)).toContain("09:00");
  });
  it("time off removes availability", () => {
    const d = { ...base(), timeOff: [{ id: "t", providerId: "p1", from: "2026-10-21", to: "2026-10-21", allDay: true, start: "", end: "", reason: "" }] };
    expect(freeSlots(d, "p1", "2026-10-21", 20)).toHaveLength(0);
  });
});
