-- Schema for First Million app in Supabase

-- Create tables for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  monthly_income DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  goal_type TEXT,
  goal_name TEXT,
  target_amount DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for categories
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for investments
CREATE TABLE IF NOT EXISTS public.investments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_amount DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for goals
CREATE TABLE IF NOT EXISTS public.goals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for assets
CREATE TABLE IF NOT EXISTS public.assets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for onboarding data
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  user_name TEXT,
  monthly_income DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  investment_goal TEXT,
  target_amount DECIMAL(12,2),
  goal_type TEXT,
  goal_name TEXT,
  expense_categories TEXT[],
  income_categories TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers if they don't exist
DO $$ 
BEGIN
  -- Profiles trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_modtime') THEN
    CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;

  -- Transactions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_modtime') THEN
    CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;

  -- Investments trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_investments_modtime') THEN
    CREATE TRIGGER update_investments_modtime
    BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;

  -- Goals trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_goals_modtime') THEN
    CREATE TRIGGER update_goals_modtime
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;

  -- Assets trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assets_modtime') THEN
    CREATE TRIGGER update_assets_modtime
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;

  -- Onboarding data trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_onboarding_data_modtime') THEN
    CREATE TRIGGER update_onboarding_data_modtime
    BEFORE UPDATE ON onboarding_data
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  END IF;
END $$;

-- Set up Row Level Security policies (only if they don't exist)
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
  END IF;

  -- Categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own categories') THEN
    CREATE POLICY "Users can view their own categories" 
    ON categories FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own categories') THEN
    CREATE POLICY "Users can insert their own categories" 
    ON categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own categories') THEN
    CREATE POLICY "Users can update their own categories" 
    ON categories FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own categories') THEN
    CREATE POLICY "Users can delete their own categories" 
    ON categories FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Transactions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions') THEN
    CREATE POLICY "Users can view their own transactions" 
    ON transactions FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own transactions') THEN
    CREATE POLICY "Users can insert their own transactions" 
    ON transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own transactions') THEN
    CREATE POLICY "Users can update their own transactions" 
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own transactions') THEN
    CREATE POLICY "Users can delete their own transactions" 
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Investments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own investments') THEN
    CREATE POLICY "Users can view their own investments" 
    ON investments FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own investments') THEN
    CREATE POLICY "Users can insert their own investments" 
    ON investments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own investments') THEN
    CREATE POLICY "Users can update their own investments" 
    ON investments FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own investments') THEN
    CREATE POLICY "Users can delete their own investments" 
    ON investments FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Goals policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own goals') THEN
    CREATE POLICY "Users can view their own goals" 
    ON goals FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own goals') THEN
    CREATE POLICY "Users can insert their own goals" 
    ON goals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own goals') THEN
    CREATE POLICY "Users can update their own goals" 
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own goals') THEN
    CREATE POLICY "Users can delete their own goals" 
    ON goals FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Assets policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own assets') THEN
    CREATE POLICY "Users can view their own assets" 
    ON assets FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own assets') THEN
    CREATE POLICY "Users can insert their own assets" 
    ON assets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own assets') THEN
    CREATE POLICY "Users can update their own assets" 
    ON assets FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own assets') THEN
    CREATE POLICY "Users can delete their own assets" 
    ON assets FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Onboarding data policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own onboarding data') THEN
    CREATE POLICY "Users can view their own onboarding data" 
    ON onboarding_data FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own onboarding data') THEN
    CREATE POLICY "Users can insert their own onboarding data" 
    ON onboarding_data FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own onboarding data') THEN
    CREATE POLICY "Users can update their own onboarding data" 
    ON onboarding_data FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enable Row Level Security on all tables if not already enabled
DO $$ 
BEGIN
  -- Check if RLS is enabled for each table and enable if not
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'categories' AND rowsecurity = true) THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions' AND rowsecurity = true) THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'investments' AND rowsecurity = true) THEN
    ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'goals' AND rowsecurity = true) THEN
    ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assets' AND rowsecurity = true) THEN
    ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'onboarding_data' AND rowsecurity = true) THEN
    ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
  END IF;
END $$; 