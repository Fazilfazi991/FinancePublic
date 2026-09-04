import type { Account, Debt, Expense, Goal, Income, Transaction } from "@/lib/store";

export const DEMO_PREFIX = "demo-";
export const DEMO_STORAGE_KEY = "finance-demo-workspace-v1";

export interface DemoWorkspace {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  expenses: Expense[];
  incomes: Income[];
}

const isoDay = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  if (offset <= 0 && offset > -30) date.setDate(Math.max(1, date.getDate() + offset));
  else date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const createdAt = (offset: number) => `${isoDay(offset)}T12:00:00.000Z`;

export function createDemoWorkspace(): DemoWorkspace {
  const accounts: Account[] = [
    { id: "demo-account-checking", name: "Main Checking", institution: "Community Bank", type: "current", currency: "USD", openingBalance: -98.65, color: "#10b981", createdAt: createdAt(-120), isDefault: true },
    { id: "demo-account-savings", name: "Savings", institution: "Community Bank", type: "savings", currency: "USD", openingBalance: 7900, color: "#38bdf8", createdAt: createdAt(-180) },
    { id: "demo-account-cash", name: "Cash", institution: "Wallet", type: "cash", currency: "USD", openingBalance: 180, color: "#f59e0b", createdAt: createdAt(-60) },
    { id: "demo-account-investments", name: "Investments", institution: "Sample Brokerage", type: "investment", currency: "USD", openingBalance: 12750, color: "#8b5cf6", createdAt: createdAt(-240) },
    { id: "demo-account-card", name: "Credit Card", institution: "Sample Credit Union", type: "credit", currency: "USD", openingBalance: -685.26, color: "#f43f5e", createdAt: createdAt(-150) },
  ];

  const rows: Array<[string, Transaction["type"], number, string, string, string, number, string?]> = [
    ["salary", "income", 4800, "demo-account-checking", "Income", "Salary", -3],
    ["freelance", "income", 650, "demo-account-checking", "Freelance", "Freelance payment", -5],
    ["rent", "expense", 1350, "demo-account-checking", "Bills", "Rent", -2],
    ["groceries", "expense", 112.4, "demo-account-checking", "Food & Dining", "Groceries", -4],
    ["fuel", "expense", 68.2, "demo-account-checking", "Transport", "Fuel", -6],
    ["coffee", "expense", 7.5, "demo-account-checking", "Food & Dining", "Coffee", -7],
    ["netflix", "expense", 15.99, "demo-account-card", "Entertainment", "Netflix", -8],
    ["electricity", "expense", 94.1, "demo-account-checking", "Bills", "Electricity", -9],
    ["dining", "expense", 72.6, "demo-account-card", "Food & Dining", "Dining", -10],
    ["shopping", "expense", 125, "demo-account-card", "Shopping", "Shopping", -11],
    ["savings", "transfer", 500, "demo-account-checking", "Transfer", "Monthly savings", -12, "demo-account-savings"],
    ["pharmacy", "expense", 36.75, "demo-account-card", "Other", "Pharmacy", -14],
    ["previous-salary", "income", 4800, "demo-account-checking", "Income", "Salary", -33],
    ["previous-rent", "expense", 1350, "demo-account-checking", "Bills", "Rent", -32],
    ["previous-groceries", "expense", 286.35, "demo-account-checking", "Food & Dining", "Groceries", -36],
    ["previous-transport", "expense", 132.8, "demo-account-checking", "Transport", "Transport", -39],
    ["previous-entertainment", "expense", 84.5, "demo-account-card", "Entertainment", "Movie night", -42],
    ["previous-shopping", "expense", 219.9, "demo-account-card", "Shopping", "Household shopping", -45],
  ];
  const transactions = rows.map(([id, type, amount, accountId, category, description, offset, toAccountId]) => ({
    id: `demo-transaction-${id}`, type, amount, accountId, toAccountId, category, description,
    date: isoDay(offset), currency: "USD", createdAt: createdAt(offset), notes: "Fictional sample transaction",
  }));

  const expenses: Expense[] = [
    ["food", "Food & Dining", 800], ["transport", "Transport", 450], ["shopping", "Shopping", 500],
    ["bills", "Bills", 1600], ["entertainment", "Entertainment", 250], ["other", "Other", 400],
  ].map(([id, name, budgeted]) => ({ id: `demo-budget-${id}`, name: String(name), category: String(name), budgeted: Number(budgeted), spent: 0 }));

  const goals: Goal[] = [
    ["emergency", "Emergency Fund", 10000, 7200, 270], ["vacation", "Vacation", 4000, 1800, 180], ["car", "New Car", 15000, 3500, 540],
  ].map(([id, name, target, saved, days]) => ({ id: `demo-goal-${id}`, name: String(name), target: Number(target), saved: Number(saved), deadline: isoDay(Number(days)), category: "Savings", description: "Fictional sample goal", createdAt: createdAt(-90), lastUpdated: createdAt(-2) }));

  const debts: Debt[] = [
    { id: "demo-debt-card", name: "Credit Card", total: 2500, balance: 1240, rate: 18.9, minPayment: 75, notes: "Fictional sample debt", color: "#f43f5e" },
    { id: "demo-debt-loan", name: "Personal Loan", total: 12000, balance: 8700, rate: 7.5, minPayment: 310, notes: "Fictional sample debt", color: "#f59e0b" },
  ];

  const incomes: Income[] = [
    { id: "demo-income-salary", name: "Salary", type: "Business", status: "active", currency: "USD", expectedMonthly: 4800, actualThisMonth: 4800, notes: "Fictional sample income", color: "#10b981", icon: "briefcase", linkedAccountId: "demo-account-checking" },
    { id: "demo-income-freelance", name: "Freelance", type: "Freelance", status: "active", currency: "USD", expectedMonthly: 650, actualThisMonth: 650, notes: "Fictional sample income", color: "#38bdf8", icon: "code", linkedAccountId: "demo-account-checking" },
  ];

  return { accounts, transactions, debts, goals, expenses, incomes };
}

export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX);

export function saveDemoWorkspace(workspace: DemoWorkspace, previousCurrency: string) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ workspace, previousCurrency }));
}

export function readDemoWorkspace(): { workspace: DemoWorkspace; previousCurrency: string } | null {
  try {
    const value = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    const collections = Object.values(parsed.workspace || {}) as Array<Array<{ id?: string }>>;
    if (!collections.length || collections.some(items => !Array.isArray(items) || items.some(item => !item.id?.startsWith(DEMO_PREFIX)))) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDemoWorkspace() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}
