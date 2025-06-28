import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createInvestment, getAssets, createTransaction, subscribe, saveAssets } from "@/lib/localStorageService";
import { LineChart, DollarSign, Percent, AlertCircle } from "lucide-react";
import type { Asset } from "@/lib/localStorageService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/currencyUtils";

interface AddInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddInvestmentModal({ open, onOpenChange, onSuccess }: AddInvestmentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [availableBalances, setAvailableBalances] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    initial_amount: "",
    paid_from_asset_id: "",
    profit_strategy: "manual" as "manual" | "automatic",
    profit_type: "fixed" as "fixed" | "percentage",
    profit_value: "",
    profit_frequency: "monthly" as "weekly" | "monthly" | "yearly",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setAssets(getAssets());
      loadBalances();
      setErrorMessage("");
    }
  }, [open]);

  useEffect(() => {
    const unsubscribe = subscribe('assets', loadBalances);
    loadBalances(); // Initial load
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setErrorMessage("");
  }, [formData.initial_amount, formData.paid_from_asset_id]);

  const loadBalances = () => {
    const allAssets = getAssets();
    const newBalances: Record<string, number> = {};
    allAssets.forEach(asset => {
      newBalances[asset.id] = asset.balance;
    });
    setAvailableBalances(newBalances);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.initial_amount || !formData.paid_from_asset_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const initialAmount = parseFloat(formData.initial_amount);
    const selectedAssetId = formData.paid_from_asset_id;
    const availableBalance = availableBalances[selectedAssetId];

    if (initialAmount > availableBalance) {
      setErrorMessage(`Insufficient funds in ${
        assets.find(a => a.id === selectedAssetId)?.name || "selected account"
      }. Available: ${formatCurrency(availableBalance)}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const investmentData: any = {
        userEmail: 'local@user.com',
        name: formData.name,
        initial_amount: formData.initial_amount,
        current_value: formData.initial_amount, // Current value is same as initial
        paid_from_asset_id: formData.paid_from_asset_id,
        profit_strategy: formData.profit_strategy,
        notes: formData.notes,
        investment_type: 'business'
      };

      if (formData.profit_strategy === 'automatic') {
        if (!formData.profit_value) {
          toast({ title: "Error", description: "Please enter a profit value for the automatic strategy.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        investmentData.profit_type = formData.profit_type;
        investmentData.profit_value = formData.profit_value;
        investmentData.profit_frequency = formData.profit_frequency;
      }
      
      // 1. Create the investment
      createInvestment(investmentData);

      // 2. Create corresponding expense transaction
      createTransaction({
        userEmail: 'local@user.com',
        type: 'expense',
        amount: formData.initial_amount,
        description: `Investment in ${formData.name}`,
        date: new Date().toISOString().split('T')[0], // Today's date
        paidThrough: "assets", // Use "assets" as the payment method type
        receivedIn: null,
        categoryId: null as any,
      });

      // 3. Update asset balance
      const updatedAssets = assets.map(asset => 
        asset.id === selectedAssetId 
          ? { ...asset, balance: Math.max(0, asset.balance - initialAmount) }
          : asset
      );
      saveAssets(updatedAssets);
      
      toast({
        title: "Success",
        description: "Investment added and expense recorded successfully",
      });
      
      // Reset form and close modal
      setFormData({
        name: "",
        initial_amount: "",
        paid_from_asset_id: "",
        profit_strategy: "manual",
        profit_type: "fixed",
        profit_value: "",
        profit_frequency: "monthly",
        notes: "",
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add investment. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="w-12 h-12 bg-gradient-warning rounded-2xl flex items-center justify-center shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-gradient-warning">Add Business Investment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 max-h-[80vh] overflow-y-auto px-1">
          <div>
            <Label htmlFor="name" className="text-foreground font-medium">Investment Name</Label>
            <Input
              id="name"
              placeholder="e.g., Local Coffee Shop"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initial_amount" className="text-foreground font-medium">Initial Investment</Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                required
                className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="paid_from_asset_id" className="text-foreground font-medium">Paid Through</Label>
              <Select
                value={formData.paid_from_asset_id}
                onValueChange={(value) => setFormData({ ...formData, paid_from_asset_id: value })}
              >
                <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500">
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id.toString()}>
                      <div className="flex items-center justify-between">
                        <span>{asset.name}</span>
                        <span className="text-muted-foreground text-sm">{formatCurrency(availableBalances[asset.id] || 0)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <Label className="text-foreground font-medium">Profit Strategy</Label>
            <RadioGroup
              value={formData.profit_strategy}
              onValueChange={(value: "manual" | "automatic") => setFormData({ ...formData, profit_strategy: value })}
              className="flex items-center space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual"/>
                <Label htmlFor="manual">Unsure / Manual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="automatic" id="automatic" />
                <Label htmlFor="automatic">Automatic</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.profit_strategy === 'automatic' && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground font-medium">Profit Type</Label>
                   <RadioGroup
                    value={formData.profit_type}
                    onValueChange={(value: "fixed" | "percentage") => setFormData({ ...formData, profit_type: value })}
                    className="flex items-center space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed"/>
                      <Label htmlFor="fixed">Fixed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentage</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="profit_value" className="text-foreground font-medium">
                    {formData.profit_type === 'fixed' ? 'Profit Amount' : 'Profit Percentage'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="profit_value"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 100 or 5"
                      value={formData.profit_value}
                      onChange={(e) => setFormData({ ...formData, profit_value: e.target.value })}
                      required
                      className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500 pl-8"
                    />
                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      {formData.profit_type === 'fixed' ? <DollarSign className="w-4 h-4 text-muted-foreground" /> : <Percent className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="profit_frequency" className="text-foreground font-medium">Frequency</Label>
                <Select
                  value={formData.profit_frequency}
                  onValueChange={(value: "weekly" | "monthly" | "yearly") => setFormData({ ...formData, profit_frequency: value })}
                >
                  <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-foreground font-medium">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Partnership details, terms, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-muted/50 border-input hover:bg-muted focus:ring-amber-500 min-h-[80px]"
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
              className="bg-gradient-warning text-white shadow-[0_4px_10px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_15px_rgba(245,158,11,0.4)]"
            >
              {isSubmitting ? "Adding..." : "Add Investment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
