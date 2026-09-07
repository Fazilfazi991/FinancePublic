export type AssistantAction = "expense" | "income" | "debt" | "goal" | "debt_payment";

export type AssistantDraft = {
  kind: AssistantAction;
  amount: number | null;
  name: string;
  category: string;
  accountId: string | null;
  debtId: string | null;
  rate: number | null;
  minimumPayment: number | null;
  deadline: string;
  date: string;
  description: string;
  needs: string[];
};

export type AssistantIntent =
  | { type: "action"; draft: AssistantDraft }
  | { type: "insight"; insight: AssistantInsight }
  | { type: "unknown" };

export type AssistantInsight =
  | "debt_summary" | "available_balance" | "payoff_power" | "next_debt"
  | "strategy" | "timeline" | "top_expense" | "monthly_spending"
  | "monthly_income" | "goal_progress" | "extra_payment" | "guidance";
