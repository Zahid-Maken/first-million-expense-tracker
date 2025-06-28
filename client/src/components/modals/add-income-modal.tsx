import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BanknoteIcon, CreditCard, Wallet, Building, PiggyBank } from "lucide-react";
import type { Category } from "@shared/schema";
import { createTransaction, saveAssets, getAssets } from "@/lib/localStorageService";

interface AddIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
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

export default function AddIncomeModal({ open, onOpenChange, categories, onSuccess }: AddIncomeModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "income" as "income",
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    receivedIn: "cash" as "cash" | "card" | "bank" | "assets" | "other"
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        type: "income",
        categoryId: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        receivedIn: "cash"
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
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
      // Save to localStorage
      createTransaction({
        ...formData,
        userEmail: 'local@user.com',
        categoryId: parseInt(formData.categoryId),
        amount: formData.amount,
        date: new Date(formData.date).toISOString(),
        paidThrough: null
      });
      
      // Also update the assets directly to ensure immediate consistency
      const amount = parseFloat(formData.amount);
      const selectedMethod = formData.receivedIn;
      const assetId = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.assetId;
      
      if (assetId) {
        const assets = getAssets();
        const existingAsset = assets.find(a => a.id === assetId);
        
        if (existingAsset) {
          // Update existing asset
          const updatedAssets = assets.map(asset => 
            asset.id === assetId 
              ? { ...asset, balance: asset.balance + amount }
              : asset
          );
          saveAssets(updatedAssets);
        } else {
          // Create new asset with appropriate data based on method
          const newAsset = {
            id: assetId,
            name: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || selectedMethod,
            balance: amount,
            color: getColorForAssetId(assetId)
          };
          saveAssets([...assets, newAsset]);
        }
      }
      
      toast({
        title: "Success",
        description: "Income added successfully",
      });
      
      // Call onSuccess to refresh data
      if (onSuccess) onSuccess();
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add income",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get color based on asset ID
  const getColorForAssetId = (id: string): string => {
    switch(id) {
      case "1": return "from-blue-500 to-blue-600";
      case "2": return "from-purple-500 to-purple-600";
      case "3": return "from-green-500 to-green-600";
      case "4": return "from-amber-500 to-amber-600";
      case "5": return "from-indigo-500 to-indigo-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const filteredCategories = categories.filter(c => c.type === "income");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gradient-primary">Add Income</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category" className="text-foreground font-medium">Category</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-primary">
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
              className="bg-muted/50 border-input hover:bg-muted focus:ring-primary"
            />
          </div>

          <div>
            <Label htmlFor="receivedIn" className="text-foreground font-medium">Received In</Label>
            <Select 
              value={formData.receivedIn} 
              onValueChange={(value: "cash" | "card" | "bank" | "assets" | "other") => 
                setFormData({ ...formData, receivedIn: value })
              }
            >
              <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-primary">
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
          </div>

          <div>
            <Label htmlFor="description" className="text-foreground font-medium">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter income description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-muted/50 border-input hover:bg-muted focus:ring-primary min-h-[80px]"
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
              className="bg-muted/50 border-input hover:bg-muted focus:ring-primary"
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
              disabled={isSubmitting}
              className="bg-gradient-success text-white shadow-[0_4px_10px_rgba(0,220,130,0.3)] hover:shadow-[0_6px_15px_rgba(0,220,130,0.4)]"
            >
              {isSubmitting ? "Adding..." : "Add Income"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 