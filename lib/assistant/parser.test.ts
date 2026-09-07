import { describe, expect, it } from "vitest";
import { parseAssistantInput, requiredAssistantFields } from "./parser";

const options = { today: "2026-09-07", defaultAccountId: "account-1", debts: [{ id: "debt-1", name: "Credit Card" }] };
const action = (value: string) => { const result = parseAssistantInput(value, options); expect(result.type).toBe("action"); if (result.type !== "action") throw new Error("Expected action"); return result.draft; };

describe("deterministic assistant parser", () => {
  it("parses an implicit expense and category", () => expect(action("biriyani 500")).toMatchObject({ kind: "expense", amount: 500, category: "Food & Dining", accountId: "account-1" }));
  it("parses income", () => expect(action("salary 45000")).toMatchObject({ kind: "income", amount: 45000, category: "Salary" }));
  it("parses debt details", () => expect(action("loan 100000 apr 12 minimum 2500")).toMatchObject({ kind: "debt", name: "Loan", amount: 100000, rate: 12, minimumPayment: 2500 }));
  it("keeps goals as a separate object type", () => expect(action("goal car 300000")).toMatchObject({ kind: "goal", name: "Car", amount: 300000 }));
  it("matches a debt payment", () => expect(action("paid 5000 credit card")).toMatchObject({ kind: "debt_payment", amount: 5000, debtId: "debt-1" }));
  it("asks for missing fields", () => { const draft = action("add expense"); expect(requiredAssistantFields(draft)).toContain("amount"); });
  it("always creates drafts that require confirmation", () => expect(action("grocery 900")).toBeTruthy());
  it("routes deterministic summary questions", () => expect(parseAssistantInput("How much debt do I have left?", options)).toEqual({ type: "insight", insight: "debt_summary" }));
});
