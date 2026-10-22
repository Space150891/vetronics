import { describe, expect, it } from "vitest";
import { ME, ensureConv, markRead, totalUnread, appendMsg, type ChatState } from "./staff-chat";

const empty: ChatState = { convs: [], drafts: {} };

describe("staff chat", () => {
  it("never creates duplicate threads between the same two staff", () => {
    const a = ensureConv(empty, "s-priya");
    const b = ensureConv(a.state, "s-priya");
    expect(b.state.convs).toHaveLength(1);
    expect(b.id).toBe(a.id);
  });
  it("rejects inactive or unknown recipients (e.g. patients)", () => {
    expect(() => ensureConv(empty, "s-tom")).toThrow();
    expect(() => ensureConv(empty, "p-1")).toThrow();
  });
  it("counts unread incoming only and clears on read", () => {
    let { state, id } = ensureConv(empty, "s-priya");
    state = appendMsg(state, id, { id: "1", from: "s-priya", text: "hi", at: "2026-01-01", state: "sent", read: false });
    state = appendMsg(state, id, { id: "2", from: ME, text: "yo", at: "2026-01-02", state: "sent", read: false });
    expect(totalUnread(state)).toBe(1);
    expect(totalUnread(markRead(state, id))).toBe(0);
  });
  it("hides conversations the user is not part of", () => {
    const other: ChatState = { drafts: {}, convs: [{ id: "x", members: ["s-priya", "s-marcus"], messages: [{ id: "1", from: "s-priya", text: "a", at: "", state: "sent", read: false }] }] };
    expect(totalUnread(other)).toBe(0);
  });
});
