import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, BanknoteIcon, CreditCard, Wallet, Building, PiggyBank } from "lucide-react";
import type { Category } from "@shared/schema";
import { createTransaction, getTransactions, getAssets, subscribe, saveAssets } from "@/lib/localStorageService";
import { formatCurrency } from "@/lib/currencyUtils";
import { supabase } from "@/lib/supabase";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  onSuccess?: () => void;
}

// Define available payment methods with their display names and icons
const PAYMENT_METHODS = [
  { id: "bank", name: "Bank Account", icon: <BanknoteIcon className="w-4 h-4 mr-2" />, assetId: "1" },
  { id: "card", name: "Credit Card", icon: <CreditCard className="w-4 h-4 mr-2" />, assetId: "2" },
  { id: "cash", name: "Cash", icon: <Wallet className="w-4 h-4 mr-2" />, assetId: "3" },
  { id: "assets", name: "Investments", icon: <Building className="w-4 h-4 mr-2" />, assetId: "4" },
  { id: "other", name: "Other Assets", icon: <PiggyBank className="w-4 h-4 mr-2" />, assetId: "5" }
];

// Map payment method IDs to asset IDs
const PAYMENT_TO_ASSET_ID = {
  "bank": "1",
  "card": "2",
  "cash": "3",
  "assets": "4",
  "other": "5"
};

export default function AddExpenseModal({ open, onOpenChange, categories = [], onSuccess }: AddExpenseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "expense",
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    paidThrough: "cash" as "cash" | "card" | "bank" | "assets" | "other"
  });
  const [availableBalances, setAvailableBalances] = useState({
    cash: 0,
    card: 0,
    bank: 0,
    assets: 0,
    other: 0
  });
  const [errorMessage, setErrorMessage] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        type: "expense",
        categoryId: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        paidThrough: "cash"
      });
      setErrorMessage("");
      loadBalances();
    }
  }, [open]);

  // Load balances from assets
  const loadBalances = () => {
    const assets = getAssets();
    
    if (assets.length > 0) {
      // If we have assets stored, use those balances
      const newBalances = {
        bank: 0,
        card: 0,
        cash: 0,
        assets: 0,
        other: 0
      };
      
      assets.forEach(asset => {
        switch(asset.id) {
          case "1": newBalances.bank = asset.balance; break;
          case "2": newBalances.card = asset.balance; break;
          case "3": newBalances.cash = asset.balance; break;
          case "4": newBalances.assets = asset.balance; break;
          case "5": newBalances.other = asset.balance; break;
        }
      });
      
      setAvailableBalances(newBalances);
      return;
    }
    
    // Fallback to calculating from transactions
    const transactions = getTransactions();
    
    // Calculate income by payment method
    const incomeByMethod = transactions.reduce((acc, transaction) => {
      if (transaction.type === "income") {
        const method = transaction.receivedIn || "bank"; // Default to bank if not specified
        const amount = parseFloat(transaction.amount as any);
        
        switch (method) {
          case "bank":
            acc.bank += amount;
            break;
          case "cash":
            acc.cash += amount;
            break;
          case "card":
            acc.card += amount;
            break;
          case "assets":
            acc.assets += amount;
            break;
          case "other":
            acc.other += amount;
            break;
        }
      }
      return acc;
    }, { bank: 0, cash: 0, card: 0, assets: 0, other: 0 });

    // Calculate expenses by payment method
    const expensesByMethod = transactions.reduce((acc, transaction) => {
      if (transaction.type === "expense") {
        const method = transaction.paidThrough || "cash"; // Default to cash if not specified
        const amount = parseFloat(transaction.amount as any);
        
        switch (method) {
          case "bank":
            acc.bank += amount;
            break;
          case "cash":
            acc.cash += amount;
            break;
          case "card":
            acc.card += amount;
            break;
          case "assets":
            acc.assets += amount;
            break;
          case "other":
            acc.other += amount;
            break;
        }
      }
      return acc;
    }, { bank: 0, cash: 0, card: 0, assets: 0, other: 0 });

    // Calculate available balances (ensuring none are negative)
    setAvailableBalances({
      cash: Math.max(0, incomeByMethod.cash - expensesByMethod.cash),
      card: Math.max(0, incomeByMethod.card - expensesByMethod.card),
      bank: Math.max(0, incomeByMethod.bank - expensesByMethod.bank),
      assets: Math.max(0, incomeByMethod.assets - expensesByMethod.assets),
      other: Math.max(0, incomeByMethod.other - expensesByMethod.other)
    });
  };

  // Function to sync expense transaction and asset update to Supabase
  const syncToSupabase = async (transaction: any, assetId?: string, assetBalance?: number) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("User not authenticated, skipping Supabase sync");
        return;
      }

      console.log("Syncing expense transaction to Supabase");

      // Format transaction for Supabase
      const supabaseTransaction = {
        id: transaction.id,
        user_id: user.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount as any),
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString(),
        category_id: transaction.categoryId,
        paid_through: transaction.paidThrough,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert transaction into Supabase
      const { error: txError } = await supabase
        .from('transactions')
        .upsert(supabaseTransaction, { onConflict: 'id,user_id' });

      if (txError) {
        console.error("Error syncing transaction to Supabase:", txError);
      } else {
        console.log("Expense transaction synced to Supabase successfully");
      }

      // Update asset in Supabase if applicable
      if (assetId && assetBalance !== undefined) {
        const { error: assetError } = await supabase
          .from('assets')
          .upsert({
            id: parseInt(assetId),
            user_id: user.id,
            balance: assetBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id,user_id' });

        if (assetError) {
          console.error("Error updating asset in Supabase:", assetError);
        } else {
          console.log(`Asset ${assetId} updated in Supabase successfully`);
        }
      }
    } catch (error) {
      console.error("Failed to sync data to Supabase:", error);
      // Don't throw error, we still want the local operation to succeed
    }
  };

  // Subscribe to asset changes
  useEffect(() => {
    const unsubscribe = subscribe('assets', loadBalances);
    
    // Load balances initially
    loadBalances();
    
    return () => unsubscribe();
  }, []);

  // Clear error when amount or payment method changes
  useEffect(() => {
    setErrorMessage("");
  }, [formData.amount, formData.paidThrough]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there's enough balance
    const amount = parseFloat(formData.amount);
    const availableBalance = availableBalances[formData.paidThrough];
    
    if (amount > availableBalance) {
      setErrorMessage(`Insufficient funds in ${
        PAYMENT_METHODS.find(m => m.id === formData.paidThrough)?.name || formData.paidThrough
      }. Available balance: ${formatCurrency(availableBalance)}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user email
      let userEmail = 'local@user.com';
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        userEmail = user.email;
      }

      // Save to localStorage
      const newTransaction = createTransaction({
        ...formData,
        userEmail,
        categoryId: parseInt(formData.categoryId),
        amount: formData.amount,
        date: new Date(formData.date).toISOString(),
        receivedIn: null
      });
      
      // Also update the assets directly to ensure immediate consistency
      const selectedMethod = formData.paidThrough;
      const assetId = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.assetId;
      let updatedAssetBalance = null;
      
      if (assetId) {
        const assets = getAssets();
        const existingAsset = assets.find(a => a.id === assetId);
        
        if (existingAsset) {
          // Update existing asset - subtract the expense amount
          updatedAssetBalance = Math.max(0, existingAsset.balance - amount);
          const updatedAssets = assets.map(asset => 
            asset.id === assetId 
              ? { ...asset, balance: updatedAssetBalance }
              : asset
          );
          saveAssets(updatedAssets);
        }
      }
      
      // Sync to Supabase
      await syncToSupabase(newTransaction, assetId, updatedAssetBalance);
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      
      // Call onSuccess to refresh data
      if (onSuccess) onSuccess();
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === "expense");

  // Get available balance for the selected payment method
  const currentAvailableBalance = availableBalances[formData.paidThrough];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">Add Expense</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category" className="text-foreground font-medium">Category</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-destructive">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No categories found. Create a category first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount" className="text-foreground font-medium">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="bg-muted/50 border-input hover:bg-muted focus:ring-destructive"
            />
          </div>

          <div>
            <Label htmlFor="paidThrough" className="text-foreground font-medium">Paid Through</Label>
            <Select 
              value={formData.paidThrough} 
              onValueChange={(value: "cash" | "card" | "bank" | "assets" | "other") => 
                setFormData({ ...formData, paidThrough: value })
              }
            >
              <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-destructive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center">
                      {method.icon}
                      {method.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Display available balance */}
            <p className="text-sm mt-1 text-muted-foreground">
              Available balance: {formatCurrency(currentAvailableBalance)}
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <div>
            <Label htmlFor="description" className="text-foreground font-medium">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-muted/50 border-input hover:bg-muted focus:ring-destructive min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-foreground font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="bg-muted/50 border-input hover:bg-muted focus:ring-destructive"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !!errorMessage || (parseFloat(formData.amount || "0") > currentAvailableBalance)}
              className="bg-gradient-to-br from-destructive to-red-500 text-white shadow-[0_4px_10px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_15px_rgba(220,38,38,0.4)]"
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
