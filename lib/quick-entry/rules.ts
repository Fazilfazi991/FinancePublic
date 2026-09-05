export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transport', 'Fuel', 'Housing',
  'Bills & Utilities', 'Shopping', 'Entertainment', 'Health',
  'Education', 'Travel', 'Subscriptions', 'Other',
] as const;

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment', 'Other'] as const;

export const EXPENSE_RULES: ReadonlyArray<[string, readonly string[]]> = [
  ['Food & Dining', ['biryani', 'biriyani', 'shawarma', 'burger', 'pizza', 'restaurant', 'cafe', 'coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'snack', 'meal', 'food', 'juice', 'bakery', 'hotel food', 'takeaway', 'delivery', 'zomato', 'swiggy']],
  ['Groceries', ['grocery', 'groceries', 'supermarket', 'vegetable', 'vegetables', 'fruit', 'fruits', 'milk']],
  ['Fuel', ['gas station', 'fuel', 'petrol', 'diesel']],
  ['Transport', ['uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'parking', 'toll', 'ride', 'transport']],
  ['Housing', ['rent', 'housing']],
  ['Bills & Utilities', ['electricity', 'water bill', 'internet', 'wifi', 'mobile bill', 'phone bill', 'utility', 'utilities', 'gas bill']],
  ['Subscriptions', ['youtube premium', 'google one', 'netflix', 'spotify', 'prime', 'subscription', 'icloud']],
  ['Shopping', ['shopping', 'clothes', 'clothing', 'shirt', 'shoes', 'amazon', 'flipkart', 'myntra']],
  ['Entertainment', ['movie', 'cinema', 'entertainment']],
  ['Health', ['doctor', 'hospital', 'medicine', 'pharmacy', 'clinic', 'medical', 'health']],
  ['Education', ['course', 'tuition', 'education']],
  ['Travel', ['flight', 'hotel', 'travel']],
];

export const INCOME_RULES: ReadonlyArray<[string, readonly string[]]> = [
  ['Salary', ['salary']],
  ['Freelance', ['freelance']],
  ['Business', ['business']],
  ['Bonus', ['bonus']],
  ['Investment', ['dividend', 'investment', 'interest income']],
];
