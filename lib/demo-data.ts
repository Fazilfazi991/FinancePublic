import type { Account, Debt, Expense, Goal, Income, Transaction } from "@/lib/store";

export const DEMO_PREFIX = "demo-";
export const DEMO_STORAGE_KEY = "finance-demo-workspace-v2";
const LEGACY_DEMO_STORAGE_KEY = "finance-demo-workspace-v1";

export interface DemoWorkspace { accounts: Account[]; transactions: Transaction[]; debts: Debt[]; goals: Goal[]; expenses: Expense[]; incomes: Income[] }

const monthDate = (monthOffset: number, preferredDay: number) => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1, 12);
  const maxDay = monthOffset === 0 ? today.getDate() : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(preferredDay, maxDay));
  return date.toISOString().slice(0, 10);
};
const timestamp = (date: string) => `${date}T12:00:00.000Z`;

export function createDemoWorkspace(): DemoWorkspace {
  const accounts: Account[] = [
    { id: "demo-account-main", name: "Main Bank", institution: "Sample Bank", type: "current", currency: "INR", openingBalance: 79000, color: "#10b981", createdAt: timestamp(monthDate(-4, 1)), isDefault: true },
    { id: "demo-account-savings", name: "Savings", institution: "Sample Bank", type: "savings", currency: "INR", openingBalance: 120000, color: "#38bdf8", createdAt: timestamp(monthDate(-6, 1)) },
    { id: "demo-account-cash", name: "Cash", institution: "Wallet", type: "cash", currency: "INR", openingBalance: 12500, color: "#f59e0b", createdAt: timestamp(monthDate(-3, 1)) },
  ];

  const rows: Array<[string, Transaction["type"], number, string, string, number, number]> = [
    ["salary", "income", 120000, "Income", "Salary", 0, 1], ["freelance", "income", 25000, "Freelance", "Freelance payment", 0, 2],
    ["rent", "expense", 25000, "Housing", "Rent", 0, 2], ["groceries", "expense", 12000, "Food & Dining", "Groceries", 0, 3],
    ["transport", "expense", 8000, "Transport", "Transport", 0, 4], ["utilities", "expense", 6000, "Utilities", "Utilities", 0, 5],
    ["subscriptions", "expense", 2000, "Entertainment", "Subscriptions", 0, 6], ["living", "expense", 10000, "Other", "Other living costs", 0, 7],
    ["debt-card", "expense", 18000, "Debt Payment", "Payment · Credit Card", 0, 8], ["debt-gold", "expense", 14000, "Debt Payment", "Payment · Gold Loan", 0, 9],
    ["prev-salary", "income", 120000, "Income", "Salary", -1, 1], ["prev-freelance", "income", 25000, "Freelance", "Freelance payment", -1, 3],
    ["prev-rent", "expense", 25000, "Housing", "Rent", -1, 2], ["prev-groceries", "expense", 13000, "Food & Dining", "Groceries", -1, 6],
    ["prev-transport", "expense", 8000, "Transport", "Transport", -1, 9], ["prev-utilities", "expense", 7000, "Utilities", "Utilities", -1, 12],
    ["prev-subscriptions", "expense", 2000, "Entertainment", "Subscriptions", -1, 15], ["prev-living", "expense", 10000, "Other", "Other living costs", -1, 18],
    ["prev-debt-card", "expense", 14000, "Debt Payment", "Payment · Credit Card", -1, 20], ["prev-debt-loan", "expense", 10000, "Debt Payment", "Payment · Personal Loan", -1, 22],
  ];
  const transactions: Transaction[] = rows.map(([id,type,amount,category,description,month,day]) => {
    const date=monthDate(month,day); return { id:`demo-transaction-${id}`,type,amount,accountId:"demo-account-main",category,description,date,currency:"INR",createdAt:timestamp(date),notes:"Fictional sample transaction" };
  });

  const debts: Debt[] = [
    { id:"demo-debt-card",name:"Credit Card",total:120000,balance:58000,rate:18.9,minPayment:5000,notes:"Fictional sample debt",color:"#f43f5e" },
    { id:"demo-debt-personal",name:"Personal Loan",total:600000,balance:440000,rate:10.5,minPayment:18000,notes:"Fictional sample debt",color:"#f59e0b" },
    { id:"demo-debt-gold",name:"Gold Loan",total:300000,balance:210000,rate:11.5,minPayment:10000,notes:"Fictional sample debt",color:"#eab308" },
    { id:"demo-debt-education",name:"Education Loan",total:500000,balance:360000,rate:8.5,minPayment:12000,notes:"Fictional sample debt",color:"#8b5cf6" },
  ];
  const expenses: Expense[] = [["housing","Housing",25000],["food","Food & Dining",12000],["transport","Transport",8000],["utilities","Utilities",6000],["subscriptions","Entertainment",2000],["other","Other",10000]].map(([id,name,budgeted])=>({id:`demo-budget-${id}`,name:String(name),category:String(name),budgeted:Number(budgeted),spent:0}));
  const date=monthDate(0,1);
  const goals: Goal[] = [{ id:"demo-goal-emergency",name:"Emergency Fund",target:300000,saved:120000,deadline:monthDate(8,1),category:"Financial safety",description:"A buffer for unexpected expenses",createdAt:timestamp(monthDate(-3,1)),lastUpdated:timestamp(date) }];
  const incomes: Income[] = [
    { id:"demo-income-salary",name:"Salary",type:"Business",status:"active",currency:"INR",expectedMonthly:120000,actualThisMonth:120000,notes:"Fictional sample income",color:"#10b981",icon:"briefcase",linkedAccountId:"demo-account-main" },
    { id:"demo-income-freelance",name:"Freelance",type:"Freelance",status:"active",currency:"INR",expectedMonthly:25000,actualThisMonth:25000,notes:"Fictional sample income",color:"#38bdf8",icon:"code",linkedAccountId:"demo-account-main" },
  ];
  return { accounts,transactions,debts,goals,expenses,incomes };
}

export const isDemoId = (id:string) => id.startsWith(DEMO_PREFIX);
export function saveDemoWorkspace(workspace:DemoWorkspace,previousCurrency:string){localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify({workspace,previousCurrency}))}
export function readDemoWorkspace():{workspace:DemoWorkspace;previousCurrency:string}|null{
  try{
    const current=localStorage.getItem(DEMO_STORAGE_KEY),legacy=localStorage.getItem(LEGACY_DEMO_STORAGE_KEY);
    if(!current&&legacy){const previousCurrency=JSON.parse(legacy).previousCurrency||"INR",workspace=createDemoWorkspace();saveDemoWorkspace(workspace,previousCurrency);localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);return{workspace,previousCurrency}}
    if(!current)return null;
    const parsed=JSON.parse(current),collections=Object.values(parsed.workspace||{}) as Array<Array<{id?:string}>>;
    if(!collections.length||collections.some(items=>!Array.isArray(items)||items.some(item=>!item.id?.startsWith(DEMO_PREFIX))))return null;
    return parsed;
  }catch{return null}
}
export function clearDemoWorkspace(){localStorage.removeItem(DEMO_STORAGE_KEY);localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY)}
