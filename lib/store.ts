import { create } from 'zustand';
import { isDemoId } from './demo-data';

export interface Debt {
  id: string;
  name: string;
  total: number;
  balance: number;
  rate: number;
  minPayment: number;
  notes?: string;
  color: string;
}

export interface Income {
  id: string;
  name: string;
  type: 'Business' | 'Freelance' | 'placeholder';
  status: 'active' | 'coming_soon';
  currency: string | null;
  expectedMonthly: number;
  actualThisMonth: number;
  notes: string;
  color: string;
  icon: string;
  linkedAccountId: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  value: number;
  received: number;
  status: 'pending' | 'in-progress' | 'invoiced' | 'paid';
}

export interface Expense {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  category: string;
  date?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  description?: string;
  category?: string;
  manualProgress?: number;
  createdAt: string;
  notes?: string;
  lastUpdated?: string;
  currentMilestone?: number;
  totalMilestones?: number;
  milestoneValue?: number;
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: 'savings' | 'current' | 'credit' | 'cash' | 'investment' | 'receivable';
  currency: string;
  openingBalance: number;
  color: string;
  createdAt: string;
  isDefault?: boolean;
  notes?: string;
  tag?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  accountId: string;
  toAccountId?: string;
  category: string;
  description: string;
  date: string;
  currency: string;
  createdAt: string;
  incomeStreamId?: string;
  notes?: string;
  tags?: string[];
}

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  expenses: Expense[];
  incomes: Income[];
  projects: Project[];
  loaded: boolean;
  demoMode: boolean;
  rates: {
    base: string;
    rates: Record<string, number>;
    updated: number;
  };
  settings: {
    currency: string;
    secondaryCurrency: string;
    aedToInr: number;
    theme: 'system' | 'light' | 'dark';
    name: string;
    accentColor: string;
    onboarded: boolean;
    onboarding: { currentStep:number; debtCompleted:boolean; incomeCompleted:boolean; expensesCompleted:boolean; payoffSeen:boolean };
    currencySetupComplete: boolean;
    migrated_real_data: boolean;
  };

  // Hydrate from API
  hydrate: (data: Partial<FinanceState>) => void;
  loadDemoData: () => Promise<boolean>;
  removeDemoData: () => Promise<void>;
  resetDemoData: () => Promise<void>;

  // Setters (local state only — used during hydrate)
  setDebts: (debts: Debt[]) => void;
  setIncomes: (incomes: Income[]) => void;
  setProjects: (projects: Project[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setGoals: (goals: Goal[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setRates: (rates: FinanceState['rates']) => void;

  // CRUD actions — update local state + call API
  addTransaction: (txn: Transaction) => Promise<Transaction>;
  recordDebtPayment: (debtId: string, accountId: string, amount: number, date: string, notes?: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, txn: Transaction) => Promise<Transaction>;

  addAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  updateAccount: (id: string, acc: Partial<Account>) => void;

  addDebt: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;

  addGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;

  addIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;

  deleteProject: (id: string) => void;
  updateProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;

  updateSettings: (settings: Partial<FinanceState['settings']>) => void;
  setSettings: (settings: Partial<FinanceState['settings']>) => void;
  receiveReceivable: (receivableId: string, toAccountId: string, amount: number) => void;
}

// Helper to fire-and-forget API calls (no await blocking UI)
const api = {
  post: (url: string, body: any) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(console.error),
  put: (url: string, body: any) => fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(console.error),
  del: (url: string) => fetch(url, { method: 'DELETE' }).catch(console.error),
};

export const useFinanceStore = create<FinanceState>()(
  (set, get) => ({
    accounts: [],
    transactions: [],
    debts: [],
    goals: [],
    expenses: [],
    incomes: [],
    projects: [],
    loaded: false,
    demoMode: false,
    rates: { base: 'USD', rates: { INR: 83.5, AED: 3.67, EUR: 0.92, USD: 1 }, updated: 0 },
    settings: {
      currency: 'INR',
      secondaryCurrency: 'AED',
      aedToInr: 26,
      theme: 'system',
      name: 'User',
      accentColor: '#10b981',
      onboarded: false,
      onboarding: { currentStep:1, debtCompleted:false, incomeCompleted:false, expensesCompleted:false, payoffSeen:false },
      currencySetupComplete: false,
      migrated_real_data: false,
    },

    hydrate: (data) => set({ ...data, loaded: true }),

    loadDemoData: async () => {
      const state = get();
      const isEmpty = !state.accounts.length && !state.transactions.length && !state.debts.length && !state.goals.length && !state.expenses.length && !state.incomes.length && !state.projects.length;
      if (!isEmpty) return false;
      const response=await fetch('/api/demo',{method:'POST'}); if(!response.ok)return false;
      const workspaceResponse=await fetch('/api/workspace',{cache:'no-store'});if(!workspaceResponse.ok)return false;
      const workspace=await workspaceResponse.json();
      set({...workspace,demoMode:[...workspace.debts,...workspace.accounts,...workspace.transactions,...workspace.incomes,...workspace.goals,...workspace.expenses].some((item:{isDemo?:boolean})=>item.isDemo),loaded:true});
      return true;
    },
    removeDemoData: async () => {
      const response=await fetch('/api/demo',{method:'DELETE'});if(!response.ok)throw new Error('Unable to remove sample data.');
      set({accounts:[],transactions:[],debts:[],goals:[],expenses:[],incomes:[],demoMode:false});
    },
    resetDemoData: async () => {
      if(!get().demoMode)return;const response=await fetch('/api/demo',{method:'PUT'});if(!response.ok)throw new Error('Unable to reset sample data.');const workspaceResponse=await fetch('/api/workspace',{cache:'no-store'});if(!workspaceResponse.ok)throw new Error('Unable to refresh sample data.');const workspace=await workspaceResponse.json();set({...workspace,demoMode:true,loaded:true});
    },

    setDebts: (debts) => set({ debts }),
    setIncomes: (incomes) => set({ incomes }),
    setProjects: (projects) => set({ projects }),
    setExpenses: (expenses) => set({ expenses }),
    setGoals: (goals) => set({ goals }),
    setAccounts: (accounts) => set({ accounts }),
    setTransactions: (transactions) => set({ transactions }),
    setRates: (rates) => set({ rates }),

    // Transactions
    addTransaction: async (txn) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txn, idempotencyKey: txn.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'The transaction could not be saved.');
      const saved: Transaction = {
        id: result.id,
        type: result.type,
        amount: Number(result.amount),
        accountId: result.account_id,
        toAccountId: result.to_account_id ?? undefined,
        category: result.category,
        description: result.description,
        date: result.transaction_date,
        currency: result.currency,
        createdAt: result.created_at,
        incomeStreamId: result.income_stream_id ?? undefined,
        notes: result.notes ?? '',
      };
      set((state) => ({ transactions: [saved, ...state.transactions.filter(item => item.id !== saved.id)] }));
      return saved;
    },
    recordDebtPayment: async (debtId, accountId, amount, date, notes = '') => {
      const state = get();
      const debt = state.debts.find(item => item.id === debtId);
      const account = state.accounts.find(item => item.id === accountId);
      if (!debt || !account || amount <= 0 || amount > debt.balance) throw new Error('Enter a valid payment amount.');
      const idempotencyKey=crypto.randomUUID();
      const response = await fetch('/api/debt-payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({debtId,accountId,amount,date,notes,idempotencyKey})});
      const result=await response.json(); if(!response.ok) throw new Error(result?.error?.message||'The payment could not be recorded.');
      const d=result.debt,t=result.transaction;
      const updatedDebt={...debt,total:Number(d.original_amount),balance:Number(d.balance),rate:d.apr==null?0:Number(d.apr),minPayment:d.minimum_payment==null?0:Number(d.minimum_payment)};
      const txn:Transaction={id:t.id,type:t.type,amount:Number(t.amount),accountId:t.account_id,category:t.category,description:t.description,date:t.transaction_date,currency:t.currency,createdAt:t.created_at,notes:t.notes??''};
      set(current=>({transactions:[txn,...current.transactions],debts:current.debts.map(item=>item.id===debtId?updatedDebt:item)}));
    },
    deleteTransaction: async (id) => {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'The transaction could not be deleted.');
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id),
        debts: result.debt ? state.debts.map(debt => debt.id === result.debt.id ? {
          ...debt, balance: Number(result.debt.balance), total: Number(result.debt.original_amount),
        } : debt) : state.debts,
      }));
    },
    updateTransaction: async (id, txn) => {
      const response = await fetch(`/api/transactions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txn) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'The transaction could not be updated.');
      const row = result.transaction;
      const saved: Transaction = { id: row.id, type: row.type, amount: Number(row.amount), accountId: row.account_id,
        toAccountId: row.to_account_id ?? undefined, category: row.category, description: row.description,
        date: row.transaction_date, currency: row.currency, createdAt: row.created_at,
        incomeStreamId: row.income_stream_id ?? undefined, notes: row.notes ?? '' };
      set((state) => ({
        transactions: state.transactions.map(item => item.id === id ? saved : item),
        debts: result.debt ? state.debts.map(debt => debt.id === result.debt.id ? {
          ...debt, balance: Number(result.debt.balance), total: Number(result.debt.original_amount),
        } : debt) : state.debts,
      }));
      return saved;
    },

    // Accounts
    addAccount: (acc) => {
      set((state) => ({ accounts: [...state.accounts.map(item => acc.isDefault ? { ...item, isDefault: false } : item), acc] }));
      api.post('/api/accounts', acc);
    },
    deleteAccount: (id) => {
      set((state) => ({ accounts: state.accounts.filter(a => a.id !== id) }));
      if (!isDemoId(id)) api.del(`/api/accounts/${id}`);
    },
    updateAccount: (id, updatedAcc) => {
      const full = get().accounts.find(a => a.id === id);
      set((state) => ({ accounts: state.accounts.map(a => a.id === id ? { ...a, ...updatedAcc } : updatedAcc.isDefault ? { ...a, isDefault: false } : a) }));
      if (full && !isDemoId(id)) api.put(`/api/accounts/${id}`, { ...full, ...updatedAcc });
    },

    // Debts
    addDebt: (debt) => {
      set((state) => ({ debts: [...state.debts, debt] }));
      api.post('/api/debts', debt);
    },
    deleteDebt: (id) => {
      set((state) => ({ debts: state.debts.filter(d => d.id !== id) }));
      if (!isDemoId(id)) api.del(`/api/debts/${id}`);
    },
    updateDebt: (id, updatedDebt) => {
      const full = get().debts.find(d => d.id === id);
      set((state) => ({ debts: state.debts.map(d => d.id === id ? { ...d, ...updatedDebt } : d) }));
      if (full && !isDemoId(id)) api.put(`/api/debts/${id}`, { ...full, ...updatedDebt });
    },

    // Goals
    addGoal: (goal) => {
      set((state) => ({ goals: [...state.goals, goal] }));
      api.post('/api/goals', goal);
    },
    deleteGoal: (id) => {
      set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
      if (!isDemoId(id)) api.del(`/api/goals/${id}`);
    },
    updateGoal: (id, updatedGoal) => {
      const full = get().goals.find(g => g.id === id);
      set((state) => ({ goals: state.goals.map(g => g.id === id ? { ...g, ...updatedGoal } : g) }));
      if (full && !isDemoId(id)) api.put(`/api/goals/${id}`, { ...full, ...updatedGoal });
    },

    // Incomes
    addIncome: (income) => {
      set((state) => ({ incomes: [...state.incomes, income] }));
      api.post('/api/incomes', income);
    },
    deleteIncome: (id) => {
      set((state) => ({ incomes: state.incomes.filter(i => i.id !== id) }));
      if (!isDemoId(id)) api.del(`/api/incomes/${id}`);
    },
    updateIncome: (id, updatedIncome) => {
      const full = get().incomes.find(i => i.id === id);
      set((state) => ({ incomes: state.incomes.map(i => i.id === id ? { ...i, ...updatedIncome } : i) }));
      if (full && !isDemoId(id)) api.put(`/api/incomes/${id}`, { ...full, ...updatedIncome });
    },

    // Projects (local-only for now)
    deleteProject: (id) => set((state) => ({ projects: state.projects.filter(p => p.id !== id) })),
    updateProjectStatus: (id, status) => set((state) => ({
      projects: state.projects.map(p => p.id === id ? { ...p, status } : p)
    })),
    updateProject: (updatedProject) => set((state) => ({
      projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    })),

    // Settings
    updateSettings: (newSettings) => {
      set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      api.put('/api/settings', newSettings);
    },
    setSettings: (newSettings) => {
      set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      api.put('/api/settings', newSettings);
    },

    // Receivable
    receiveReceivable: (receivableId, toAccountId, amount) => set((state) => {
      const receivable = state.accounts.find(a => a.id === receivableId);
      if (!receivable) return state;
      const txn: Transaction = {
        id: crypto.randomUUID(), accountId: toAccountId, amount, type: 'income',
        category: 'Receivable Payment', description: `Payment received from ${receivable.name}`,
        date: new Date().toISOString().split('T')[0], currency: receivable.currency,
        createdAt: new Date().toISOString()
      };
      const balancingTxn: Transaction = {
        id: crypto.randomUUID(), accountId: receivableId, amount, type: 'expense',
        category: 'Receivable Settled', description: `Settled and moved to ${state.accounts.find(a => a.id === toAccountId)?.name}`,
        date: new Date().toISOString().split('T')[0], currency: receivable.currency,
        createdAt: new Date().toISOString()
      };
      api.post('/api/transactions', txn);
      api.post('/api/transactions', balancingTxn);
      return { transactions: [txn, balancingTxn, ...state.transactions] };
    }),

  })
);
