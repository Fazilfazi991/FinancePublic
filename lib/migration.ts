import { useFinanceStore } from "./store";

export function runMigration() {
  try {
    const isMigrated = localStorage.getItem('financeOS_migrated_to_v14');
    if (isMigrated) return;

    const store = useFinanceStore.getState();

    const oldData = {
      debts: JSON.parse(localStorage.getItem('financeOS_debts') || '[]'),
      incomes: JSON.parse(localStorage.getItem('financeOS_incomes') || '[]'),
      projects: JSON.parse(localStorage.getItem('financeOS_projects') || '[]'),
      expenses: JSON.parse(localStorage.getItem('financeOS_expenses') || '[]'),
      goals: JSON.parse(localStorage.getItem('financeOS_goals') || '[]'),
      assets: JSON.parse(localStorage.getItem('financeOS_assets') || '[]'),
      accounts: JSON.parse(localStorage.getItem('financeOS_accounts') || '[]'),
      transactions: JSON.parse(localStorage.getItem('financeOS_transactions') || '[]'),
      settings: JSON.parse(localStorage.getItem('financeOS_settings') || '{}'),
    };

    if (Object.values(oldData).some(arr => Array.isArray(arr) ? arr.length > 0 : Object.keys(arr).length > 0)) {
      console.log('Legacy data found, migrating to v14...');
      
      if (oldData.debts.length > 0) store.setDebts(oldData.debts);
      if (oldData.incomes.length > 0) store.setIncomes(oldData.incomes);
      if (oldData.projects.length > 0) store.setProjects(oldData.projects);
      if (oldData.expenses.length > 0) store.setExpenses(oldData.expenses);
      if (oldData.goals.length > 0) store.setGoals(oldData.goals);
      if (oldData.accounts.length > 0) store.setAccounts(oldData.accounts);
      if (oldData.transactions.length > 0) store.setTransactions(oldData.transactions);
      
      if (Object.keys(oldData.settings).length > 0) {
        store.updateSettings(oldData.settings);
      }

      localStorage.setItem('financeOS_migrated_to_v14', 'true');
      console.log('Migration complete.');
    }
  } catch (error) {
    console.error('Migration failed, skipping:', error);
  }
}
