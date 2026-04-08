
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'other';
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export const CATEGORIES = {
  expense: [
    'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Education', 'Other'
  ],
  income: [
    'Salary', 'Business', 'Gift', 'Investment', 'Other'
  ]
};

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'other', label: 'Other' }
];

export const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'
];
