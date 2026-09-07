import { describe, expect, it } from "vitest";
import { answerInsight } from "./insights";

const data = { currency: "INR", aedToInr: 25, strategy: "avalanche" as const, accounts: [], goals: [{ id: "g", name: "Car", target: 100000, saved: 25000, createdAt: "2026-01-01" }], debts: [{ id: "d", name: "Card", total: 100000, balance: 60000, rate: 18, minPayment: 2000, color: "#000" }], transactions: [] };
describe("assistant insights", () => {
  it("uses recorded debt values", () => { const answer = answerInsight("debt_summary", data); expect(answer).toContain("60,000"); expect(answer).toContain("40.0%"); });
  it("summarizes goal progress", () => expect(answerInsight("goal_progress", data)).toContain("25%"));
  it("does not fabricate missing monthly spending", () => expect(answerInsight("top_expense", data)).toContain("no living expenses"));
});
