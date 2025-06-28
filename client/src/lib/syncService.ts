import { supabase } from './supabase';
import { 
  getTransactions, 
  getCategories, 
  getInvestments, 
  getGoals,
  getAssets,
  getCurrentUser as getLocalUser,
  saveTransactions,
  saveCategories,
  saveInvestments,
  saveGoals,
  saveAssets
} from './localStorageService';

// Function to sync local data with Supabase when user logs in
export const syncLocalDataToSupabase = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user found' };

  try {
    console.log("Starting data sync to Supabase for user:", user.email);
    // Get local data
    const localUser = getLocalUser();
    const transactions = getTransactions();
    const categories = getCategories();
    const investments = getInvestments();
    const goals = getGoals();
    const assets = getAssets();

    console.log("Local data found:", {
      categories: categories.length,
      transactions: transactions.length,
      investments: investments.length,
      goals: goals.length,
      assets: assets.length
    });

    // Sync user profile data
    const profileResult = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      first_name: localUser.firstName || localStorage.getItem("firstMillionUserName") || '',
      last_name: localUser.lastName || '',
      monthly_income: localStorage.getItem("firstMillionMonthlyIncome") || 0,
      currency: localStorage.getItem("firstMillionCurrency") || 'USD',
      goal_type: localStorage.getItem("firstMillionGoalType") || 'million',
      goal_name: localStorage.getItem("firstMillionGoalName") || 'First Million',
      target_amount: localStorage.getItem("firstMillionTargetAmount") || 1000000,
      onboarding_complete: true
    }, { onConflict: 'email' });

    console.log("Profile sync result:", profileResult.error ? "Error" : "Success");

    // Sync categories
    if (categories && categories.length > 0) {
      // For each category, generate a stable ID based on user ID + local ID
      const formattedCategories = categories.map(category => {
        // Generate a stable hash for this user+category combination
        const userBasedId = `${user.id}_cat_${category.id}`;
        
        return {
          id: category.id,
          user_id: user.id,
          user_email: user.email,
          type: category.type,
          name: category.name,
          icon: category.icon,
          color: category.color,
          created_at: new Date().toISOString()
        };
      });

      // First check if user already has categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id);
      
      // If no categories exist, insert new ones
      if (!existingCategories || existingCategories.length === 0) {
        console.log("No existing categories found, inserting new ones");
        const catResult = await supabase.from('categories').insert(formattedCategories);
        console.log("Categories insert result:", catResult.error ? "Error" : "Success");
      } else {
        // Otherwise, update existing ones
        const catResult = await supabase.from('categories').upsert(
          formattedCategories, 
          { onConflict: 'id,user_id' }
        );
        console.log("Categories upsert result:", catResult.error ? "Error" : "Success");
      }
    }

    // Sync transactions
    if (transactions && transactions.length > 0) {
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        user_id: user.id,
        user_email: user.email,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString(),
        category_id: transaction.categoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const txResult = await supabase.from('transactions').upsert(
        formattedTransactions,
        { onConflict: 'id,user_id' }
      );
      
      console.log("Transactions sync result:", txResult.error ? "Error" : "Success");
    }

    // Sync investments
    if (investments && investments.length > 0) {
      const formattedInvestments = investments.map(investment => ({
        id: investment.id,
        user_id: user.id,
        user_email: user.email,
        name: investment.name,
        type: investment.type || 'stock',
        initial_amount: investment.initial_amount,
        current_value: investment.current_value,
        start_date: new Date(investment.start_date || new Date()).toISOString(),
        notes: investment.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const invResult = await supabase.from('investments').upsert(
        formattedInvestments,
        { onConflict: 'id,user_id' }
      );
      
      console.log("Investments sync result:", invResult.error ? "Error" : "Success");
    }

    // Sync goals
    if (goals && goals.length > 0) {
      const formattedGoals = goals.map(goal => ({
        id: goal.id,
        user_id: user.id,
        user_email: user.email,
        name: goal.name || '',
        target_amount: goal.targetAmount,
        category_id: goal.categoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const goalsResult = await supabase.from('goals').upsert(
        formattedGoals,
        { onConflict: 'id,user_id' }
      );
      
      console.log("Goals sync result:", goalsResult.error ? "Error" : "Success");
    }

    // Sync assets
    if (assets && assets.length > 0) {
      const formattedAssets = assets.map(asset => ({
        id: parseInt(asset.id),
        user_id: user.id,
        user_email: user.email,
        name: asset.name,
        type: asset.type || 'account',
        balance: asset.balance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const assetsResult = await supabase.from('assets').upsert(
        formattedAssets,
        { onConflict: 'id,user_id' }
      );
      
      console.log("Assets sync result:", assetsResult.error ? "Error" : "Success");
    }

    // After successful sync, set flag in localStorage
    localStorage.setItem("firstMillionDataSynced", "true");
    console.log("Data sync completed successfully");

    return { success: true };
  } catch (error: any) {
    console.error('Error syncing data to Supabase:', error);
    return { success: false, error: error.message };
  }
};

// Function to fetch user data from Supabase and update local storage
export const syncSupabaseDataToLocal = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No authenticated user found' };

  try {
    console.log("Starting sync from Supabase to local storage for user:", user.email);

    // Fetch profile data by both user ID and email to ensure we get the most complete data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile data:", profileError);
      throw profileError;
    }
    
    console.log("Profile data fetched:", profileData ? "Success" : "No data");
    
    if (profileData) {
      // Store profile data in localStorage
      if (profileData.first_name) {
        localStorage.setItem("firstMillionUserName", profileData.first_name);
      }
      if (profileData.monthly_income) {
        localStorage.setItem("firstMillionMonthlyIncome", profileData.monthly_income.toString());
      }
      if (profileData.currency) {
        localStorage.setItem("firstMillionCurrency", profileData.currency);
      }
      if (profileData.goal_type) {
        localStorage.setItem("firstMillionGoalType", profileData.goal_type);
      }
      if (profileData.goal_name) {
        localStorage.setItem("firstMillionGoalName", profileData.goal_name);
      }
      if (profileData.target_amount) {
        localStorage.setItem("firstMillionTargetAmount", profileData.target_amount.toString());
      }
      localStorage.setItem("firstMillionUserEmail", user.email || '');
      localStorage.setItem("firstMillionAuthStatus", "authenticated");
    }
    
    // Fetch categories - try by both user_id and email to get comprehensive data
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      throw categoriesError;
    }
    
    console.log(`Categories fetched: ${categoriesData ? categoriesData.length : 0}`);
    
    if (categoriesData && categoriesData.length > 0) {
      const formattedCategories = categoriesData.map(category => ({
        id: category.id,
        userEmail: user.email,
        type: category.type,
        name: category.name,
        icon: category.icon,
        color: category.color,
        createdAt: new Date(category.created_at)
      }));
      
      saveCategories(formattedCategories);
      console.log(`Saved ${formattedCategories.length} categories to local storage`);
    } else {
      console.log("No categories found in database");
    }
    
    // Fetch transactions - try by both user_id and email to get comprehensive data
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      throw transactionsError;
    }
    
    console.log(`Transactions fetched: ${transactionsData ? transactionsData.length : 0}`);
    
    if (transactionsData && transactionsData.length > 0) {
      const formattedTransactions = transactionsData.map(transaction => ({
        id: transaction.id,
        userEmail: user.email,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        date: new Date(transaction.date),
        categoryId: transaction.category_id,
        createdAt: new Date(transaction.created_at),
        // Handle additional fields that might exist in the database
        receivedIn: transaction.received_in || null,
        paidThrough: transaction.paid_through || null
      }));
      
      saveTransactions(formattedTransactions);
      console.log(`Saved ${formattedTransactions.length} transactions to local storage`);
    } else {
      console.log("No transactions found in database");
    }
    
    // Fetch investments - try by both user_id and email to get comprehensive data
    const { data: investmentsData, error: investmentsError } = await supabase
      .from('investments')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    
    if (investmentsError) {
      console.error("Error fetching investments:", investmentsError);
      throw investmentsError;
    }
    
    console.log(`Investments fetched: ${investmentsData ? investmentsData.length : 0}`);
    
    if (investmentsData && investmentsData.length > 0) {
      const formattedInvestments = investmentsData.map(investment => ({
        id: investment.id,
        name: investment.name,
        type: investment.type,
        initial_amount: investment.initial_amount,
        current_value: investment.current_value,
        start_date: new Date(investment.start_date),
        notes: investment.notes || '',
        userEmail: user.email,
        // Add any other fields that might be in the database
        returns: investment.returns,
        rateOfReturn: investment.rate_of_return
      }));
      
      saveInvestments(formattedInvestments);
      console.log(`Saved ${formattedInvestments.length} investments to local storage`);
    } else {
      console.log("No investments found in database");
    }
    
    // Fetch goals - try by both user_id and email to get comprehensive data
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    
    if (goalsError) {
      console.error("Error fetching goals:", goalsError);
      throw goalsError;
    }
    
    console.log(`Goals fetched: ${goalsData ? goalsData.length : 0}`);
    
    if (goalsData && goalsData.length > 0) {
      const formattedGoals = goalsData.map(goal => ({
        id: goal.id,
        name: goal.name || '',
        targetAmount: goal.target_amount,
        categoryId: goal.category_id,
        userEmail: user.email,
        createdAt: new Date(goal.created_at),
        // Add other fields
        deadline: goal.deadline ? new Date(goal.deadline) : null,
        savedAmount: goal.saved_amount || 0
      }));
      
      saveGoals(formattedGoals);
      console.log(`Saved ${formattedGoals.length} goals to local storage`);
    } else {
      console.log("No goals found in database");
    }
    
    // Fetch assets - try by both user_id and email to get comprehensive data
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    
    if (assetsError) {
      console.error("Error fetching assets:", assetsError);
      throw assetsError;
    }
    
    console.log(`Assets fetched: ${assetsData ? assetsData.length : 0}`);
    
    if (assetsData && assetsData.length > 0) {
      const formattedAssets = assetsData.map(asset => ({
        id: asset.id.toString(),
        name: asset.name,
        type: asset.type,
        balance: asset.balance,
        color: asset.color || "#4caf50" // Use provided color or default
      }));
      
      saveAssets(formattedAssets);
      console.log(`Saved ${formattedAssets.length} assets to local storage`);
    } else {
      console.log("No assets found in database");
    }
    
    // Set the data synced flag
    localStorage.setItem("firstMillionDataSynced", "true");
    console.log("Data sync from Supabase to local completed successfully");
    
    return { success: true };
  } catch (error: any) {
    console.error('Error syncing data from Supabase:', error);
    return { success: false, error: error.message };
  }
}; 