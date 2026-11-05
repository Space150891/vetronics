import { describe, expect, it } from "vitest";
import { clinicDate } from "./display";

describe("clinic date presentation", () => {
  it("uses one US clinic display for ISO appointment dates and existing US patient dates", () => {
    expect(clinicDate("2026-11-05")).toBe("Nov 5, 2026");
    expect(clinicDate("11/05/2026")).toBe("Nov 5, 2026");
  });
});