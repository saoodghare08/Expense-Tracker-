
import { Account, Transaction } from '../types';

const ACCOUNTS_KEY = 'spendwise_accounts';
const TRANSACTIONS_KEY = 'spendwise_transactions';

export const storage = {
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) {
      // Default account if none exists
      const defaultAccount: Account = {
        id: 'default-cash',
        name: 'Cash',
        type: 'cash',
        balance: 0,
        color: '#10b981'
      };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([defaultAccount]));
      return [defaultAccount];
    }
    return JSON.parse(data);
  },

  saveAccounts: (accounts: Account[]) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  },

  addTransaction: (transaction: Transaction) => {
    const transactions = storage.getTransactions();
    const accounts = storage.getAccounts();
    
    // Update account balance
    const accountIndex = accounts.findIndex(a => a.id === transaction.accountId);
    if (accountIndex !== -1) {
      if (transaction.type === 'income') {
        accounts[accountIndex].balance += transaction.amount;
      } else {
        accounts[accountIndex].balance -= transaction.amount;
      }
      storage.saveAccounts(accounts);
    }

    storage.saveTransactions([transaction, ...transactions]);
  },

  deleteTransaction: (id: string) => {
    const transactions = storage.getTransactions();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const accounts = storage.getAccounts();
    const accountIndex = accounts.findIndex(a => a.id === transaction.accountId);
    
    if (accountIndex !== -1) {
      // Reverse the balance change
      if (transaction.type === 'income') {
        accounts[accountIndex].balance -= transaction.amount;
      } else {
        accounts[accountIndex].balance += transaction.amount;
      }
      storage.saveAccounts(accounts);
    }

    storage.saveTransactions(transactions.filter(t => t.id !== id));
  },

  deleteAccount: (id: string) => {
    const accounts = storage.getAccounts();
    const transactions = storage.getTransactions();
    
    // Remove the account
    const updatedAccounts = accounts.filter(a => a.id !== id);
    storage.saveAccounts(updatedAccounts);
    
    // Remove all transactions associated with this account
    const updatedTransactions = transactions.filter(t => t.accountId !== id);
    storage.saveTransactions(updatedTransactions);
  },

  updateTransaction: (updatedTransaction: Transaction) => {
    const transactions = storage.getTransactions();
    const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!oldTransaction) return;

    // First delete old transaction impact
    storage.deleteTransaction(oldTransaction.id);
    // Then add new transaction
    storage.addTransaction(updatedTransaction);
  }
};
