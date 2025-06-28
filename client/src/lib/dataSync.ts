/**
 * Comprehensive utilities for data synchronization between local storage and Supabase
 */

import { supabase } from './supabase';
import { 
  getTransactions, 
  getCategories, 
  getInvestments, 
  getGoals,
  getAssets,
  saveTransactions,
  saveCategories,
  saveInvestments,
  saveGoals,
  saveAssets
} from './localStorageService';

// Function to check if user is authenticated
export const isUserAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Function to sync a single transaction to Supabase
export const syncTransactionToSupabase = async (transaction: any): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping transaction sync");
      return false;
    }

    // Format transaction for Supabase
    const supabaseTransaction = {
      id: transaction.id,
      user_id: userId,
      type: transaction.type,
      amount: parseFloat(transaction.amount as any),
      description: transaction.description || '',
      date: new Date(transaction.date).toISOString(),
      category_id: transaction.categoryId,
      paid_through: transaction.paidThrough || null,
      received_in: transaction.receivedIn || null,
      created_at: new Date(transaction.createdAt || new Date()).toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('transactions')
      .upsert(supabaseTransaction, { onConflict: 'id,user_id' });

    if (error) {
      console.error("Error syncing transaction to Supabase:", error);
      return false;
    }

    console.log(`Transaction ${transaction.id} synced to Supabase successfully`);
    return true;
  } catch (error) {
    console.error("Failed to sync transaction:", error);
    return false;
  }
};

// Function to sync a single category to Supabase
export const syncCategoryToSupabase = async (category: any): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping category sync");
      return false;
    }

    // Format category for Supabase
    const supabaseCategory = {
      id: category.id,
      user_id: userId,
      type: category.type,
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#4caf50',
      created_at: new Date(category.createdAt || new Date()).toISOString()
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('categories')
      .upsert(supabaseCategory, { onConflict: 'id,user_id' });

    if (error) {
      console.error("Error syncing category to Supabase:", error);
      return false;
    }

    console.log(`Category ${category.id} synced to Supabase successfully`);
    return true;
  } catch (error) {
    console.error("Failed to sync category:", error);
    return false;
  }
};

// Function to sync a single asset to Supabase
export const syncAssetToSupabase = async (asset: any): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping asset sync");
      return false;
    }

    // Format asset for Supabase
    const supabaseAsset = {
      id: parseInt(asset.id),
      user_id: userId,
      name: asset.name,
      type: asset.type || 'account',
      balance: asset.balance,
      color: asset.color || '',
      created_at: new Date().toISOString(), // Assets might not track creation date
      updated_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('assets')
      .upsert(supabaseAsset, { onConflict: 'id,user_id' });

    if (error) {
      console.error("Error syncing asset to Supabase:", error);
      return false;
    }

    console.log(`Asset ${asset.id} synced to Supabase successfully`);
    return true;
  } catch (error) {
    console.error("Failed to sync asset:", error);
    return false;
  }
};

// Function to sync a single investment to Supabase
export const syncInvestmentToSupabase = async (investment: any): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping investment sync");
      return false;
    }

    // Format investment for Supabase
    const supabaseInvestment = {
      id: investment.id,
      user_id: userId,
      name: investment.name,
      type: investment.type || 'stock',
      initial_amount: parseFloat(investment.initial_amount || investment.initialAmount || 0),
      current_value: parseFloat(investment.current_value || investment.currentValue || 0),
      start_date: new Date(investment.start_date || investment.startDate || new Date()).toISOString(),
      notes: investment.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('investments')
      .upsert(supabaseInvestment, { onConflict: 'id,user_id' });

    if (error) {
      console.error("Error syncing investment to Supabase:", error);
      return false;
    }

    console.log(`Investment ${investment.id} synced to Supabase successfully`);
    return true;
  } catch (error) {
    console.error("Failed to sync investment:", error);
    return false;
  }
};

// Function to sync a single goal to Supabase
export const syncGoalToSupabase = async (goal: any): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping goal sync");
      return false;
    }

    // Format goal for Supabase
    const supabaseGoal = {
      id: goal.id,
      user_id: userId,
      name: goal.name || '',
      target_amount: parseFloat(goal.targetAmount || 0),
      category_id: goal.categoryId || null,
      saved_amount: parseFloat(goal.savedAmount || 0),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null,
      created_at: new Date(goal.createdAt || new Date()).toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { error } = await supabase
      .from('goals')
      .upsert(supabaseGoal, { onConflict: 'id,user_id' });

    if (error) {
      console.error("Error syncing goal to Supabase:", error);
      return false;
    }

    console.log(`Goal ${goal.id} synced to Supabase successfully`);
    return true;
  } catch (error) {
    console.error("Failed to sync goal:", error);
    return false;
  }
};

// Single function to sync all data as needed - called when making changes
export const syncAllDataToSupabase = async (): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, skipping full data sync");
      return false;
    }

    console.log("Starting full data sync to Supabase");

    // Sync categories
    const categories = getCategories();
    for (const category of categories) {
      await syncCategoryToSupabase(category);
    }

    // Sync transactions
    const transactions = getTransactions();
    for (const transaction of transactions) {
      await syncTransactionToSupabase(transaction);
    }

    // Sync assets
    const assets = getAssets();
    for (const asset of assets) {
      await syncAssetToSupabase(asset);
    }

    // Sync investments
    const investments = getInvestments();
    for (const investment of investments) {
      await syncInvestmentToSupabase(investment);
    }

    // Sync goals
    const goals = getGoals();
    for (const goal of goals) {
      await syncGoalToSupabase(goal);
    }

    console.log("Full data sync to Supabase completed");
    localStorage.setItem("firstMillionDataSynced", "true");
    return true;
  } catch (error) {
    console.error("Error during full data sync:", error);
    return false;
  }
};

// Helper function to sync data periodically - can be called on app startup
export const startPeriodicSync = (intervalMinutes = 5): () => void => {
  const interval = setInterval(async () => {
    const isAuthenticated = await isUserAuthenticated();
    if (isAuthenticated) {
      console.log(`Running periodic sync (every ${intervalMinutes} minutes)`);
      await syncAllDataToSupabase();
    }
  }, intervalMinutes * 60 * 1000);
  
  // Return function to stop the periodic sync
  return () => clearInterval(interval);
}; 