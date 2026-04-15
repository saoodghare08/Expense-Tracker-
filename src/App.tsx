import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, History, CreditCard, Banknote, MoreHorizontal, Pencil, Trash2, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subMonths } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { storage } from './lib/storage';
import { Account, Transaction, CATEGORIES, ACCOUNT_TYPES, COLORS, TransactionType } from './types';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingAccountDelete, setIsConfirmingAccountDelete] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form states
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Account form states
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'credit' | 'other'>('cash');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => {
    loadData();
    const savedFilters = storage.getFilters();
    if (savedFilters) {
      setFilterCategory(savedFilters.category);
      setFilterStartDate(savedFilters.startDate);
      setFilterEndDate(savedFilters.endDate);
    }
  }, []);

  useEffect(() => {
    storage.saveFilters({
      category: filterCategory,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
  }, [filterCategory, filterStartDate, filterEndDate]);

  const loadData = () => {
    const loadedAccounts = storage.getAccounts();
    const loadedTransactions = storage.getTransactions();
    setAccounts(loadedAccounts);
    setTransactions(loadedTransactions);
    if (loadedAccounts.length > 0) {
      setAccountId(loadedAccounts[0].id);
    }
  };

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isWithinDate = t.date >= filterStartDate && t.date <= filterEndDate;
      const isCategoryMatch = filterCategory === 'all' || t.category === filterCategory;
      return isWithinDate && isCategoryMatch;
    });
  }, [transactions, filterStartDate, filterEndDate, filterCategory]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(CATEGORIES).forEach(list => list.forEach(c => cats.add(c)));
    return Array.from(cats);
  }, []);

  const summaryStats = useMemo(() => {
    return filteredTransactions.reduce((stats, t) => {
      if (t.type === 'income') stats.income += t.amount;
      else stats.expense += t.amount;
      return stats;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: editingTransaction?.id || crypto.randomUUID(),
      accountId,
      type,
      amount: parseFloat(amount),
      category,
      date,
      note
    };

    if (editingTransaction) {
      storage.updateTransaction(newTransaction);
    } else {
      storage.addTransaction(newTransaction);
    }

    loadData();
    resetTransactionForm();
    setIsAddTransactionOpen(false);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      const updatedAccounts = accounts.map(a => 
        a.id === editingAccount.id 
          ? { ...a, name: accountName, type: accountType } 
          : a
      );
      storage.saveAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
    } else {
      const newAccount: Account = {
        id: crypto.randomUUID(),
        name: accountName,
        type: accountType,
        balance: parseFloat(initialBalance) || 0,
        color: COLORS[accounts.length % COLORS.length]
      };
      const updatedAccounts = [...accounts, newAccount];
      storage.saveAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
    }
    
    resetAccountForm();
    setIsAddAccountOpen(false);
  };

  const resetTransactionForm = () => {
    setAmount('');
    setType('expense');
    setCategory('');
    setNote('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingTransaction(null);
    setIsConfirmingDelete(false);
  };

  const resetAccountForm = () => {
    setAccountName('');
    setAccountType('cash');
    setInitialBalance('');
    setEditingAccount(null);
    setIsConfirmingAccountDelete(false);
  };

  const openEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setAmount(t.amount.toString());
    setType(t.type);
    setAccountId(t.accountId);
    setCategory(t.category);
    setNote(t.note || '');
    setDate(t.date);
    setIsAddTransactionOpen(true);
  };

  const openEditAccount = (a: Account) => {
    setEditingAccount(a);
    setAccountName(a.name);
    setAccountType(a.type);
    setInitialBalance(a.balance.toString());
    setIsAddAccountOpen(true);
  };

  const deleteTransaction = (id: string) => {
    storage.deleteTransaction(id);
    loadData();
    resetTransactionForm();
    setIsConfirmingDelete(false);
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    storage.deleteAccount(id);
    loadData();
    resetAccountForm();
    setIsConfirmingAccountDelete(false);
  };

  const getAccountName = (id: string) => {
    return accounts.find(a => a.id === id)?.name || 'Unknown';
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Banknote className="w-4 h-4" />;
      case 'credit': return <CreditCard className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 pt-8 pb-6 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Balance</h1>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">SpendWise</Badge>
        </div>
        <div className="text-4xl font-bold tracking-tight">
          ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Filtered Summary */}
        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-lg shadow-emerald-100">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <ArrowUpCircle className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
            </div>
            <div className="text-xl font-bold">
              ${summaryStats.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-rose-500 p-4 rounded-3xl text-white shadow-lg shadow-rose-100">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <ArrowDownCircle className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Expense</span>
            </div>
            <div className="text-xl font-bold">
              ${summaryStats.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Accounts
            </h2>
            <Dialog open={isAddAccountOpen} onOpenChange={(open) => {
              setIsAddAccountOpen(open);
              if (!open) resetAccountForm();
            }}>
              <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 px-2 text-xs" />}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAccount} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="acc-name">Account Name</Label>
                    <Input id="acc-name" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. My Wallet" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc-type">Type</Label>
                    <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                      <SelectTrigger>
                        <SelectValue>
                          {ACCOUNT_TYPES.find(t => t.value === accountType)?.label || "Select type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!editingAccount && (
                    <div className="space-y-2">
                      <Label htmlFor="acc-balance">Initial Balance</Label>
                      <Input id="acc-balance" type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" />
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full">{editingAccount ? 'Update' : 'Create'} Account</Button>
                    {editingAccount && (
                      <div className="space-y-2">
                        {isConfirmingAccountDelete ? (
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              className="flex-1" 
                              onClick={() => {
                                deleteAccount(editingAccount.id);
                                setIsAddAccountOpen(false);
                              }}
                            >
                              Confirm Delete
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1" 
                              onClick={() => setIsConfirmingAccountDelete(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="w-full text-rose-500" 
                            onClick={() => setIsConfirmingAccountDelete(true)}
                            disabled={accounts.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                          </Button>
                        )}
                        {accounts.length <= 1 && (
                          <p className="text-[10px] text-zinc-400 text-center">You must have at least one account.</p>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-4 px-2">
              {accounts.map(account => (
                <Card 
                  key={account.id} 
                  className="w-40 shrink-0 border-none shadow-md relative group/acc active:scale-95 transition-transform cursor-pointer" 
                  style={{ borderLeft: `4px solid ${account.color}` }}
                  onClick={() => openEditAccount(account)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-zinc-500">
                        {getAccountIcon(account.type)}
                        <span className="text-[10px] font-semibold uppercase truncate max-w-[100px]">{account.name}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold truncate">
                      ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </section>

        {/* Transactions Section */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Activity
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 text-xs ${isFilterOpen || filterCategory !== 'all' ? 'text-emerald-600 bg-emerald-50' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-3 h-3 mr-1" /> Filter
            </Button>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4 px-2"
              >
                <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-zinc-400">Start Date</Label>
                      <Input 
                        type="date" 
                        value={filterStartDate} 
                        onChange={e => setFilterStartDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-zinc-400">End Date</Label>
                      <Input 
                        type="date" 
                        value={filterEndDate} 
                        onChange={e => setFilterEndDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-zinc-400">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="h-9 text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {allCategories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-8 text-[10px] uppercase text-zinc-400"
                    onClick={() => {
                      setFilterCategory('all');
                      setFilterStartDate(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
                      setFilterEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <p className="text-sm">No transactions found.</p>
                <p className="text-xs">Adjust filters or tap the + button.</p>
              </div>
            ) : (
              filteredTransactions.map(t => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between group active:bg-zinc-50 transition-colors cursor-pointer"
                  onClick={() => openEditTransaction(t)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.category}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <span>{getAccountName(t.accountId)}</span>
                        <span>•</span>
                        <span>{format(new Date(t.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* FAB */}
      <Dialog open={isAddTransactionOpen} onOpenChange={(open) => {
        setIsAddTransactionOpen(open);
        if (!open) resetTransactionForm();
      }}>
        <DialogTrigger render={<Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-xl bg-zinc-900 hover:bg-zinc-800 text-white p-0" />}>
          <Plus className="w-6 h-6" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-6 pt-4">
            <Tabs value={type} onValueChange={(v: any) => {
              setType(v);
              setCategory('');
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="pl-7 text-lg font-bold" 
                    placeholder="0.00" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="account">
                      <SelectValue>
                        {accountId ? getAccountName(accountId) : "Select account"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue>
                        {category || "Select category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES[type].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input id="note" value={note} onChange={e => setNote(e.target.value)} placeholder="What was this for?" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button type="submit" className="w-full h-12 text-lg font-semibold">
                {editingTransaction ? 'Update' : 'Save'} Transaction
              </Button>
              {editingTransaction && (
                <div className="space-y-2">
                  {isConfirmingDelete ? (
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        className="flex-1 h-12" 
                        onClick={() => {
                          deleteTransaction(editingTransaction.id);
                          setIsAddTransactionOpen(false);
                        }}
                      >
                        Confirm Delete
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 h-12" 
                        onClick={() => setIsConfirmingDelete(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-rose-500" 
                      onClick={() => setIsConfirmingDelete(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Transaction
                    </Button>
                  )}
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
