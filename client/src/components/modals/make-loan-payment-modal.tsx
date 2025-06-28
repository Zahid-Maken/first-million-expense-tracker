import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, BanknoteIcon, CreditCard, Wallet, Building, PiggyBank, CheckCircle, InfoIcon } from "lucide-react";
import { getAssets, saveAssets, subscribe } from "@/lib/localStorageService";
import { formatCurrency } from "@/lib/currencyUtils";

// Define available payment methods with their display names and icons
const PAYMENT_METHODS = [
  { id: "bank", name: "Bank Account", icon: <BanknoteIcon className="w-4 h-4 mr-2" />, assetId: "1" },
  { id: "card", name: "Credit Card", icon: <CreditCard className="w-4 h-4 mr-2" />, assetId: "2" },
  { id: "cash", name: "Cash", icon: <Wallet className="w-4 h-4 mr-2" />, assetId: "3" },
  { id: "assets", name: "Investments", icon: <Building className="w-4 h-4 mr-2" />, assetId: "4" },
  { id: "other", name: "Other Assets", icon: <PiggyBank className="w-4 h-4 mr-2" />, assetId: "5" }
];

// Calculate payment based on frequency
const calculatePaymentAmount = (amount: number, frequency: string): number => {
  if (!amount) return 0;
  
  switch (frequency) {
    case "weekly":
      // Convert monthly payment to weekly (monthly * 12 / 52)
      return amount * 12 / 52;
    case "biweekly":
      // Convert monthly payment to biweekly (monthly * 12 / 26)
      return amount * 12 / 26;
    case "monthly":
    default:
      return amount;
  }
};

// Calculate interest for a period based on remaining balance
const calculateInterestForPeriod = (loan: Loan | null): number => {
  if (!loan || loan.paymentType !== "interest") return 0;
  
  // Calculate the interest rate per period
  let periodRate = loan.interestRate / 100 / 12; // Monthly rate
  
  if (loan.paymentFrequency === "weekly") {
    periodRate = periodRate * 12 / 52; // Weekly rate
  } else if (loan.paymentFrequency === "biweekly") {
    periodRate = periodRate * 12 / 26; // Biweekly rate
  }
  
  // Calculate interest for this period
  return loan.remainingAmount * periodRate;
};

// Calculate fixed charge for a period
const calculateFixedChargeForPeriod = (loan: Loan | null): number => {
  if (!loan || loan.paymentType !== "fixed") return 0;
  
  // If frequencies match, return the fixed charge directly
  if (loan.fixedChargeFrequency === loan.paymentFrequency) {
    return loan.fixedCharge;
  }
  
  // Otherwise convert to the right frequency
  let monthlyCharge = loan.fixedCharge;
  
  // Convert to monthly first
  if (loan.fixedChargeFrequency === "weekly") {
    monthlyCharge = monthlyCharge * 52 / 12;
  } else if (loan.fixedChargeFrequency === "biweekly") {
    monthlyCharge = monthlyCharge * 26 / 12;
  }
  
  // Then convert to target frequency
  if (loan.paymentFrequency === "weekly") {
    return monthlyCharge * 12 / 52;
  } else if (loan.paymentFrequency === "biweekly") {
    return monthlyCharge * 12 / 26;
  }
  
  return monthlyCharge;
};

// Calculate minimum payment based on date
const calculateMinimumPayment = (loan: Loan | null): number => {
  if (!loan) return 0;
  
  const today = new Date();
  const nextPaymentDate = new Date(loan.nextPaymentDate);
  const regularPayment = calculatePaymentAmount(loan.monthlyPayment, loan.paymentFrequency);
  
  // If payment is overdue, calculate how many periods have passed
  if (nextPaymentDate < today) {
    const daysDiff = Math.floor((today.getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (loan.paymentFrequency === "weekly") {
      const weeksPassed = Math.floor(daysDiff / 7) + 1;
      return Math.min(regularPayment * weeksPassed, loan.remainingAmount);
    } else if (loan.paymentFrequency === "biweekly") {
      const biWeeksPassed = Math.floor(daysDiff / 14) + 1;
      return Math.min(regularPayment * biWeeksPassed, loan.remainingAmount);
    } else {
      // Monthly
      const monthsPassed = Math.floor(daysDiff / 30) + 1;
      return Math.min(regularPayment * monthsPassed, loan.remainingAmount);
    }
  }
  
  // If not overdue, return regular payment
  return Math.min(regularPayment, loan.remainingAmount);
};

// Calculate amortization for a payment
const calculateAmortization = (loan: Loan | null, paymentAmount: number): { principal: number, interest: number, charge: number } => {
  if (!loan || !paymentAmount) {
    return { principal: 0, interest: 0, charge: 0 };
  }
  
  if (loan.paymentType === "interest") {
    // Calculate interest portion first
    const interestPortion = calculateInterestForPeriod(loan);
    
    // Principal is the remaining amount after interest
    const principalPortion = Math.min(paymentAmount - interestPortion, loan.remainingAmount);
    
    return {
      principal: Math.max(0, principalPortion),
      interest: interestPortion,
      charge: 0
    };
  } else {
    // For fixed charge loans
    const chargePortion = calculateFixedChargeForPeriod(loan);
    
    // Principal is the remaining amount after charge
    const principalPortion = Math.min(paymentAmount - chargePortion, loan.remainingAmount);
    
    return {
      principal: Math.max(0, principalPortion),
      interest: 0,
      charge: chargePortion
    };
  }
};

interface Loan {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  remainingAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  lender: string;
  startDate: string;
  term: number;
  receivedIn: string;
  paymentFrequency: "weekly" | "biweekly" | "monthly";
  paymentType: "interest" | "fixed";
  fixedCharge: number;
  fixedChargeFrequency?: "weekly" | "biweekly" | "monthly";
  totalPayment?: number;
  manualTotalPayment?: boolean;
}

interface MakeLoanPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  onSuccess: (updatedLoan: Loan, isFullyPaid: boolean) => void;
}

export default function MakeLoanPaymentModal({ 
  open, 
  onOpenChange, 
  loan, 
  onSuccess 
}: MakeLoanPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paidThrough: "bank" as "cash" | "card" | "bank" | "assets" | "other",
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [availableBalances, setAvailableBalances] = useState({
    cash: 0,
    card: 0,
    bank: 0,
    assets: 0,
    other: 0
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const [minimumPayment, setMinimumPayment] = useState(0);
  const [amortization, setAmortization] = useState({ principal: 0, interest: 0, charge: 0 });

  // Reset form when modal opens or loan changes
  useEffect(() => {
    if (open && loan) {
      // Calculate minimum payment based on date
      const minPayment = calculateMinimumPayment(loan);
      setMinimumPayment(minPayment);
      
      // Check if payment is overdue
      const today = new Date();
      const nextPaymentDate = new Date(loan.nextPaymentDate);
      setIsOverdue(nextPaymentDate < today);
      
      // Set default payment to the minimum payment
      setFormData({
        amount: minPayment.toFixed(2),
        paidThrough: "bank",
        paymentDate: new Date().toISOString().split('T')[0],
      });
      
      // Calculate initial amortization
      setAmortization(calculateAmortization(loan, minPayment));
      
      setErrorMessage("");
      setPaymentComplete(false);
      loadBalances();
    }
  }, [open, loan]);

  // Update amortization when amount changes
  useEffect(() => {
    if (loan && formData.amount) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        setAmortization(calculateAmortization(loan, amount));
      }
    }
  }, [formData.amount, loan]);

  // Load balances from assets
  const loadBalances = () => {
    const assets = getAssets();
    
    if (assets.length > 0) {
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
    }
  };

  // Subscribe to asset changes
  useEffect(() => {
    const unsubscribe = subscribe('assets', loadBalances);
    loadBalances();
    return () => unsubscribe();
  }, []);

  // Clear error when amount or payment method changes
  useEffect(() => {
    setErrorMessage("");
  }, [formData.amount, formData.paidThrough]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loan || !formData.amount) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there's enough balance
    const amount = parseFloat(formData.amount);
    const availableBalance = availableBalances[formData.paidThrough];
    
    if (amount <= 0) {
      setErrorMessage("Payment amount must be greater than zero");
      return;
    }
    
    if (amount > availableBalance) {
      setErrorMessage(`Insufficient funds in ${
        PAYMENT_METHODS.find(m => m.id === formData.paidThrough)?.name || formData.paidThrough
      }. Available balance: ${formatCurrency(availableBalance)}`);
      return;
    }
    
    // Check if payment exceeds remaining amount
    if (amortization.principal > loan.remainingAmount) {
      setErrorMessage(`Payment amount exceeds the remaining balance of ${formatCurrency(loan.remainingAmount)}`);
      return;
    }
    
    setIsSubmitting(true);
    
    // Add a safety timeout to prevent UI from getting stuck - reduced from 10s to 5s
    const safetyTimeout = setTimeout(() => {
      // If we reach this point, something went wrong with the processing
      setIsSubmitting(false);
      toast({
        title: "Processing timeout",
        description: "The payment is taking longer than expected. Please try again.",
        variant: "destructive",
      });
    }, 5000); // 5 second timeout
    
    try {
      // Update the asset balance
      const selectedMethod = formData.paidThrough;
      const assetId = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.assetId;
      
      if (assetId) {
        const assets = getAssets();
        const existingAsset = assets.find(a => a.id === assetId);
        
        if (existingAsset) {
          // Update existing asset - subtract the payment amount
          const updatedAssets = assets.map(asset => 
            asset.id === assetId 
              ? { ...asset, balance: Math.max(0, asset.balance - amount) }
              : asset
          );
          saveAssets(updatedAssets);
        }
      }
      
      // Calculate new remaining amount - only reduce by principal portion
      const newRemainingAmount = loan.remainingAmount - amortization.principal;
      const isFullyPaid = newRemainingAmount <= 0;
      
      // Update next payment date
      let nextPaymentDate = new Date(loan.nextPaymentDate);
      
      // If payment is overdue, calculate the new next payment date from today
      if (isOverdue) {
        nextPaymentDate = new Date();
      }
      
      // Add appropriate time based on frequency
      if (loan.paymentFrequency === "weekly") {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
      } else if (loan.paymentFrequency === "biweekly") {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
      } else {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      
      // Create updated loan object
      const updatedLoan: Loan = {
        ...loan,
        remainingAmount: Math.max(0, newRemainingAmount),
        nextPaymentDate: nextPaymentDate.toISOString().split('T')[0]
      };
      
      // Show success animation
      setPaymentComplete(true);
      
      // Clear the safety timeout since processing completed successfully
      clearTimeout(safetyTimeout);
      
      // Call onSuccess to update the loan in parent component - reduced delay from 1500ms to 800ms
      setTimeout(() => {
        onSuccess(updatedLoan, isFullyPaid);
        
        // Show appropriate toast message
        if (isFullyPaid) {
          toast({
            title: "Loan Paid Off!",
            description: "Congratulations! You've fully paid off this loan.",
          });
        } else {
          toast({
            title: "Payment Successful",
            description: `Payment of ${formatCurrency(amount)} applied successfully.`,
          });
        }
        
        // Close modal after showing success animation - reduced from 500ms to 300ms
        setTimeout(() => {
          setPaymentComplete(false);
          onOpenChange(false);
        }, 300);
      }, 800);
      
    } catch (error) {
      // Clear the safety timeout since we're handling the error
      clearTimeout(safetyTimeout);
      
      console.error("Payment processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      setPaymentComplete(false);
    }
  };

  // Get available balance for the selected payment method
  const currentAvailableBalance = availableBalances[formData.paidThrough];

  // Calculate payment options
  const paymentOptions = loan ? [
    { 
      label: `Minimum Payment (${formatCurrency(minimumPayment)})`, 
      value: minimumPayment.toString() 
    },
    { 
      label: `Regular Payment (${formatCurrency(calculatePaymentAmount(loan.monthlyPayment, loan.paymentFrequency))})`, 
      value: calculatePaymentAmount(loan.monthlyPayment, loan.paymentFrequency).toString() 
    },
    { 
      label: `Remaining Balance (${formatCurrency(loan.remainingAmount)})`, 
      value: (loan.remainingAmount + (loan.paymentType === "interest" ? calculateInterestForPeriod(loan) : calculateFixedChargeForPeriod(loan))).toString() 
    }
  ] : [];

  // If payment is complete, show success screen
  if (paymentComplete) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-w-[95vw] bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)]">
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Payment Successful</h2>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 bg-card/95 backdrop-blur-sm border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)] overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-xl font-bold text-primary">Make Loan Payment</DialogTitle>
        </DialogHeader>
        
        {loan && (
          <form onSubmit={handleSubmit} className="overflow-auto max-h-[80vh]">
            <div className="px-4 space-y-4 pb-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <h3 className="font-medium mb-1 text-sm">{loan.name}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-muted-foreground">Remaining Balance:</div>
                  <div className="text-right font-medium">{formatCurrency(loan.remainingAmount)}</div>
                  
                  <div className="text-muted-foreground">Regular Payment:</div>
                  <div className="text-right font-medium">{formatCurrency(calculatePaymentAmount(loan.monthlyPayment, loan.paymentFrequency))}</div>
                  
                  <div className="text-muted-foreground">Next Payment Date:</div>
                  <div className="text-right font-medium flex items-center justify-end">
                    {new Date(loan.nextPaymentDate).toLocaleDateString()}
                    {isOverdue && (
                      <span className="ml-1 px-1 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-sm">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                
                {isOverdue && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                    <InfoIcon className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-500">
                      This payment is overdue. The minimum payment amount has been adjusted.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground font-medium text-sm">Payment Amount</Label>
                <div className="flex flex-col space-y-2 mb-2">
                  {paymentOptions.map((option, index) => (
                    <Button 
                      key={index}
                      type="button"
                      variant="outline"
                      className="text-sm h-9 border-input hover:bg-muted w-full flex justify-between items-center px-3"
                      onClick={() => setFormData({...formData, amount: option.value})}
                    >
                      <span>{option.label.split('(')[0]}</span>
                      <span className="font-semibold">{option.label.includes('(') ? `(${option.label.split('(')[1]}` : ''}</span>
                    </Button>
                  ))}
                </div>
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

              {/* Payment breakdown */}
              {parseFloat(formData.amount) > 0 && (
                <div className="bg-muted/30 p-3 rounded-lg text-xs">
                  <h4 className="font-medium mb-1">Payment Breakdown</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span>{formatCurrency(amortization.principal)}</span>
                    </div>
                    {loan.paymentType === "interest" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest:</span>
                        <span>{formatCurrency(amortization.interest)}</span>
                      </div>
                    )}
                    {loan.paymentType === "fixed" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fixed Charge:</span>
                        <span>{formatCurrency(amortization.charge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1 border-t border-muted">
                      <span>Total Payment:</span>
                      <span>{formatCurrency(parseFloat(formData.amount))}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paidThrough" className="text-foreground font-medium text-sm">Pay From</Label>
                <Select 
                  value={formData.paidThrough} 
                  onValueChange={(value: "cash" | "card" | "bank" | "assets" | "other") => 
                    setFormData({ ...formData, paidThrough: value })
                  }
                >
                  <SelectTrigger className="bg-muted/50 border-input hover:bg-muted focus:ring-primary h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 bg-gradient-to-r ${
                            method.id === "bank" ? "from-blue-500 to-blue-600" : 
                            method.id === "card" ? "from-purple-500 to-purple-600" :
                            method.id === "cash" ? "from-green-500 to-green-600" :
                            method.id === "assets" ? "from-amber-500 to-amber-600" :
                            "from-indigo-500 to-indigo-600"
                          }`}></div>
                          {method.icon}
                          {method.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Display available balance with better visibility */}
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <span className="text-xs text-muted-foreground">Available balance:</span>
                  <span className="text-xs font-medium">{formatCurrency(currentAvailableBalance)}</span>
                </div>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="text-foreground font-medium text-sm">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                  className="bg-muted/50 border-input hover:bg-muted focus:ring-primary h-9"
                />
              </div>
            </div>

            <DialogFooter className="px-4 py-3 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-border hover:bg-muted h-9"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !!errorMessage || !formData.amount || parseFloat(formData.amount) <= 0 || parseFloat(formData.amount) > currentAvailableBalance}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_15px_rgba(79,70,229,0.4)] h-9"
              >
                {isSubmitting ? "Processing..." : "Make Payment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 