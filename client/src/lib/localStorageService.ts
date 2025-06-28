import { v4 as uuidv4 } from 'uuid';
import type { 
  Category, 
  Transaction, 
  Investment, 
  Goal 
} from '@shared/schema';

// Event system for data changes
type EventCallback = () => void;
type EventType = 'transactions' | 'categories' | 'investments' | 'goals' | 'assets' | 'transfers';

const listeners: Record<EventType, EventCallback[]> = {
  transactions: [],
  categories: [],
  investments: [],
  goals: [],
  assets: [],
  transfers: []
};

export const subscribe = (event: EventType, callback: EventCallback): () => void => {
  listeners[event].push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = listeners[event].indexOf(callback);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
  };
};

const notify = (event: EventType): void => {
  listeners[event].forEach(callback => callback());
};

// Default categories if none exist
const defaultCategories: Category[] = [
  {
    id: 1,
    userEmail: 'local@user.com',
    type: 'income',
    name: 'Salary',
    icon: 'dollar-sign',
    color: '#4caf50',
    createdAt: new Date()
  },
  {
    id: 2,
    userEmail: 'local@user.com',
    type: 'income',
    name: 'Freelance',
    icon: 'briefcase',
    color: '#2196f3',
    createdAt: new Date()
  },
  {
    id: 3,
    userEmail: 'local@user.com',
    type: 'expense',
    name: 'Food',
    icon: 'utensils',
    color: '#ff9800',
    createdAt: new Date()
  },
  {
    id: 4,
    userEmail: 'local@user.com',
    type: 'expense',
    name: 'Transport',
    icon: 'car',
    color: '#f44336',
    createdAt: new Date()
  }
];

// Default user
const defaultUser = {
  id: 'local-user',
  email: 'local@user.com',
  firstName: 'Local',
  lastName: 'User',
  profileImageUrl: '',
  isProUser: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper functions to get and set data in localStorage
const getItem = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  
  try {
    // Parse dates that were stringified
    return JSON.parse(stored, (key, value) => {
      if (key === 'date' || key === 'createdAt' || key === 'updatedAt' || key === 'deadline') {
        return value ? new Date(value) : null;
      }
      return value;
    });
  } catch (e) {
    console.error('Error parsing localStorage item', e);
    return defaultValue;
  }
};

const setItem = (key: string, value: any, event?: EventType): void => {
  localStorage.setItem(key, JSON.stringify(value));
  if (event) {
    notify(event);
  }
};

// Initialize storage on first run
export const initStorage = (): void => {
  // Only initialize if not already set
  if (!localStorage.getItem('firstMillionUser')) {
    setItem('firstMillionUser', defaultUser);
    setItem('firstMillionCategories', defaultCategories);
    setItem('firstMillionTransactions', []);
    setItem('firstMillionInvestments', []);
    setItem('firstMillionGoals', []);
    setItem('firstMillionAssetTransfers', []);
    
    // Initialize default assets
    const defaultAssets: Asset[] = [
      { 
        id: "1", 
        name: "Bank Account", 
        balance: 0,
        color: "from-blue-500 to-blue-600"
      },
      { 
        id: "2", 
        name: "Credit Card", 
        balance: 0,
        color: "from-purple-500 to-purple-600"
      },
      { 
        id: "3", 
        name: "Cash", 
        balance: 0,
        color: "from-green-500 to-green-600"
      },
      { 
        id: "4", 
        name: "Investments", 
        balance: 0,
        color: "from-amber-500 to-amber-600"
      },
      { 
        id: "5", 
        name: "Savings", 
        balance: 0,
        color: "from-indigo-500 to-indigo-600"
      }
    ];
    
    setItem('firstMillionAssets', defaultAssets);
  }
};

// Auth functions
export const getCurrentUser = () => {
  return getItem('firstMillionUser', defaultUser);
};

export const updateUser = (userData: any) => {
  const currentUser = getCurrentUser();
  const updatedUser = { ...currentUser, ...userData, updatedAt: new Date() };
  setItem('firstMillionUser', updatedUser);
  return updatedUser;
};

// Categories functions
export const getCategories = (): Category[] => {
  return getItem('firstMillionCategories', defaultCategories);
};

export const createCategory = (category: Omit<Category, 'id' | 'createdAt'>): Category => {
  const categories = getCategories();
  const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
  
  const newCategory: Category = {
    ...category,
    id: newId,
    createdAt: new Date()
  };
  
  setItem('firstMillionCategories', [...categories, newCategory], 'categories');
  return newCategory;
};

export const updateCategory = (id: number, categoryData: Partial<Category>): Category => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) throw new Error(`Category with id ${id} not found`);
  
  const updatedCategory = { ...categories[index], ...categoryData };
  categories[index] = updatedCategory;
  
  setItem('firstMillionCategories', categories, 'categories');
  return updatedCategory;
};

export const deleteCategory = (id: number): void => {
  const categories = getCategories();
  setItem('firstMillionCategories', categories.filter(c => c.id !== id), 'categories');
};

// Transactions functions
export const getTransactions = (): Transaction[] => {
  return getItem('firstMillionTransactions', []);
};

export const createTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
  const transactions = getTransactions();
  const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
  
  const newTransaction: Transaction = {
    id: newId,
    createdAt: new Date(),
    ...transaction,
    categoryId: transaction.categoryId ?? null,
    receivedIn: transaction.receivedIn ?? null,
    paidThrough: transaction.paidThrough ?? null,
    description: transaction.description ?? null,
  };
  
  setItem('firstMillionTransactions', [...transactions, newTransaction], 'transactions');
  return newTransaction;
};

export const updateTransaction = (id: number, transactionData: Partial<Transaction>): Transaction => {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  
  if (index === -1) throw new Error(`Transaction with id ${id} not found`);
  
  const updatedTransaction = { ...transactions[index], ...transactionData };
  transactions[index] = updatedTransaction;
  
  setItem('firstMillionTransactions', transactions, 'transactions');
  return updatedTransaction;
};

export const deleteTransaction = (id: number): void => {
  const transactions = getTransactions();
  setItem('firstMillionTransactions', transactions.filter(t => t.id !== id), 'transactions');
};

// Investments functions
export const getInvestments = (): Investment[] => {
  return getItem('firstMillionInvestments', []);
};

export const createInvestment = (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Investment => {
  const investments = getInvestments();
  const newId = investments.length > 0 ? Math.max(...investments.map(i => i.id)) + 1 : 1;
  const now = new Date();
  
  const newInvestment: Investment = {
    ...investment,
    id: newId,
    createdAt: now,
    updatedAt: now
  };
  
  setItem('firstMillionInvestments', [...investments, newInvestment], 'investments');
  return newInvestment;
};

export const updateInvestment = (id: number, investmentData: Partial<Investment>): Investment => {
  const investments = getInvestments();
  const index = investments.findIndex(i => i.id === id);
  
  if (index === -1) throw new Error(`Investment with id ${id} not found`);
  
  const updatedInvestment = { 
    ...investments[index], 
    ...investmentData, 
    updatedAt: new Date() 
  };
  
  investments[index] = updatedInvestment;
  setItem('firstMillionInvestments', investments, 'investments');
  
  return updatedInvestment;
};

export const deleteInvestment = (id: number): void => {
  const investments = getInvestments();
  setItem('firstMillionInvestments', investments.filter(i => i.id !== id), 'investments');
};

// Goals functions
export const getGoals = (): Goal[] => {
  return getItem('firstMillionGoals', []);
};

export const createGoal = (goal: Omit<Goal, 'id' | 'createdAt'>): Goal => {
  const goals = getGoals();
  const newId = goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1;
  
  const newGoal: Goal = {
    ...goal,
    id: newId,
    createdAt: new Date()
  };
  
  setItem('firstMillionGoals', [...goals, newGoal], 'goals');
  return newGoal;
};

export const updateGoal = (id: number, goalData: Partial<Goal>): Goal => {
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === id);
  
  if (index === -1) throw new Error(`Goal with id ${id} not found`);
  
  const updatedGoal = { ...goals[index], ...goalData };
  goals[index] = updatedGoal;
  
  setItem('firstMillionGoals', goals, 'goals');
  return updatedGoal;
};

export const deleteGoal = (id: number): void => {
  const goals = getGoals();
  setItem('firstMillionGoals', goals.filter(g => g.id !== id), 'goals');
};

// Asset transfers functions
export interface AssetTransfer {
  id: string;
  sourceId: string;
  destinationId: string;
  amount: number;
  date: Date;
}

export const getAssetTransfers = (): AssetTransfer[] => {
  return getItem('firstMillionAssetTransfers', []);
};

export const saveAssetTransfer = (transfer: Omit<AssetTransfer, 'id' | 'date'>): AssetTransfer => {
  const transfers = getAssetTransfers();
  const newId = uuidv4();
  
  const newTransfer: AssetTransfer = {
    ...transfer,
    id: newId,
    date: new Date()
  };
  
  setItem('firstMillionAssetTransfers', [...transfers, newTransfer], 'transfers');
  
  // Also notify assets listeners since asset balances have changed
  notify('assets');
  
  return newTransfer;
};

// Assets functions for direct manipulation
export interface Asset {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export const getAssets = (): Asset[] => {
  return getItem('firstMillionAssets', []);
};

export const saveAssets = (assets: Asset[]): void => {
  setItem('firstMillionAssets', assets, 'assets');
}; 

// Save functions for bulk operations (used for syncing with Supabase)
export const saveCategories = (categories: Category[]): void => {
  setItem('firstMillionCategories', categories, 'categories');
};

export const saveTransactions = (transactions: Transaction[]): void => {
  setItem('firstMillionTransactions', transactions, 'transactions');
};

export const saveInvestments = (investments: Investment[]): void => {
  setItem('firstMillionInvestments', investments, 'investments');
};

export const saveGoals = (goals: Goal[]): void => {
  setItem('firstMillionGoals', goals, 'goals');
}; 