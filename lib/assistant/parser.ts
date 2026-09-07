import { EXPENSE_RULES, INCOME_RULES } from "../quick-entry/rules";
import type { AssistantAction, AssistantDraft, AssistantIntent } from "./types";

type Entity = { id: string; name: string };
export type AssistantParseOptions = { today?: string; defaultAccountId?: string | null; debts?: Entity[] };

const amountPattern = /(?:₹|rs\.?|inr|aed|\$)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(lakh|lac|k)?\b/i;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const title = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
const categoryFor = (text: string, rules: ReadonlyArray<[string, readonly string[]]>) =>
  rules.find(([, words]) => words.some((word) => (` ${text} `).includes(` ${normalize(word)} `)))?.[0] ?? "Other";

function parseAmount(raw: string) {
  const match = raw.match(amountPattern);
  if (!match) return null;
  const base = Number(match[1].replaceAll(",", ""));
  const suffix = match[2]?.toLowerCase();
  const amount = base * (suffix === "lakh" || suffix === "lac" ? 100000 : suffix === "k" ? 1000 : 1);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function matchedDebt(text: string, debts: Entity[]) {
  const matches = debts.filter((debt) => {
    const name = normalize(debt.name);
    return name.length > 1 && (` ${text} `).includes(` ${name} `);
  });
  return matches.length === 1 ? matches[0] : null;
}

function actionFor(text: string, amount: number | null): AssistantAction | null {
  if (/\b(goal|save for|saving goal)\b/.test(text)) return "goal";
  if (/\b(paid|debt payment|pay debt|payment towards?)\b/.test(text)) return "debt_payment";
  if (/\b(add debt|debt|loan|credit card)\b/.test(text)) return "debt";
  if (/\b(salary|freelance|income|earned|received|bonus)\b/.test(text)) return "income";
  if (/\b(expense|spent|grocery|groceries|biryani|biriyani|uber|food|rent|fuel|shopping)\b/.test(text)) return "expense";
  return amount ? "expense" : null;
}

function stripCommand(raw: string) {
  return title(raw.replace(/\bapr\s*\d+(?:\.\d+)?\b/gi, " ").replace(/\b(?:minimum|min)\s*\d[\d,]*(?:\.\d+)?\b/gi, " ").replace(amountPattern, " ")
    .replace(/\b(add|new|create|expense|income|debt payment|payment|paid|debt|goal|save for|earned|received|towards?|apr|minimum|min)\b/gi, " ")
    .replace(/\s+/g, " ").trim());
}

export function requiredAssistantFields(draft: AssistantDraft) {
  const missing: string[] = [];
  if (!draft.amount || draft.amount <= 0) missing.push("amount");
  if ((draft.kind === "debt" || draft.kind === "goal") && !draft.name.trim()) missing.push("name");
  if (["expense", "income", "debt_payment"].includes(draft.kind) && !draft.accountId) missing.push("account");
  if (draft.kind === "debt_payment" && !draft.debtId) missing.push("debt");
  return missing;
}

export function parseAssistantInput(raw: string, options: AssistantParseOptions = {}): AssistantIntent {
  const text = normalize(raw);
  if (!text) return { type: "unknown" };
  const extra = /\b(extra|more)\b/.test(text) && parseAmount(raw);
  if (/how much debt|debt.*left|freedom number|amount paid|percentage cleared|percent cleared/.test(text)) return { type: "insight", insight: "debt_summary" };
  if (/available balance|how much.*available|cash.*available/.test(text)) return { type: "insight", insight: "available_balance" };
  if (/payoff power|how much.*pay.*month/.test(text)) return { type: "insight", insight: "payoff_power" };
  if (/which debt|pay first|pay next|attack next|focus.*debt/.test(text)) return { type: "insight", insight: "next_debt" };
  if (/avalanche|snowball|current strategy|payoff strategy/.test(text)) return { type: "insight", insight: "strategy" };
  if (/debt.?free|timeline|how long.*debt/.test(text)) return { type: "insight", insight: "timeline" };
  if (/top expense|top category|overspending|spend most/.test(text)) return { type: "insight", insight: "top_expense" };
  if (/total spending|spent.*month|spending.*month/.test(text)) return { type: "insight", insight: "monthly_spending" };
  if (/total income|income.*month|earned.*month/.test(text)) return { type: "insight", insight: "monthly_income" };
  if (/goal progress|close.*goal|how.*goal/.test(text)) return { type: "insight", insight: "goal_progress" };
  if (extra) return { type: "insight", insight: "extra_payment" };
  if (/clear debt faster|focus on this month|what should i focus|guidance|help me/.test(text)) return { type: "insight", insight: "guidance" };

  const amount = parseAmount(raw);
  const kind = actionFor(text, amount);
  if (!kind) return { type: "unknown" };
  const debt = matchedDebt(text, options.debts ?? []);
  const name = stripCommand(raw) || (kind === "expense" ? categoryFor(text, EXPENSE_RULES) : kind === "income" ? categoryFor(text, INCOME_RULES) : "");
  const rateMatch = raw.match(/\bapr\s*(\d+(?:\.\d+)?)\b/i);
  const minMatch = raw.match(/\b(?:minimum|min)\s*(\d[\d,]*(?:\.\d+)?)\b/i);
  const needs: string[] = [];
  if (!amount) needs.push("amount");
  if ((kind === "debt" || kind === "goal") && !name) needs.push("name");
  if ((kind === "expense" || kind === "income" || kind === "debt_payment") && !options.defaultAccountId) needs.push("account");
  if (kind === "debt_payment" && !debt) needs.push("debt");
  const draft: AssistantDraft = {
    kind, amount, name, category: kind === "expense" ? categoryFor(text, EXPENSE_RULES) : kind === "income" ? categoryFor(text, INCOME_RULES) : kind === "goal" ? "Personal" : "",
    accountId: options.defaultAccountId ?? null, debtId: debt?.id ?? null,
    rate: rateMatch ? Number(rateMatch[1]) : null, minimumPayment: minMatch ? Number(minMatch[1].replaceAll(",", "")) : null,
    deadline: "", date: options.today ?? new Date().toISOString().slice(0, 10), description: "", needs,
  };
  return { type: "action", draft };
}
