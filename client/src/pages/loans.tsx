import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Landmark, CreditCard, Plus, Wallet, BanknoteIcon, PiggyBank, ArrowRightIcon, CheckIcon, AlertCircle, X, Calendar, ChevronsUpDown, Building, CheckCircle } from "lucide-react";
import { formatCurrency, smartFormatCurrency } from "@/lib/currencyUtils";
import logoIcon from "@/assets/images/2.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAssets, saveAssets, Asset } from "@/lib/localStorageService";
import MakeLoanPaymentModal from "@/components/modals/make-loan-payment-modal";

// Function to calculate monthly payment
const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number): number => {
  // Handle edge cases
  if (principal <= 0 || annualRate <= 0 || termMonths <= 0) return 0;
  
  // Convert annual rate to monthly rate (and from percentage to decimal)
  const monthlyRate = annualRate / 100 / 12;
  
  // Calculate monthly payment using the loan formula
  const monthlyPayment = 
    principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return isNaN(monthlyPayment) ? 0 : monthlyPayment;
};

// Interface for investment/asset data
interface Investment {
  id: string;
  name: string;
  currentValue: string | number;
  type: string;
  [key: string]: any; // Allow other properties
}

// Interface for loan data
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
  term: number; // In months
  receivedIn: string; // Where the loan amount was received (e.g., Bank Account, Cash)
  paymentFrequency: "weekly" | "biweekly" | "monthly"; // Payment frequency
  paymentType: "interest" | "fixed"; // Whether payment is calculated via interest or fixed amount
  fixedCharge: number; // Fixed charge amount if paymentType is "fixed"
  fixedChargeFrequency: "weekly" | "biweekly" | "monthly"; // Frequency of the fixed charge
  totalPayment: number; // Total amount to be paid over the life of the loan
  manualTotalPayment: boolean; // Whether the total payment was manually set
  status?: "active" | "completed"; // Loan status
  completedDate?: string; // Date when the loan was fully paid
}

// Define available payment methods with their display names and icons (same as in add-income-modal)
const PAYMENT_METHODS = [
  { id: "bank", name: "Bank Account", icon: <BanknoteIcon className="w-4 h-4 mr-2" />, assetId: "1" },
  { id: "card", name: "Credit Card", icon: <CreditCard className="w-4 h-4 mr-2" />, assetId: "2" },
  { id: "cash", name: "Cash", icon: <Wallet className="w-4 h-4 mr-2" />, assetId: "3" },
  { id: "assets", name: "Investments", icon: <Building className="w-4 h-4 mr-2" />, assetId: "4" },
  { id: "other", name: "Other Assets", icon: <PiggyBank className="w-4 h-4 mr-2" />, assetId: "5" }
];

export default function LoansPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [defaultAssets] = useState([
    "Bank Account",
    "Credit Card",
    "Cash",
    "Investments",
    "Savings"
  ]);
  
  // State for make payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  // Calculate default dates
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  
  // New loan form state
  const [newLoan, setNewLoan] = useState<Partial<Loan>>({
    name: "",
    amount: 0,
    interestRate: 0,
    remainingAmount: 0,
    monthlyPayment: 0,
    nextPaymentDate: nextMonth.toISOString().split('T')[0],
    lender: "",
    startDate: today.toISOString().split('T')[0],
    term: 12,
    receivedIn: "Bank Account",
    paymentFrequency: "monthly",
    paymentType: "interest",
    fixedCharge: 0,
    fixedChargeFrequency: "monthly",
    totalPayment: 0,
    manualTotalPayment: false
  });
  
  // Load assets from localStorage
  useEffect(() => {
    try {
      const storedAssets = getAssets();
      setAssets(storedAssets);
    } catch (e) {
      console.error("Error loading assets from localStorage", e);
    }
  }, []);
  
  // Calculate total outstanding
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  
  // Calculate total loan amounts
  const totalOriginalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

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

  // Convert payment from one frequency to another
  const convertPaymentFrequency = (amount: number, fromFreq: string, toFreq: string): number => {
    if (!amount) return 0;
    
    // First convert to monthly
    let monthlyAmount = amount;
    if (fromFreq === "weekly") {
      monthlyAmount = amount * 52 / 12;
    } else if (fromFreq === "biweekly") {
      monthlyAmount = amount * 26 / 12;
    }
    
    // Then convert to target frequency
    return calculatePaymentAmount(monthlyAmount, toFreq);
  };

  // Calculate total to be paid for the new loan (principal + interest)
  const calculateTotalPayment = () => {
    if (newLoan.manualTotalPayment && newLoan.totalPayment) {
      return newLoan.totalPayment;
    }
    
    if (newLoan.paymentType === "fixed") {
      if (!newLoan.fixedCharge || !newLoan.term) return newLoan.amount || 0;
      
      // Convert fixed charge to monthly for calculation
      let monthlyCharge = newLoan.fixedCharge || 0;
      if (newLoan.fixedChargeFrequency === "weekly") {
        monthlyCharge = monthlyCharge * 52 / 12;
      } else if (newLoan.fixedChargeFrequency === "biweekly") {
        monthlyCharge = monthlyCharge * 26 / 12;
      }
      
      // For fixed payment, multiply the monthly charge by the term
      return (newLoan.amount || 0) + (monthlyCharge * newLoan.term);
    } else {
      // For interest-based payment
      if (!newLoan.amount || !newLoan.interestRate || !newLoan.term) return newLoan.amount || 0;
      const monthlyPayment = calculateMonthlyPayment(
        newLoan.amount,
        newLoan.interestRate,
        newLoan.term
      );
      return monthlyPayment * newLoan.term;
    }
  };
  
  const totalToPayNewLoan = calculateTotalPayment();
  const totalInterestNewLoan = totalToPayNewLoan - (newLoan.amount || 0);
  
  // Get the current payment amount based on frequency and type
  const getCurrentPaymentAmount = (): number => {
    if (newLoan.paymentType === "fixed") {
      // If fixed charge frequency matches payment frequency, use the fixed charge directly
      if (newLoan.fixedChargeFrequency === newLoan.paymentFrequency) {
        return newLoan.fixedCharge || 0;
      }
      // Otherwise convert the fixed charge to the payment frequency
      return convertPaymentFrequency(
        newLoan.fixedCharge || 0, 
        newLoan.fixedChargeFrequency || "monthly", 
        newLoan.paymentFrequency || "monthly"
      );
    } else {
      const basePayment = newLoan.monthlyPayment || 0;
      return calculatePaymentAmount(basePayment, newLoan.paymentFrequency || "monthly");
    }
  };
  
  // Load loans from localStorage on component mount
  useEffect(() => {
    const savedLoans = localStorage.getItem("firstMillionLoans");
    if (savedLoans) {
      try {
        setLoans(JSON.parse(savedLoans));
      } catch (e) {
        console.error("Error loading loans from localStorage", e);
      }
    }
    
    document.title = "Loan Management | First Million";
  }, []);
  
  // Save loans to localStorage when they change
  useEffect(() => {
    localStorage.setItem("firstMillionLoans", JSON.stringify(loans));
  }, [loans]);
  
  // Auto-calculate monthly payment when amount, interest rate, or term changes
  useEffect(() => {
    if (newLoan.paymentType === "interest" && newLoan.amount && newLoan.interestRate && newLoan.term) {
      const calculatedMonthlyPayment = calculateMonthlyPayment(
        newLoan.amount,
        newLoan.interestRate,
        newLoan.term
      );
      
      setNewLoan(prev => ({
        ...prev,
        monthlyPayment: parseFloat(calculatedMonthlyPayment.toFixed(2)),
        totalPayment: parseFloat((calculatedMonthlyPayment * newLoan.term).toFixed(2)),
        manualTotalPayment: false
      }));
    } else if (newLoan.paymentType === "fixed") {
      // For fixed payment, calculate equivalent monthly payment
      let monthlyEquivalent = newLoan.fixedCharge || 0;
      
      if (newLoan.fixedChargeFrequency === "weekly") {
        monthlyEquivalent = monthlyEquivalent * 52 / 12;
      } else if (newLoan.fixedChargeFrequency === "biweekly") {
        monthlyEquivalent = monthlyEquivalent * 26 / 12;
      }
      
      setNewLoan(prev => ({
        ...prev,
        monthlyPayment: parseFloat(monthlyEquivalent.toFixed(2)),
        totalPayment: parseFloat(((prev.amount || 0) + (monthlyEquivalent * (prev.term || 0))).toFixed(2)),
        manualTotalPayment: false
      }));
    }
  }, [newLoan.amount, newLoan.interestRate, newLoan.term, newLoan.paymentType, newLoan.fixedCharge, newLoan.fixedChargeFrequency]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    if (["amount", "interestRate", "monthlyPayment", "term", "fixedCharge", "totalPayment"].includes(name)) {
      setNewLoan(prev => ({ 
        ...prev, 
        [name]: parseFloat(value) || 0,
        // If totalPayment is being manually changed, set the flag
        ...(name === "totalPayment" ? { manualTotalPayment: true } : {})
      }));
    } else {
      setNewLoan(prev => ({ ...prev, [name]: value }));
    }
    
    // Automatically set remaining amount equal to amount when amount changes
    if (name === "amount") {
      setNewLoan(prev => ({ 
        ...prev, 
        remainingAmount: parseFloat(value) || 0,
        // Reset manual total payment when amount changes
        manualTotalPayment: false
      }));
    }
    
    // Update next payment date when start date changes
    if (name === "startDate") {
      try {
        const startDate = new Date(value);
        const nextPaymentDate = new Date(startDate);
        
        // Set next payment date based on payment frequency
        if (newLoan.paymentFrequency === "weekly") {
          nextPaymentDate.setDate(startDate.getDate() + 7); // Add 1 week
        } else if (newLoan.paymentFrequency === "biweekly") {
          nextPaymentDate.setDate(startDate.getDate() + 14); // Add 2 weeks
        } else {
          nextPaymentDate.setMonth(startDate.getMonth() + 1); // Add 1 month
        }
        
        setNewLoan(prev => ({ 
          ...prev, 
          nextPaymentDate: nextPaymentDate.toISOString().split('T')[0]
        }));
      } catch (e) {
        console.error("Error calculating next payment date", e);
      }
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setNewLoan(prev => ({ 
      ...prev, 
      [name]: value,
      // Reset manual total payment when payment type or frequency changes
      ...(["paymentType", "paymentFrequency", "fixedChargeFrequency"].includes(name) ? { manualTotalPayment: false } : {})
    }));
    
    // If payment frequency changes, update the next payment date
    if (name === "paymentFrequency" && newLoan.startDate) {
      try {
        const startDate = new Date(newLoan.startDate);
        const nextPaymentDate = new Date(startDate);
        
        // Set next payment date based on new payment frequency
        if (value === "weekly") {
          nextPaymentDate.setDate(startDate.getDate() + 7); // Add 1 week
        } else if (value === "biweekly") {
          nextPaymentDate.setDate(startDate.getDate() + 14); // Add 2 weeks
        } else {
          nextPaymentDate.setMonth(startDate.getMonth() + 1); // Add 1 month
        }
        
        setNewLoan(prev => ({ 
          ...prev, 
          nextPaymentDate: nextPaymentDate.toISOString().split('T')[0]
        }));
      } catch (e) {
        console.error("Error calculating next payment date", e);
      }
    }
  };
  
  // Handle form submission
  const handleAddLoan = () => {
    // Basic validation
    if (!newLoan.name || !newLoan.amount || !newLoan.lender || !newLoan.receivedIn) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate payment type specific fields
    if (newLoan.paymentType === "interest" && (!newLoan.interestRate || newLoan.interestRate <= 0)) {
      toast({
        title: "Missing interest rate",
        description: "Please enter a valid interest rate.",
        variant: "destructive",
      });
      return;
    } else if (newLoan.paymentType === "fixed" && (!newLoan.fixedCharge || newLoan.fixedCharge <= 0)) {
      toast({
        title: "Missing fixed charge",
        description: "Please enter a valid fixed charge amount.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new loan object
    const loan: Loan = {
      id: uuidv4(),
      name: newLoan.name || "",
      amount: newLoan.amount || 0,
      interestRate: newLoan.interestRate || 0,
      remainingAmount: newLoan.amount || 0, // Set remaining amount equal to amount initially
      monthlyPayment: newLoan.monthlyPayment || 0,
      nextPaymentDate: newLoan.nextPaymentDate || new Date().toISOString().split('T')[0],
      lender: newLoan.lender || "",
      startDate: newLoan.startDate || new Date().toISOString().split('T')[0],
      term: newLoan.term || 12,
      receivedIn: newLoan.receivedIn || "Bank Account",
      paymentFrequency: newLoan.paymentFrequency || "monthly",
      paymentType: newLoan.paymentType || "interest",
      fixedCharge: newLoan.fixedCharge || 0,
      fixedChargeFrequency: newLoan.fixedChargeFrequency || "monthly",
      totalPayment: totalToPayNewLoan,
      manualTotalPayment: newLoan.manualTotalPayment || false,
      status: "active" // Set status to active by default
    };
    
    // Add loan to state
    setLoans(prev => [...prev, loan]);
    
    // Add the loan amount to the selected asset using our asset system
    try {
      // Get the asset ID from the selected receivedIn option
      const selectedMethod = PAYMENT_METHODS.find(m => m.name === loan.receivedIn);
      const assetId = selectedMethod?.assetId;
      
      if (assetId) {
        // Get current assets
        const currentAssets = getAssets();
        const existingAsset = currentAssets.find(a => a.id === assetId);
        
        if (existingAsset) {
          // Update existing asset
          const updatedAssets = currentAssets.map(asset => 
            asset.id === assetId 
              ? { ...asset, balance: asset.balance + loan.amount }
              : asset
          );
          saveAssets(updatedAssets);
          setAssets(updatedAssets);
        } else {
          // If asset doesn't exist (unlikely with our setup), create it
          const newAsset = {
            id: assetId,
            name: selectedMethod?.name || loan.receivedIn,
            balance: loan.amount,
            color: getColorForAssetId(assetId)
          };
          const updatedAssets = [...currentAssets, newAsset];
          saveAssets(updatedAssets);
          setAssets(updatedAssets);
        }
      } else {
        // Fallback to old method for backward compatibility
      // Get current investments
      const investments = JSON.parse(localStorage.getItem("firstMillionInvestments") || "[]");
      
      // Check if the receivedIn account exists
      const accountIndex = investments.findIndex((inv: any) => 
        inv.name.toLowerCase() === loan.receivedIn.toLowerCase()
      );
      
      if (accountIndex >= 0) {
        // Update existing account
        const currentValue = parseFloat(investments[accountIndex].currentValue) || 0;
        investments[accountIndex].currentValue = (currentValue + loan.amount).toString();
        localStorage.setItem("firstMillionInvestments", JSON.stringify(investments));
      } else {
        // Create new asset entry if specified account doesn't exist
        const newAsset = {
          id: uuidv4(),
          name: loan.receivedIn,
          description: `Created from loan: ${loan.name}`,
          initialValue: loan.amount.toString(),
          currentValue: loan.amount.toString(),
          type: "other",
          purchaseDate: loan.startDate
        };
        
        investments.push(newAsset);
        localStorage.setItem("firstMillionInvestments", JSON.stringify(investments));
        }
      }
      
      toast({
        title: "Asset updated",
        description: `Added ${formatCurrency(loan.amount)} to ${loan.receivedIn}`,
      });
    } catch (e) {
      console.error("Error updating assets with loan amount", e);
    }
    
    // Reset form and close it
    setNewLoan({
      name: "",
      amount: 0,
      interestRate: 0,
      remainingAmount: 0,
      monthlyPayment: 0,
      nextPaymentDate: nextMonth.toISOString().split('T')[0],
      lender: "",
      startDate: today.toISOString().split('T')[0],
      term: 12,
      receivedIn: "Bank Account",
      paymentFrequency: "monthly",
      paymentType: "interest",
      fixedCharge: 0,
      fixedChargeFrequency: "monthly",
      totalPayment: 0,
      manualTotalPayment: false
    });
    
    setShowAddLoan(false);
    
    toast({
      title: "Loan added",
      description: "Your loan has been added successfully.",
    });
  };
  
  // Helper function to get color based on asset ID (same as in add-income-modal)
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
  
  // Handle loan payment
  const handleLoanPayment = (updatedLoan: Loan, isFullyPaid: boolean) => {
    // If loan is fully paid, mark it as completed
    if (isFullyPaid) {
      updatedLoan.status = "completed";
      updatedLoan.completedDate = new Date().toISOString();
      updatedLoan.remainingAmount = 0;
    }
    
    // Update the loan in the loans array
    setLoans(prev => prev.map(loan => 
      loan.id === updatedLoan.id ? updatedLoan : loan
    ));
  };
  
  // Open payment modal for a loan
  const openPaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };
  
  // Delete a loan
  const handleDeleteLoan = (id: string) => {
    // Find the loan before removing it
    const loanToDelete = loans.find(loan => loan.id === id);
    
    if (!loanToDelete) {
      toast({
        title: "Error",
        description: "Loan not found",
        variant: "destructive",
      });
      return;
    }
    
    // Remove loan from state
    setLoans(prev => prev.filter(loan => loan.id !== id));
    
    toast({
      title: "Loan removed",
      description: "The loan has been removed from your account.",
    });
    
    // We don't remove the amount from the asset since the loan might have been used already
    // But we could add this functionality if needed in the future
  };
  
  // Calculate active and completed loans
  const activeLoanCount = loans.filter(loan => loan.status !== "completed").length;
  const completedLoanCount = loans.filter(loan => loan.status === "completed").length;
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background pattern with zig-zag shapes */}
      <div className="absolute inset-0 z-0 opacity-20">
        {/* Zig-zag shapes */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-yellow-400/30 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] animate-float-slow"></div>
        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-yellow-300/20 rounded-[50%_50%_20%_80%/25%_80%_80%_20%] animate-float-medium"></div>
        <div className="absolute top-[40%] right-[20%] w-40 h-40 bg-yellow-500/25 rounded-[80%_20%_50%_50%/50%_50%_20%_80%] animate-float-fast"></div>
        <div className="absolute bottom-[30%] left-[15%] w-56 h-56 bg-yellow-200/15 rounded-[30%_70%_20%_80%/80%_20%_60%_40%] animate-float-medium"></div>
      </div>
      
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `, 
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Accent lines */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `, 
          backgroundSize: '200px 200px',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto pt-6 px-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setLocation("/dashboard")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="w-16 h-16 flex items-center justify-center overflow-visible">
            <img 
              src={logoIcon} 
              alt="First Million Logo" 
              className="w-20 h-auto"
              style={{ objectFit: "contain", transform: "scale(1.5)", minWidth: 60, minHeight: 60 }}
            />
          </div>
        </div>
        
        {/* Main content wrapper - grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Title and summary */}
          <div className="lg:col-span-2">
            <div className="mb-8 text-left lg:pr-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(124,58,237,0.5)]">
                <BanknoteIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Loan Management</h1>
              <p className="text-gray-400 mb-4 text-base">Track and manage your loans</p>
              
              <div className="flex items-center">
                <div className="text-4xl font-bold mr-4 text-white">
                  {smartFormatCurrency(totalOutstanding)}
                </div>
                <span className="text-gray-400 text-lg">Total Outstanding</span>
              </div>
            </div>
            
            {/* Loan filter tabs */}
            <div className="flex mb-4 border-b border-gray-800">
              <button 
                className={`px-4 py-2 font-medium ${
                  activeLoanCount > 0 ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'
                }`}
              >
                Active Loans ({activeLoanCount})
              </button>
              <button 
                className={`px-4 py-2 font-medium ${
                  completedLoanCount > 0 ? 'text-gray-400 hover:text-white' : 'text-gray-600'
                }`}
              >
                Completed ({completedLoanCount})
              </button>
            </div>
            
            {/* Loans List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Your Loans</h2>
              
              {loans.length === 0 ? (
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BanknoteIcon className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 mb-4">No loans added yet</p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      onClick={() => setShowAddLoan(true)}
                    >
                      Add Your First Loan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Active Loans */}
                  {loans.filter(loan => loan.status !== "completed").map(loan => (
                  <Card 
                    key={loan.id}
                    className="bg-gray-900/50 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_10px_40px_rgba(124,58,237,0.2)] transition-all duration-300 rounded-xl border border-gray-800 overflow-hidden"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-white mb-1">{loan.name}</h3>
                            <button 
                              className="text-gray-500 hover:text-red-500 transition-colors"
                              onClick={() => handleDeleteLoan(loan.id)}
                              aria-label={`Delete ${loan.name} loan`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="flex items-center text-sm text-gray-400 mb-2">
                            <span className="mr-3">
                              {loan.paymentType === "interest" ? `Interest: ${loan.interestRate}%` : `Fixed: ${formatCurrency(loan.fixedCharge)}`}
                            </span>
                            <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(loan.nextPaymentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <div className="mr-3">Lender: {loan.lender}</div>
                            <div className="flex items-center">
                              <Wallet size={12} className="mr-1" /> 
                              Received in: {loan.receivedIn}
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-gray-800 h-2 rounded-full mb-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${Math.max(0, Math.min(100, 100 - (loan.remainingAmount / loan.amount * 100)))}%` }}
                              aria-label={`${Math.round(100 - (loan.remainingAmount / loan.amount * 100))}% paid`}
                              role="progressbar"
                              aria-valuenow={Math.round(100 - (loan.remainingAmount / loan.amount * 100))}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Paid: {formatCurrency(loan.amount - loan.remainingAmount)}</span>
                            <span>Total: {formatCurrency(loan.amount)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-6 md:text-right">
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(loan.remainingAmount)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatCurrency(calculatePaymentAmount(loan.monthlyPayment, loan.paymentFrequency || "monthly"))} / 
                            {loan.paymentFrequency === "weekly" ? " week" : 
                             loan.paymentFrequency === "biweekly" ? " 2 weeks" : 
                             " month"}
                          </div>
                          <Button 
                            size="sm" 
                              className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-[0_4px_10px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_15px_rgba(79,70,229,0.4)]"
                              onClick={() => openPaymentModal(loan)}
                          >
                            Make Payment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                  
                  {/* Completed Loans */}
                  {completedLoanCount > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-bold mb-4 text-gray-400">Completed Loans</h3>
                      
                      {loans.filter(loan => loan.status === "completed").map(loan => (
                        <Card 
                          key={loan.id}
                          className="bg-gray-900/30 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 rounded-xl border border-gray-800/50 overflow-hidden mb-4"
                        >
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <h3 className="text-lg font-bold text-gray-400 mb-1">{loan.name}</h3>
                                    <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center">
                                      <CheckCircle size={12} className="mr-1" /> Paid
                                    </span>
                                  </div>
                                  <button 
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                    onClick={() => handleDeleteLoan(loan.id)}
                                    aria-label={`Delete ${loan.name} loan`}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <span className="mr-3">Original amount: {formatCurrency(loan.amount)}</span>
                                  {loan.completedDate && (
                                    <span className="flex items-center">
                                      <Calendar size={14} className="mr-1" /> 
                                      Completed: {new Date(loan.completedDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Progress bar - always 100% */}
                                <div className="w-full bg-gray-800 h-2 rounded-full mb-2 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                    style={{ width: "100%" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Right column: Add Loan Panel */}
          <div className="lg:col-span-1">
            {showAddLoan ? (
              <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-800 sticky top-6">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white" id="add-loan-title">Add New Loan</h3>
                    <button 
                      className="text-gray-500 hover:text-white transition-colors"
                      onClick={() => setShowAddLoan(false)}
                      aria-label="Close form"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4" aria-labelledby="add-loan-title" aria-describedby="add-loan-description">
                    <p id="add-loan-description" className="sr-only">Form to add a new loan to your account. Fill in all required fields.</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Loan Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g. Home Mortgage"
                        value={newLoan.name}
                        onChange={handleInputChange}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        aria-required="true"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lender" className="text-white">Lender <span className="text-red-500">*</span></Label>
                      <Input
                        id="lender"
                        name="lender"
                        placeholder="e.g. Bank of America"
                        value={newLoan.lender}
                        onChange={handleInputChange}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                        aria-required="true"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-white">Total Amount <span className="text-red-500">*</span></Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          placeholder="0.00"
                          value={newLoan.amount || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          aria-required="true"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="receivedIn" className="text-white">Received In <span className="text-red-500">*</span></Label>
                        <Select 
                                  value={newLoan.receivedIn}
                          onValueChange={(value) => handleSelectChange("receivedIn", value)}
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50">
                            <SelectValue placeholder="Select where you received the loan" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {PAYMENT_METHODS.map(method => (
                              <SelectItem key={method.id} value={method.name}>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 bg-gradient-to-r ${method.id === "bank" ? "from-blue-500 to-blue-600" : 
                                    method.id === "card" ? "from-purple-500 to-purple-600" :
                                    method.id === "cash" ? "from-green-500 to-green-600" :
                                    method.id === "assets" ? "from-amber-500 to-amber-600" :
                                    "from-indigo-500 to-indigo-600"}`}></div>
                                  {method.icon}
                                  {method.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400 mt-1">
                          Select where the loan amount will be deposited
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paymentType" className="text-white">Payment Type</Label>
                      <RadioGroup
                        id="paymentType"
                        value={newLoan.paymentType}
                        onValueChange={(value) => handleSelectChange("paymentType", value)}
                        className="flex space-x-2"
                      >
                        <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                          <RadioGroupItem value="interest" id="interest" className="text-white" />
                          <Label htmlFor="interest" className="text-white cursor-pointer">Interest</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                          <RadioGroupItem value="fixed" id="fixed" className="text-white" />
                          <Label htmlFor="fixed" className="text-white cursor-pointer">Fixed</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {newLoan.paymentType === "interest" ? (
                      <div className="space-y-2">
                        <Label htmlFor="interestRate" className="text-white">Interest Rate (%) <span className="text-red-500">*</span></Label>
                        <Input
                          id="interestRate"
                          name="interestRate"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newLoan.interestRate || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          aria-required="true"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fixedCharge" className="text-white">Fixed Charge <span className="text-red-500">*</span></Label>
                        <Input
                          id="fixedCharge"
                          name="fixedCharge"
                          type="number"
                          placeholder="0.00"
                          value={newLoan.fixedCharge || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          aria-required="true"
                        />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="fixedChargeFrequency" className="text-white">Fixed Charge Frequency</Label>
                          <RadioGroup
                            id="fixedChargeFrequency"
                            value={newLoan.fixedChargeFrequency}
                            onValueChange={(value) => handleSelectChange("fixedChargeFrequency", value)}
                            className="flex space-x-2"
                          >
                            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                              <RadioGroupItem value="weekly" id="charge-weekly" className="text-white" />
                              <Label htmlFor="charge-weekly" className="text-white cursor-pointer">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                              <RadioGroupItem value="biweekly" id="charge-biweekly" className="text-white" />
                              <Label htmlFor="charge-biweekly" className="text-white cursor-pointer">Bi-Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                              <RadioGroupItem value="monthly" id="charge-monthly" className="text-white" />
                              <Label htmlFor="charge-monthly" className="text-white cursor-pointer">Monthly</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="term" className="text-white">Term (months) <span className="text-red-500">*</span></Label>
                        <Input
                          id="term"
                          name="term"
                          type="number"
                          placeholder="12"
                          value={newLoan.term || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                          aria-required="true"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paymentFrequency" className="text-white">Payment Frequency</Label>
                      <RadioGroup
                        id="paymentFrequency"
                        value={newLoan.paymentFrequency}
                        onValueChange={(value) => handleSelectChange("paymentFrequency", value)}
                        className="flex space-x-2"
                      >
                        <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                          <RadioGroupItem value="weekly" id="weekly" className="text-white" />
                          <Label htmlFor="weekly" className="text-white cursor-pointer">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                          <RadioGroupItem value="biweekly" id="biweekly" className="text-white" />
                          <Label htmlFor="biweekly" className="text-white cursor-pointer">Bi-Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-2 flex-1 justify-center">
                          <RadioGroupItem value="monthly" id="monthly" className="text-white" />
                          <Label htmlFor="monthly" className="text-white cursor-pointer">Monthly</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-white">Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={newLoan.startDate || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nextPaymentDate" className="text-white">Next Payment Date</Label>
                        <Input
                          id="nextPaymentDate"
                          name="nextPaymentDate"
                          type="date"
                          value={newLoan.nextPaymentDate || ""}
                          onChange={handleInputChange}
                          className="bg-gray-800/50 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="calculatedPayment" className="text-white">
                          {newLoan.paymentFrequency === "weekly" ? "Weekly" :
                           newLoan.paymentFrequency === "biweekly" ? "Bi-Weekly" :
                           "Monthly"} Payment
                        </Label>
                        <span className="text-sm text-gray-400">
                          Auto-calculated
                        </span>
                      </div>
                      <Input
                        id="calculatedPayment"
                        type="text"
                        value={formatCurrency(getCurrentPaymentAmount())}
                        className="bg-gray-800/50 border-gray-700 text-white font-bold"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="totalPayment" className="text-white">
                          Total to Pay (Principal + Interest/Charges)
                        </Label>
                        <span className="text-sm text-gray-400">
                          {newLoan.manualTotalPayment ? "Manually set" : "Auto-calculated"}
                        </span>
                      </div>
                      <Input
                        id="totalPayment"
                        name="totalPayment"
                        type="number"
                        value={newLoan.manualTotalPayment ? newLoan.totalPayment : totalToPayNewLoan || ""}
                        onChange={handleInputChange}
                        className="bg-gray-800/50 border-gray-700 text-white font-bold"
                      />
                      <p className="text-xs text-gray-400">
                        You can adjust this amount if you want to override the calculated total payment.
                      </p>
                    </div>

                    {(newLoan.amount && ((newLoan.paymentType === "interest" && newLoan.interestRate) || (newLoan.paymentType === "fixed" && newLoan.fixedCharge)) && newLoan.term) ? (
                      <div className="bg-gray-800/50 p-3 rounded-lg space-y-2 border border-gray-700">
                        <h4 className="text-white font-medium">Loan Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">Principal:</div>
                          <div className="text-white text-right">{formatCurrency(newLoan.amount)}</div>
                          
                          <div className="text-gray-400">
                            {newLoan.paymentType === "interest" ? "Total Interest:" : "Total Charges:"}
                          </div>
                          <div className="text-white text-right">{formatCurrency(totalInterestNewLoan)}</div>
                          
                          <div className="text-gray-400">Total to Pay:</div>
                          <div className="text-white text-right">{formatCurrency(totalToPayNewLoan)}</div>
                          
                          <div className="text-gray-400">
                            {newLoan.paymentFrequency === "weekly" ? "Weekly" :
                             newLoan.paymentFrequency === "biweekly" ? "Bi-Weekly" :
                             "Monthly"} Payment:
                          </div>
                          <div className="text-white text-right">{formatCurrency(getCurrentPaymentAmount())}</div>
                          
                          <div className="text-gray-400">Payment Type:</div>
                          <div className="text-white text-right capitalize">
                            {newLoan.paymentType === "interest" ? `${newLoan.interestRate}% Interest` : 
                             `Fixed ${formatCurrency(newLoan.fixedCharge || 0)} ${newLoan.fixedChargeFrequency}`}
                          </div>
                          
                          <div className="text-gray-400">Payment Frequency:</div>
                          <div className="text-white text-right capitalize">{newLoan.paymentFrequency}</div>
                          
                          <div className="text-gray-400">Term:</div>
                          <div className="text-white text-right">{newLoan.term} months</div>
                        </div>
                      </div>
                    ) : null}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={handleAddLoan}
                    >
                      Add Loan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all flex items-center justify-center h-14"
                onClick={() => setShowAddLoan(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                <span>Add New Loan</span>
              </Button>
            )}
            
            {!showAddLoan && loans.length > 0 && (
              <div className="mt-6 space-y-4">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-white mb-4">Loan Summary</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Loans:</span>
                        <span className="text-white">{activeLoanCount}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed Loans:</span>
                        <span className="text-white">{completedLoanCount}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Original:</span>
                        <span className="text-white">{formatCurrency(totalOriginalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Remaining:</span>
                        <span className="text-white">{formatCurrency(totalOutstanding)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly Payments:</span>
                        <span className="text-white">{formatCurrency(totalMonthlyPayment)}</span>
                      </div>
                      
                      {activeLoanCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg. Interest Rate:</span>
                        <span className="text-white">
                            {(loans
                              .filter(loan => loan.status !== "completed" && loan.paymentType === "interest")
                              .reduce((sum, loan) => sum + loan.interestRate, 0) / 
                              (loans.filter(loan => loan.status !== "completed" && loan.paymentType === "interest").length || 1)
                            ).toFixed(2)}%
                        </span>
                      </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-white mb-4">Payment Calendar</h3>
                    
                    <div className="space-y-2">
                      {loans
                        .filter(loan => loan.status !== "completed")
                        .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
                        .slice(0, 3)
                        .map(loan => (
                          <div key={`payment-${loan.id}`} className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                            <div>
                              <div className="text-white font-medium">{loan.name}</div>
                              <div className="text-gray-400 text-xs">{new Date(loan.nextPaymentDate).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{formatCurrency(loan.monthlyPayment)}</div>
                              <button 
                                className="text-xs px-2 py-1 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                onClick={() => openPaymentModal(loan)}
                              >
                                Pay Now
                              </button>
                            </div>
                          </div>
                        ))}
                        
                      {loans.filter(loan => loan.status !== "completed").length === 0 && (
                        <div className="text-center py-3">
                          <p className="text-gray-400 text-sm">No active loans</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Make Payment Modal */}
      <MakeLoanPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        loan={selectedLoan}
        onSuccess={handleLoanPayment}
      />
    </div>
  );
} 