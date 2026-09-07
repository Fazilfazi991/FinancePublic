import { calculatePayoff, orderDebts, type Strategy } from "../debt-engine";
import { calculateAvailableBalance, formatCurrency } from "../utils";
import type { Account, Debt, Goal, Transaction } from "../store";
import type { AssistantInsight } from "./types";

export type InsightData = { accounts: Account[]; debts: Debt[]; goals: Goal[]; transactions: Transaction[]; currency: string; aedToInr: number; strategy?: Strategy; extraAmount?: number };
const sameMonth = (date: string, now: Date) => date.slice(0, 7) === now.toISOString().slice(0, 7);

export function answerInsight(kind: AssistantInsight, data: InsightData): string {
  const now = new Date();
  const active = data.debts.filter((debt) => debt.balance > 0);
  const remaining = active.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const original = data.debts.reduce((sum, debt) => sum + Number(debt.total), 0);
  const paid = Math.max(0, original - remaining);
  const month = data.transactions.filter((transaction) => sameMonth(transaction.date, now));
  const income = month.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expenses = month.filter((transaction) => transaction.type === "expense" && transaction.category !== "Debt Payment");
  const spending = expenses.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const payoffPower = Math.max(0, income - spending);
  const strategy = data.strategy ?? "avalanche";
  const engineDebts = active.map((debt) => ({ id: debt.id, balance: debt.balance, apr: debt.rate, minimumPayment: debt.minPayment }));
  const next = orderDebts(engineDebts, strategy)[0];
  const nextDebt = active.find((debt) => debt.id === next?.id);
  const payoff = calculatePayoff(engineDebts, payoffPower, strategy, now);
  const money = (value: number) => formatCurrency(value, data.currency);
  if (kind === "debt_summary") return active.length ? `You have ${money(remaining)} left from ${money(original)} of original debt. You have cleared ${money(paid)} (${original ? (paid / original * 100).toFixed(1) : "0.0"}%).` : "You have no active debt recorded.";
  if (kind === "available_balance") { const value = calculateAvailableBalance(data.accounts, data.transactions, { aedToInr: data.aedToInr }); return value.accountCount ? `Your available balance is ${money(value.balance)} across ${value.accountCount} liquid ${value.accountCount === 1 ? "account" : "accounts"}.` : "Add a current, savings, or cash account to calculate your available balance."; }
  if (kind === "payoff_power") return `Your monthly payoff power is ${money(payoffPower)}: ${money(income)} income minus ${money(spending)} living expenses this month.`;
  if (kind === "next_debt") return nextDebt ? `With the ${strategy} strategy, focus on ${nextDebt.name} next. Its remaining balance is ${money(nextDebt.balance)}${nextDebt.rate ? ` at ${nextDebt.rate}% APR` : ""}.` : "Add an active debt to build your payoff order.";
  if (kind === "strategy") return `Your current strategy is ${strategy === "avalanche" ? "Avalanche (highest interest first)" : "Snowball (smallest balance first)"}.`;
  if (kind === "timeline") return payoff.debtFreeDate ? `At your current payoff power, your estimated debt-free date is ${new Date(`${payoff.debtFreeDate}T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}.${payoff.message ? ` ${payoff.message}` : ""}` : payoff.message ?? "Add monthly income and expenses to estimate your debt-free timeline.";
  if (kind === "monthly_spending") return `You have spent ${money(spending)} on living expenses this month.`;
  if (kind === "monthly_income") return `You have recorded ${money(income)} of income this month.`;
  if (kind === "top_expense") { const grouped = new Map<string, number>(); expenses.forEach((item) => grouped.set(item.category || "Other", (grouped.get(item.category || "Other") ?? 0) + item.amount)); const top = [...grouped].sort((a, b) => b[1] - a[1])[0]; return top ? `${top[0]} is your top expense category this month at ${money(top[1])}. Your total living spend is ${money(spending)}.` : "You have no living expenses recorded this month."; }
  if (kind === "goal_progress") return data.goals.length ? data.goals.map((goal) => `${goal.name}: ${money(goal.saved)} of ${money(goal.target)} (${goal.target ? Math.min(100, goal.saved / goal.target * 100).toFixed(0) : 0}%)`).join("\n") : "You have no goals yet. Try “goal emergency fund 50000”.";
  if (kind === "extra_payment") { const extra = data.extraAmount ?? 0; const proposed = calculatePayoff(engineDebts, payoffPower + extra, strategy, now); return extra && payoff.months != null && proposed.months != null ? `Paying ${money(extra)} extra each month could shorten your estimate by ${Math.max(0, payoff.months - proposed.months)} months and save about ${money(Math.max(0, payoff.totalInterest - proposed.totalInterest))} in interest.` : "Tell me an extra monthly amount, for example: “What happens if I pay ₹5,000 extra?”"; }
  return nextDebt ? `Keep required payments current, then direct your available payoff power to ${nextDebt.name}. You currently have ${money(remaining)} of debt left and ${money(payoffPower)} of monthly payoff power.` : "Start by adding your debts, income, and essential expenses. I’ll use those records to suggest the next practical step.";
}
