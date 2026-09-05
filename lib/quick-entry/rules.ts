export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transport', 'Fuel', 'Housing',
  'Bills & Utilities', 'Shopping', 'Entertainment', 'Health',
  'Education', 'Travel', 'Subscriptions', 'Other',
] as const;

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment', 'Other'] as const;

export const EXPENSE_RULES: ReadonlyArray<[string, readonly string[]]> = [
  ['Food & Dining', ['biryani', 'lunch', 'dinner', 'breakfast', 'coffee', 'restaurant', 'food']],
  ['Groceries', ['grocery', 'groceries', 'supermarket']],
  ['Fuel', ['fuel', 'petrol', 'diesel']],
  ['Transport', ['uber', 'taxi', 'metro', 'bus', 'transport']],
  ['Housing', ['rent', 'housing']],
  ['Bills & Utilities', ['electricity', 'utility', 'utilities', 'water bill', 'internet bill', 'phone bill']],
  ['Shopping', ['shopping', 'clothes', 'clothing']],
  ['Entertainment', ['movie', 'cinema', 'entertainment']],
  ['Health', ['doctor', 'medicine', 'medical', 'health']],
  ['Education', ['course', 'tuition', 'education']],
  ['Travel', ['flight', 'hotel', 'travel']],
  ['Subscriptions', ['subscription', 'netflix', 'spotify']],
];

export const INCOME_RULES: ReadonlyArray<[string, readonly string[]]> = [
  ['Salary', ['salary']],
  ['Freelance', ['freelance']],
  ['Business', ['business']],
  ['Bonus', ['bonus']],
  ['Investment', ['dividend', 'investment', 'interest income']],
];
