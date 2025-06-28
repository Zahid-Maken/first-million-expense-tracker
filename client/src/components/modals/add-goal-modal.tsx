import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createGoal, getGoals, updateGoal } from "@/lib/localStorageService";
import type { Category } from "@shared/schema";
import { Target } from "lucide-react";

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess?: () => void;
}

export default function AddGoalModal({ open, onOpenChange, categories, onSuccess }: AddGoalModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    limitAmount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.limitAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const categoryId = parseInt(formData.categoryId);
      const newLimitAmount = parseFloat(formData.limitAmount);
      
      // Check if a goal already exists for this category
      const existingGoals = getGoals();
      const existingGoal = existingGoals.find(goal => goal.categoryId === categoryId);
      
      if (existingGoal) {
        // Update existing goal by adding the new limit to the current target
        const currentLimit = parseFloat(existingGoal.targetAmount);
        const updatedLimit = (currentLimit + newLimitAmount).toString();
        
        updateGoal(existingGoal.id, {
          targetAmount: updatedLimit
        });
        
        toast({
          title: "Success",
          description: `Budget limit updated to ${updatedLimit} for ${categories.find(c => c.id === categoryId)?.name}`,
        });
      } else {
        // Create new goal
        createGoal({
          userEmail: 'local@user.com',
          categoryId: categoryId,
          name: categories.find(c => c.id === categoryId)?.name || 'Budget Goal',
          targetAmount: formData.limitAmount,
          completed: false,
        });
        
        toast({
          title: "Success",
          description: "Budget goal created successfully",
        });
      }
      
      // Reset form and close modal
      setFormData({
        categoryId: "",
        limitAmount: "",
      });
      
      // Call onSuccess to refresh data
      if (onSuccess) onSuccess();
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget goal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = categories.filter(c => c.type === "expense");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
            <Target className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-violet-600">Set Budget Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="category" className="text-foreground font-medium">Expense Category</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-violet-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {expenseCategories.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No expense categories found. Create expense categories first.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="limitAmount" className="text-foreground font-medium">Monthly Budget Limit</Label>
            <Input
              id="limitAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.limitAmount}
              onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
              required
              className="bg-muted/50 border-input hover:bg-muted focus:ring-violet-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set a monthly spending limit for this category
            </p>
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
              disabled={isSubmitting}
              className="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_4px_10px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_15px_rgba(124,58,237,0.4)]"
            >
              {isSubmitting ? "Creating..." : "Set Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
