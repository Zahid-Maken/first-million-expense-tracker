import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DesktopSidebar from "@/components/navigation/desktop-sidebar";
import MobileNav from "@/components/navigation/mobile-nav";
import ExpensePieChart from "@/components/charts/expense-pie-chart";
import IncomeExpenseChart from "@/components/charts/income-expense-chart";
import InvestmentChart from "@/components/charts/investment-chart";
import AddIncomeModal from "@/components/modals/add-income-modal";
import AddExpenseModal from "@/components/modals/add-expense-modal";
import AddCategoryModal from "@/components/modals/add-category-modal";
import AddInvestmentModal from "@/components/modals/add-investment-modal";
import AddGoalModal from "@/components/modals/add-goal-modal";
import ExportReportModal from "@/components/modals/export-report-modal";
import LoginModal from "@/components/auth/login-modal";
import UserProfile from "@/components/profile/user-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoIcon from "@/assets/images/1.png";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  PieChart,
  BarChart3,
  LineChart,
  Download,
  Edit,
  Trash2,
  Landmark,
  HandCoins,
  LogIn
} from "lucide-react";
import type { Transaction, Category, Investment, Goal } from "@shared/schema";
import { 
  getTransactions, 
  getCategories, 
  deleteCategory,
  getInvestments, 
  getGoals,
  getAssets,
  subscribe,
  saveAssets,
  updateInvestment
} from "@/lib/localStorageService";
import { formatCurrency, formatLargeCurrency, getUserCurrencyCode, smartFormatCurrency } from "@/lib/currencyUtils";
import { getIconComponent } from "@/lib/icons.tsx";
import InvestmentPortfolioChart from "@/components/charts/investment-portfolio-chart";
import { syncLocalDataToSupabase, syncSupabaseDataToLocal } from "@/lib/syncService";

export default function Dashboard() {
  const { user } = useAuth();
  const { user: supabaseUser, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showExportReport, setShowExportReport] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Authentication status from onboarding
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'skipped' | 'unknown'>('unknown');
  
  // State for data from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyCode, setCurrencyCode] = useState(getUserCurrencyCode());
  const [assets, setAssets] = useState(getAssets());

  // State for category filtering
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Check authentication status on load
  useEffect(() => {
    const status = localStorage.getItem("firstMillionAuthStatus");
    setAuthStatus(status === "authenticated" ? "authenticated" : status === "skipped" ? "skipped" : "unknown");
  }, []);

  // Check for URL parameters to set active tab
  useEffect(() => {
    // Get tab from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    // Set active tab if valid tab parameter exists
    if (tabParam && ['dashboard', 'transactions', 'categories', 'investments', 'goals', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Load data from localStorage
  useEffect(() => {
    refreshData();
    setIsLoading(false);
    
    // Subscribe to asset changes and transfers
    const unsubscribeAssets = subscribe('assets', () => {
      setAssets(getAssets());
      refreshData();
    });
    
    const unsubscribeTransfers = subscribe('transfers', () => {
      setAssets(getAssets());
      refreshData();
    });
    
    return () => {
      unsubscribeAssets();
      unsubscribeTransfers();
    };
  }, []);

  // Update auth status when Supabase user changes
  useEffect(() => {
    if (!authLoading) {
      if (supabaseUser) {
        setAuthStatus('authenticated');
        localStorage.setItem("firstMillionAuthStatus", "authenticated");
        
        // When user is authenticated, sync data from Supabase to local storage
        syncSupabaseDataToLocal().then(() => {
          // Refresh local data after sync
          refreshData();
        }).catch(error => {
          console.error('Error syncing data from Supabase:', error);
          toast({
            title: 'Sync error',
            description: `Failed to sync data from Supabase: ${error.message}`,
            variant: 'destructive',
          });
        });
      }
    }
  }, [supabaseUser, authLoading]);

  // Improved login success handler to ensure data syncs properly
  const handleLoginSuccess = async () => {
    if (supabaseUser) {
      try {
        // Update auth status
        setAuthStatus('authenticated');
        localStorage.setItem("firstMillionAuthStatus", "authenticated");
        localStorage.setItem("firstMillionUserEmail", supabaseUser.email || '');
        
        toast({
          title: "Logged in successfully",
          description: `Welcome back, ${supabaseUser.email?.split('@')[0] || 'User'}! Your data is being synced.`,
        });
        
        // First sync local data to Supabase to avoid data loss
        // This will ensure any data created while offline gets uploaded
        await syncLocalDataToSupabase();
        
        // Then download any additional data from Supabase
        await syncSupabaseDataToLocal();
        
        // Refresh local data after sync
        refreshData();
        
        // Refresh page to ensure all data is loaded correctly
        // window.location.reload();
      } catch (error: any) {
        console.error("Error during login sync:", error);
        toast({
          title: "Sync Error",
          description: `There was an error syncing your data: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  // Handle category filtering
  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredCategories(categories);
    } else {
      setFilteredCategories(categories.filter(c => c.type === categoryFilter));
    }
  }, [categoryFilter, categories]);

  // Refresh data after operations
  const refreshData = () => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setInvestments(getInvestments());
    setGoals(getGoals());
    setAssets(getAssets());
    // Refresh currency code in case it was changed somewhere else
    setCurrencyCode(getUserCurrencyCode());
  };

  // Handle category deletion
  const handleDeleteCategory = (id: number) => {
    try {
      deleteCategory(id);
      toast({
        title: "Category Deleted",
        description: "The category has been successfully deleted.",
        variant: "default",
      });
      refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the category.",
        variant: "destructive",
      });
    }
  };

  // Calculate financial metrics
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);

  // Calculate total investments by summing current_value from all investments
  const totalInvestments = investments.reduce((sum, investment) => {
    return sum + parseFloat(investment.current_value);
  }, 0);
  
  // Calculate total assets value
  const totalAssets = assets.reduce((sum, asset) => sum + asset.balance, 0);

  // Net worth is the sum of all asset balances
  const netWorth = totalAssets;

  // Recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        user={user || { 
          id: 'local-user',
          email: localStorage.getItem("firstMillionUserEmail") || 'local@user.com',
          firstName: localStorage.getItem("firstMillionUserName") || 'User',
          lastName: '',
          isProUser: false
        }}
      />

      {/* Mobile Navigation */}
      <MobileNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <div className="md:ml-72 pb-24 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-card/80 nav-blur border-b border-border p-2 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gradient-primary">First Million</h1>
              <UserProfile compact />
            </div>
            <div className="w-16 h-16 flex items-center justify-center overflow-visible">
              <img 
                src={logoIcon} 
                alt="First Million Logo" 
                className="w-20 h-auto"
                style={{ objectFit: "contain", transform: "scale(1.5)", minWidth: 60, minHeight: 60 }}
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="m-0">
            {/* Desktop Header */}
            <div className="hidden md:block bg-card border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                  <p className="text-muted-foreground mt-1 font-medium">Your financial overview</p>
                </div>
                <div className="flex space-x-2">
                  {/* Show login button if user skipped authentication */}
                  {authStatus === 'skipped' && (
                    <Button 
                      onClick={() => setShowLoginModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-glow hover:shadow-card-hover transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                  <Button 
                    onClick={() => setShowAddIncome(true)}
                    className="bg-gradient-primary text-white shadow-glow hover:shadow-card-hover transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income
                  </Button>
                </div>
              </div>
            </div>

            {/* If user skipped authentication, show a banner */}
            {authStatus === 'skipped' && (
              <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 m-4 md:m-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <LogIn className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      You're using First Million in offline mode. 
                      <button 
                        onClick={() => setShowLoginModal(true)}
                        className="ml-1 font-medium text-blue-700 dark:text-blue-400 underline hover:text-blue-600"
                      >
                        Sign in
                      </button> to sync your data to the cloud and access it from any device.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 md:p-6 space-y-6">
              {/* Net Worth Summary */}
              <Card className="bg-gradient-primary text-white shadow-[0_8px_30px_rgb(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.55)] transition-shadow duration-300 border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
                <CardContent className="p-6 md:p-8 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white/90">Total Net Worth</h2>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors duration-300"
                        onClick={() => setLocation("/bank-details")}
                      >
                        <Landmark className="w-5 h-5 text-white" />
                        <span className="sr-only">Bank Details</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex items-center mb-6">
                    <div className="text-4xl md:text-5xl font-bold text-white">
                      {smartFormatCurrency(netWorth)}
                    </div>
                    <div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-32 flex-shrink-0 flex items-center justify-center bg-white/20 rounded-2xl cursor-pointer hover:bg-white/30 transition-colors duration-300 h-8"
                      style={{ minWidth: 90, maxWidth: 100 }}
                      onClick={() => setLocation("/loans")}
                    >
                      <HandCoins className="w-5 h-5 text-white mr-1" />
                      <span className="text-white font-semibold text-base">Loans</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <p className="text-white/70 text-xs md:text-sm font-medium">Income</p>
                      <p className="font-bold text-sm md:text-lg text-white">{smartFormatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <p className="text-white/70 text-xs md:text-sm font-medium">Expenses</p>
                      <p className="font-bold text-sm md:text-lg text-white">{smartFormatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <p className="text-white/70 text-xs md:text-sm font-medium">Invest</p>
                      <p className="font-bold text-sm md:text-lg text-white">{smartFormatCurrency(totalInvestments)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 cursor-pointer group rounded-xl"
                      onClick={() => setShowAddIncome(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-success rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Add Income</h3>
                    <p className="text-sm text-muted-foreground">Record earnings</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 cursor-pointer group rounded-xl"
                      onClick={() => setShowAddExpense(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-destructive to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <TrendingDown className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Add Expense</h3>
                    <p className="text-sm text-muted-foreground">Track spending</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 cursor-pointer group rounded-xl"
                      onClick={() => setShowAddInvestment(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-warning rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <LineChart className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Invest</h3>
                    <p className="text-sm text-muted-foreground">Grow wealth</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 cursor-pointer group rounded-xl"
                      onClick={() => setShowAddGoal(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Set Goals</h3>
                    <p className="text-sm text-muted-foreground">Plan targets</p>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Goal */}
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">Budget Goal</h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab("goals")}
                        className="text-xs"
                      >
                        See All
                      </Button>
                      <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {goals.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
                        <Target className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-3">Set budget goals to track your spending</p>
                      <Button 
                        onClick={() => setShowAddGoal(true)}
                        className="bg-gradient-primary text-white shadow-[0_4px_8px_rgba(124,58,237,0.5)]"
                      >
                        Create Your First Goal
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {goals.map((goal) => {
                        // Find the relevant category for this goal
                        const category = categories.find(c => c.id === goal.categoryId);
                        
                        if (!category) {
                          // Skip goals with no matching category
                          return null;
                        }
                        
                        // Get transactions matching this specific category
                        const categoryTransactions = transactions.filter(t => {
                          return t.categoryId === goal.categoryId && t.type === "expense";
                        });
                        
                        // Calculate spent amount
                        const spent = categoryTransactions.reduce((sum, t) => {
                          const amount = parseFloat(t.amount);
                          return sum + (isNaN(amount) ? 0 : amount);
                        }, 0);
                        
                        // Parse limit amount
                        const limitStr = goal.targetAmount || "0";
                        const limit = parseFloat(limitStr);
                        const validLimit = isNaN(limit) || limit <= 0 ? 1 : limit;
                        
                        // Calculate progress percentage and remaining amount
                        const progress = validLimit > 0 ? (spent / validLimit) * 100 : 0;
                        const remaining = Math.max(validLimit - spent, 0);

                        // Only show warning (>50%) or critical (>80%) goals on dashboard
                        if (progress < 50 && goals.some(g => {
                          const cat = categories.find(c => c.id === g.categoryId);
                          if (!cat) return false;
                          const catTrans = transactions.filter(t => t.categoryId === g.categoryId && t.type === "expense");
                          const catSpent = catTrans.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                          const catLimit = parseFloat(g.targetAmount || "0") || 1;
                          const catProgress = (catSpent / catLimit) * 100;
                          return catProgress >= 50;
                        })) {
                          return null;
                        }
                        
                        return (
                          <div key={goal.id} className="rounded-lg shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.1)] px-3 py-2">
                            <div className="flex items-center justify-between mb-1 text-sm">
                              <span className="font-medium text-foreground">{category.name}</span>
                              <span className={`font-medium ${
                                progress < 50 ? 'text-green-500' : 
                                progress < 80 ? 'text-amber-500' : 
                                'text-red-500'
                              }`}>
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="relative h-3 bg-muted rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] mb-1">
                              <div 
                                className="absolute top-0 left-0 h-full rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out" 
                                style={{ 
                                  width: `${Math.min(progress, 100)}%`,
                                  background: 
                                    progress < 50 ? 'linear-gradient(90deg, #10B981, #34D399)' :  // Green
                                    progress < 80 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :  // Yellow
                                    'linear-gradient(90deg, #f43f5e, #ef4444)'                    // Red
                                }}
                              ></div>
                            </div>
                            
                            <div className="flex items-center justify-end">
                              <span className="text-xs text-muted-foreground">
                                ${remaining.toFixed(2)} remaining
                              </span>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}

                      {goals.filter(goal => {
                        const category = categories.find(c => c.id === goal.categoryId);
                        if (!category) return false;
                        const categoryTransactions = transactions.filter(t => t.categoryId === goal.categoryId && t.type === "expense");
                        const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        const limit = parseFloat(goal.targetAmount || "0") || 1;
                        const progress = (spent / limit) * 100;
                        return progress >= 50;
                      }).length === 0 && (
                        <div className="text-center py-3">
                          <p className="text-muted-foreground text-sm">No budgets in warning state</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpensePieChart transactions={transactions} categories={categories} />
                <IncomeExpenseChart transactions={transactions} />
              </div>

              {/* Investment Portfolio Chart */}
              <InvestmentPortfolioChart investments={investments} />

              {/* Recent Transactions */}
              <Card className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab("transactions")}
                      className="text-muted-foreground hover:text-primary"
                    >
                      View All
                    </Button>
                  </div>
                  
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No transactions yet. Start tracking your finances!</p>
                      <Button 
                        onClick={() => setShowAddIncome(true)}
                        className="bg-gradient-primary text-white shadow-glow"
                      >
                        Add First Transaction
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => {
                        const category = categories.find(c => c.id === transaction.categoryId);
                        const isIncome = transaction.type === "income";
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors duration-200">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${
                                isIncome 
                                  ? "bg-gradient-success" 
                                  : "bg-gradient-to-br from-destructive to-red-500"
                              }`}>
                                <DollarSign className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{transaction.description || "Transaction"}</p>
                                <p className="text-sm text-muted-foreground">{category?.name || transaction.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-bold ${
                                isIncome ? "text-success" : "text-destructive"
                              }`}>
                                {isIncome ? "+" : "-"} {smartFormatCurrency(parseFloat(transaction.amount)).replace(/^\$\s/, '')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="m-0">
            <div className="hidden md:block bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-dark">Transactions</h1>
                  <p className="text-gray-500 mt-1">Manage your income and expenses</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddIncome(true)} className="bg-gradient-success text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income
                  </Button>
                  <Button onClick={() => setShowAddExpense(true)} className="bg-gradient-to-br from-destructive to-red-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expenses</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {transactions.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No transactions found</p>
                        <Button onClick={() => setShowAddIncome(true)}>
                          Add Your First Transaction
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    transactions.map((transaction) => {
                      const category = categories.find(c => c.id === transaction.categoryId);
                      return (
                        <Card key={transaction.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                                  transaction.type === "income" ? "bg-secondary/10" : "bg-red-100"
                                }`}>
                                  <DollarSign className={`w-6 h-6 ${
                                    transaction.type === "income" ? "text-secondary" : "text-red-600"
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-semibold">{transaction.description || "Transaction"}</p>
                                  <p className="text-sm text-gray-500">
                                    {category?.name || transaction.type} • {new Date(transaction.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xl font-bold ${
                                  transaction.type === "income" ? "text-secondary" : "text-red-600"
                                }`}>
                                  {transaction.type === "income" ? "+" : "-"} {smartFormatCurrency(parseFloat(transaction.amount)).replace(/^\$\s/, '')}
                                </p>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="income" className="space-y-3">
                  {transactions.filter(t => t.type === "income").map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mr-4">
                                <DollarSign className="w-6 h-6 text-secondary" />
                              </div>
                              <div>
                                <p className="font-semibold">{transaction.description || "Income"}</p>
                                <p className="text-sm text-gray-500">
                                  {category?.name || "Income"} • {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-secondary">
                                +{smartFormatCurrency(parseFloat(transaction.amount)).replace(/^\$\s/, '')}
                              </p>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="expense" className="space-y-3">
                  {transactions.filter(t => t.type === "expense").map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                <DollarSign className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <p className="font-semibold">{transaction.description || "Expense"}</p>
                                <p className="text-sm text-gray-500">
                                  {category?.name || "Expense"} • {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-red-600">
                                -{smartFormatCurrency(parseFloat(transaction.amount)).replace(/^\$\s/, '')}
                              </p>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="m-0">
            <div className="hidden md:block bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-dark">Investments</h1>
                  <p className="text-gray-500 mt-1">Track your investment portfolio</p>
                </div>
                <Button onClick={() => setShowAddInvestment(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investment
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Portfolio Summary */}
              <Card className="bg-gradient-to-r from-secondary to-green-600 text-white">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium mb-2">Total Portfolio Value</h2>
                  <div className="text-3xl font-bold mb-2">
                    {smartFormatCurrency(totalInvestments)}
                  </div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>Portfolio performance</span>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Portfolio Chart */}
              {investments.length > 0 && (
                <InvestmentPortfolioChart investments={investments} />
              )}

              {/* Investment Holdings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {investments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500 mb-4">No investments found</p>
                      <Button onClick={() => setShowAddInvestment(true)}>
                        Add Your First Investment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  investments.map((investment, index) => (
                    <Card 
                      key={investment.id} 
                      onClick={() => setLocation(`/investment/${investment.id}`)}
                      className={`relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.35)] transition-shadow duration-300 rounded-xl
                        ${index % 4 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : ''}
                        ${index % 4 === 1 ? 'bg-gradient-to-br from-red-500 to-orange-600' : ''}
                        ${index % 4 === 2 ? 'bg-gradient-to-br from-green-500 to-teal-600' : ''}
                        ${index % 4 === 3 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : ''}
                      `}
                    >
                      <CardContent className="p-6 relative z-10 text-white">
                        <div className="absolute top-4 right-4 text-white/70">
                            <DollarSign className="w-8 h-8" />
                            </div>
                        <p className="text-sm font-medium text-white/90 mb-1 truncate">{investment.name}</p>
                        <div className="text-3xl font-bold text-white mb-4">
                            {smartFormatCurrency(parseFloat(investment.current_value))}
                            </div>

                        {/* Calculate profit */}
                        {(() => {
                          const initialValue = parseFloat(investment.initial_amount);
                          const currentValue = parseFloat(investment.current_value);
                          const profit = currentValue - initialValue;
                          const profitPercentage = ((profit / initialValue) * 100).toFixed(1);
                          
                          return (
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-1">
                                {profit >= 0 ? 
                                  <TrendingUp className="w-4 h-4 text-green-300" /> : 
                                  <TrendingDown className="w-4 h-4 text-red-300" />
                                }
                                <span className={`text-sm ${profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                  {profit >= 0 ? '+' : ''}{profitPercentage}%
                                </span>
                          </div>
                              
                              {/* Withdraw Profit Button - Only show if there's profit */}
                              {profit > 0 && (
                                <Button 
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    
                                    // Get investment asset
                                    const investmentAsset = assets.find(asset => asset.id === "4");
                                    if (!investmentAsset) return;
                                    
                                    // Update the investment asset balance
                                    const updatedAssets = assets.map(asset => {
                                      if (asset.id === "4") {
                                        return {
                                          ...asset,
                                          balance: asset.balance + profit
                                        };
                                      }
                                      return asset;
                                    });
                                    
                                    // Update the investment current value to initial amount
                                    const updatedInvestment = {
                                      ...investment,
                                      current_value: investment.initial_amount
                                    };
                                    
                                    try {
                                      // Save updated assets
                                      saveAssets(updatedAssets);
                                      
                                      // Update investment
                                      updateInvestment(investment.id, updatedInvestment);
                                      
                                      // Show success toast
                                      toast({
                                        title: "Profit Withdrawn",
                                        description: `${smartFormatCurrency(profit)} has been added to your investments asset.`,
                                        variant: "default",
                                      });
                                      
                                      // Refresh data
                                      refreshData();
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to withdraw profit.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Withdraw Profit
                            </Button>
                              )}
                          </div>
                          );
                        })()}

                        {/* Placeholder for the chart line */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-50">
                            <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' }}>
                                <path
                                    d={[
                                        "M0 10 L10 5 L20 15 L30 8 L40 12 L50 6 L60 14 L70 9 L80 16 L90 7 L100 11",
                                        "M0 15 L10 10 L20 18 L30 7 L40 13 L50 4 L60 16 L70 11 L80 19 L90 6 L100 12",
                                        "M0 8 L10 12 L20 6 L30 14 L40 7 L50 16 L60 5 L70 13 L80 9 L90 17 L100 10",
                                        "M0 12 L10 18 L20 7 L30 15 L40 6 L50 10 L60 8 L70 16 L80 5 L90 13 L100 9"
                                    ][index % 4]}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="m-0">
            <div className="hidden md:block bg-card border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Categories</h1>
                  <p className="text-muted-foreground mt-1 font-medium">Manage your income and expense categories</p>
                </div>
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* Quick Add Buttons */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">Quick Add</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    className="w-full h-12 bg-gradient-success text-white text-sm sm:text-base"
                    onClick={() => {
                      const event = new CustomEvent('preset-category-type', { detail: { type: 'income' } });
                      window.dispatchEvent(event);
                      setShowAddCategory(true);
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Income Category
                  </Button>
                  <Button 
                    className="w-full h-12 bg-gradient-to-br from-destructive to-red-500 text-white text-sm sm:text-base"
                    onClick={() => {
                      const event = new CustomEvent('preset-category-type', { detail: { type: 'expense' } });
                      window.dispatchEvent(event);
                      setShowAddCategory(true);
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Expense Category
                  </Button>
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink mx-4 text-muted-foreground text-sm">Categories List</span>
                <div className="flex-grow border-t border-border" />
              </div>

              {/* Category Filters */}
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expenses</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Category List */}
              <div className="space-y-3">
                {filteredCategories.map(category => (
                  <Card key={category.id} className="border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                          <div style={{ color: category.color }}>
                            {getIconComponent(category.icon)}
                          </div>
                              </div>
                              <div>
                                <p className="font-semibold">{category.name}</p>
                          {/*<p className="text-sm text-muted-foreground capitalize">{category.type} Category</p>*/}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                          style={{ 
                            backgroundColor: category.type === 'income' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
                            color: 'hsl(var(--success-foreground))'
                          }}
                              >
                                {category.type}
                              </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                        </CardContent>
                      </Card>
                ))}
                              </div>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="m-0">
            <div className="hidden md:block bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-dark">Goals</h1>
                  <p className="text-gray-500 mt-1">Set and track your financial goals</p>
                </div>
                <Button onClick={() => setShowAddGoal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {goals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No goals set yet</p>
                    <Button onClick={() => setShowAddGoal(true)}>
                      Set Your First Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                goals.map((goal) => {
                  const category = categories.find(c => c.id === goal.categoryId);
                  const categoryTransactions = transactions.filter(
                    t => t.categoryId === goal.categoryId && t.type === "expense"
                  );
                  const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                  const limit = parseFloat(goal.targetAmount);
                  const percentage = (spent / limit) * 100;
                  const isOverBudget = spent > limit;

                  return (
                    <Card key={goal.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{category?.name || "Category"}</h3>
                            <p className="text-sm text-gray-500">Monthly budget limit</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {smartFormatCurrency(spent)} / {smartFormatCurrency(limit)}
                            </p>
                            <p className={`text-sm ${isOverBudget ? "text-red-600" : "text-secondary"}`}>
                              {percentage.toFixed(1)}% {isOverBudget ? "over budget!" : "used"}
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="mb-2"
                        />
                        <p className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                          {isOverBudget 
                            ? `$${(spent - limit).toLocaleString()} over budget this month`
                            : `$${(limit - spent).toLocaleString()} left for this month`
                          }
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="m-0">
            <div className="hidden md:block bg-white dark:bg-background border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-dark dark:text-foreground">Reports</h1>
                  <p className="text-gray-500 dark:text-muted-foreground mt-1">Analyze your financial data</p>
                </div>
                <Button onClick={() => setShowExportReport(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Time Period Selector */}
              <Tabs defaultValue="month">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                  <TabsTrigger value="year">This Year</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Income</p>
                        <p className="text-2xl font-bold text-secondary">
                          {smartFormatCurrency(totalIncome)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          {smartFormatCurrency(totalExpenses)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Net Savings</p>
                        <p className="text-2xl font-bold text-primary">
                          {smartFormatCurrency(totalIncome - totalExpenses)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncomeExpenseChart transactions={transactions} />
                <ExpensePieChart transactions={transactions} categories={categories} />
              </div>
              
              {/* Investment Portfolio Chart in Reports */}
              <div className="mt-6">
                <InvestmentPortfolioChart investments={investments} />
                
                {/* Mobile Export Button */}
                <div className="flex justify-center mt-6 md:hidden">
                  <Button 
                    onClick={() => setShowExportReport(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals with refreshData callback */}
      <AddIncomeModal
        open={showAddIncome}
        onOpenChange={setShowAddIncome}
        categories={categories}
        onSuccess={refreshData}
      />
      <AddExpenseModal
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        categories={categories}
        onSuccess={refreshData}
      />
      <AddCategoryModal
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={refreshData}
      />
      <AddInvestmentModal
        open={showAddInvestment}
        onOpenChange={setShowAddInvestment}
        onSuccess={refreshData}
      />
      <AddGoalModal
        open={showAddGoal}
        onOpenChange={setShowAddGoal}
        categories={categories}
        onSuccess={refreshData}
      />
      <ExportReportModal
        open={showExportReport}
        onOpenChange={setShowExportReport}
        transactions={transactions}
        categories={categories}
        investments={investments}
      />
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => {
            setShowLoginModal(false);
            // Check if login was successful
            if (supabaseUser) {
              handleLoginSuccess();
            }
          }} 
        />
      )}
    </div>
  );
}
