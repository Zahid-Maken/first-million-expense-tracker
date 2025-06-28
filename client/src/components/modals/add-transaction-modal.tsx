import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { createTransaction } from "@/lib/localStorageService";
import { supabase } from "@/lib/supabase";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess?: () => void;
}

export default function AddTransactionModal({ open, onOpenChange, categories, onSuccess }: AddTransactionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  // Function to sync transaction to Supabase
  const syncTransactionToSupabase = async (transactionData: any) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("User not authenticated, skipping Supabase sync");
        return;
      }

      console.log("Syncing transaction to Supabase:", transactionData);

      // Format transaction for Supabase
      const supabaseTransaction = {
        id: transactionData.id,
        user_id: user.id,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description || '',
        date: new Date(transactionData.date).toISOString(),
        category_id: transactionData.categoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into Supabase
      const { error } = await supabase
        .from('transactions')
        .upsert(supabaseTransaction, { onConflict: 'id,user_id' });

      if (error) {
        console.error("Error syncing transaction to Supabase:", error);
        throw error;
      }

      console.log("Transaction synced to Supabase successfully");
    } catch (error) {
      console.error("Failed to sync transaction:", error);
      // Don't throw error here, we still want the local transaction to succeed
    }
  };

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
        date: new Date(formData.date)
      });
      
      // Sync to Supabase if user is authenticated
      await syncTransactionToSupabase(newTransaction);
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
      // Reset form and close modal
      setFormData({
        type: "expense",
        categoryId: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
      
      // Call onSuccess to refresh data
      if (onSuccess) onSuccess();
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: "income" | "expense") => 
                setFormData({ ...formData, type: value, categoryId: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
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
              <p className="text-sm text-gray-500 mt-1">
                No categories found. Create a category first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
