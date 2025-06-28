import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { syncLocalDataToSupabase } from "@/lib/syncService";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  PiggyBank,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Building,
  Play,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Coffee,
  GraduationCap,
  PlaneTakeoff,
  Smartphone,
  Dumbbell,
  Shirt,
  Tv,
  Gamepad2,
  Baby,
  Wine,
  Pill,
  Bus,
  Fuel,
  Gift,
  UtensilsCrossed,
  CreditCard,
  Scissors,
  TicketCheck,
  Heart,
  Dog,
  Bike,
  BookOpen,
  Briefcase,
  BadgeDollarSign,
  LineChart,
  Gift as GiftIcon,
  Handshake,
  Bitcoin,
  CalendarClock,
  ChevronDown
} from "lucide-react";

// Import currency utilities
import { currencies, Currency, formatCurrency, convertFromUSD } from "@/lib/currencyUtils";

// Import the video directly to ensure proper bundling
import droneVideo from "../../../src/assets/videos/drone_follows_a_sports_car_from_right_.mp4";

// Add global style for select dropdown
const selectStyles = `
  option {
    background-color: #b45309 !important; 
    color: white !important;
    padding: 0.5rem !important;
  }
  
  select::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
`;

interface OnboardingData {
  userName: string;
  monthlyIncome: string;
  currency: string;
  investmentGoal: string;
  targetAmount: string;
  goalType: "million" | "custom";
  goalName: string;
  selectedExpenseCategories: string[];
  selectedIncomeCategories: string[];
  isAuthenticated: boolean;
  userEmail?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  icon: JSX.Element;
  faIcon: string;
}

interface IncomeCategory {
  id: string;
  name: string;
  icon: JSX.Element;
  faIcon: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    userName: "",
    monthlyIncome: "",
    currency: "USD",
    investmentGoal: "",
    targetAmount: "1000000",
    goalType: "million",
    goalName: "",
    selectedExpenseCategories: [],
    selectedIncomeCategories: [],
    isAuthenticated: false,
    userEmail: undefined
  });
  const [isMobile, setIsMobile] = useState(false);
  const [videoState, setVideoState] = useState<'init' | 'ready' | 'playing' | 'ended'>('init');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [highlightNameInput, setHighlightNameInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    // Use displaySymbol if available, otherwise use symbol
    return currency ? (currency.symbol) : "$";
  };

  // Calculate time to reach target
  const calculateTimeToTarget = (): { months: number; years: number; isLongPeriod: boolean } => {
    const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
    const baseTarget = parseFloat(data.targetAmount) || 1000000; // Use user's target amount
    
    // Convert target to selected currency if not USD
    const targetAmount = data.currency === "USD" 
      ? baseTarget 
      : convertFromUSD(baseTarget, data.currency);
    
    if (monthlyIncome <= 0) {
      return { months: 0, years: 0, isLongPeriod: true };
    }
    
    // Now we're dividing the target in the selected currency by the monthly income
    const months = Math.ceil(targetAmount / monthlyIncome);
    const years = Math.floor(months / 12);
    const isLongPeriod = years > 2;
    
    return { months, years, isLongPeriod };
  };

  // Predefined expense categories with custom icons
  const expenseCategories: ExpenseCategory[] = [
    { id: "groceries", name: "Groceries", icon: <ShoppingCart className="w-5 h-5" />, faIcon: "fas fa-shopping-cart" },
    { id: "rent", name: "Rent/Mortgage", icon: <Home className="w-5 h-5" />, faIcon: "fas fa-home" },
    { id: "car", name: "Car Payment", icon: <Car className="w-5 h-5" />, faIcon: "fas fa-car" },
    { id: "dining", name: "Dining Out", icon: <Utensils className="w-5 h-5" />, faIcon: "fas fa-utensils" },
    { id: "coffee", name: "Coffee & Snacks", icon: <Coffee className="w-5 h-5" />, faIcon: "fas fa-coffee" },
    { id: "education", name: "Education", icon: <GraduationCap className="w-5 h-5" />, faIcon: "fas fa-graduation-cap" },
    { id: "travel", name: "Travel", icon: <PlaneTakeoff className="w-5 h-5" />, faIcon: "fas fa-plane" },
    { id: "phone", name: "Phone & Internet", icon: <Smartphone className="w-5 h-5" />, faIcon: "fas fa-mobile-alt" },
    { id: "fitness", name: "Fitness", icon: <Dumbbell className="w-5 h-5" />, faIcon: "fas fa-dumbbell" },
    { id: "clothing", name: "Clothing", icon: <Shirt className="w-5 h-5" />, faIcon: "fas fa-tshirt" },
    { id: "entertainment", name: "Entertainment", icon: <Tv className="w-5 h-5" />, faIcon: "fas fa-tv" },
    { id: "gaming", name: "Gaming", icon: <Gamepad2 className="w-5 h-5" />, faIcon: "fas fa-gamepad" },
    { id: "childcare", name: "Childcare", icon: <Baby className="w-5 h-5" />, faIcon: "fas fa-baby" },
    { id: "alcohol", name: "Alcohol", icon: <Wine className="w-5 h-5" />, faIcon: "fas fa-wine-glass-alt" },
    { id: "healthcare", name: "Healthcare", icon: <Pill className="w-5 h-5" />, faIcon: "fas fa-pills" },
    { id: "transport", name: "Public Transport", icon: <Bus className="w-5 h-5" />, faIcon: "fas fa-bus" },
    { id: "fuel", name: "Fuel", icon: <Fuel className="w-5 h-5" />, faIcon: "fas fa-gas-pump" },
    { id: "gifts", name: "Gifts", icon: <Gift className="w-5 h-5" />, faIcon: "fas fa-gift" },
    { id: "takeout", name: "Takeout", icon: <UtensilsCrossed className="w-5 h-5" />, faIcon: "fas fa-utensils" },
    { id: "subscriptions", name: "Subscriptions", icon: <CreditCard className="w-5 h-5" />, faIcon: "fas fa-credit-card" },
    { id: "haircuts", name: "Haircuts & Beauty", icon: <Scissors className="w-5 h-5" />, faIcon: "fas fa-cut" },
    { id: "events", name: "Events & Tickets", icon: <TicketCheck className="w-5 h-5" />, faIcon: "fas fa-ticket-alt" },
    { id: "charity", name: "Charity", icon: <Heart className="w-5 h-5" />, faIcon: "fas fa-donate" },
    { id: "pets", name: "Pets", icon: <Dog className="w-5 h-5" />, faIcon: "fas fa-paw" },
    { id: "exercise", name: "Exercise & Sports", icon: <Bike className="w-5 h-5" />, faIcon: "fas fa-bicycle" },
    { id: "books", name: "Books & Magazines", icon: <BookOpen className="w-5 h-5" />, faIcon: "fas fa-book" }
  ];

  // Predefined income categories with custom icons
  const incomeCategories: IncomeCategory[] = [
    { id: "salary", name: "Salary", icon: <Briefcase className="w-5 h-5" />, faIcon: "fas fa-briefcase" },
    { id: "freelance", name: "Freelance", icon: <BadgeDollarSign className="w-5 h-5" />, faIcon: "fas fa-comments-dollar" },
    { id: "investments", name: "Investments", icon: <LineChart className="w-5 h-5" />, faIcon: "fas fa-chart-line" },
    { id: "rental", name: "Rental Income", icon: <Building className="w-5 h-5" />, faIcon: "fas fa-home" },
    { id: "business", name: "Business", icon: <Handshake className="w-5 h-5" />, faIcon: "fas fa-briefcase" },
    { id: "gifts", name: "Gifts/Support", icon: <GiftIcon className="w-5 h-5" />, faIcon: "fas fa-gift" },
    { id: "crypto", name: "Crypto", icon: <Bitcoin className="w-5 h-5" />, faIcon: "fas fa-bitcoin" },
  ];

  // Toggle expense category selection
  const toggleCategory = (categoryId: string) => {
    setData(prev => {
      const isSelected = prev.selectedExpenseCategories.includes(categoryId);
      const updatedCategories = isSelected
        ? prev.selectedExpenseCategories.filter(id => id !== categoryId)
        : [...prev.selectedExpenseCategories, categoryId];
      
      return {
        ...prev,
        selectedExpenseCategories: updatedCategories
      };
    });
  };

  // Toggle income category selection
  const toggleIncomeCategory = (categoryId: string) => {
    setData(prev => {
      const isSelected = prev.selectedIncomeCategories.includes(categoryId);
      const updatedCategories = isSelected
        ? prev.selectedIncomeCategories.filter(id => id !== categoryId)
        : [...prev.selectedIncomeCategories, categoryId];
      
      return {
        ...prev,
        selectedIncomeCategories: updatedCategories
      };
    });
  };

  // Check if video has been watched before
  useEffect(() => {
    const videoWatched = localStorage.getItem("firstMillionIntroVideoWatched");
    if (videoWatched === "true") {
      setVideoState('ended');
    }
  }, []);

  // Highlight name input when reaching step 1
  useEffect(() => {
    if (currentStep === 1) {
      setHighlightNameInput(true);
      const timer = setTimeout(() => {
        setHighlightNameInput(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Check device size on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effect to play video when state changes to 'ready'
  useEffect(() => {
    if (videoState === 'ready' && videoRef.current) {
      console.log("Video is ready, attempting to play");
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video playback started successfully");
            setVideoState('playing');
          })
          .catch(error => {
            console.error("Error playing video:", error);
            setVideoError(`Failed to play: ${error.message}`);
            // If autoplay is prevented, show controls so user can manually play
            if (videoRef.current) {
              videoRef.current.controls = true;
            }
          });
      }
    }
  }, [videoState]);

  const handlePlayVideo = () => {
    console.log("Play button clicked");
    // First make the video element visible
    setVideoState('ready');
  };

  const handleVideoEnd = () => {
    console.log("Video playback ended");
    setVideoState('ended');
    localStorage.setItem("firstMillionIntroVideoWatched", "true");
  };

  const totalSteps = 7; // Updated for the correct number of slides
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const steps = [
    {
      title: "Welcome to First Million",
      subtitle: "Your journey to financial freedom starts here",
      icon: <Sparkles className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-primary",
      content: (
        <div className="text-center space-y-4 sm:space-y-6">
          {videoState === 'init' && (
            <div 
              className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-8 cursor-pointer flex flex-col items-center justify-center"
              onClick={handlePlayVideo}
            >
              <Play className="w-12 h-12 text-white mb-2" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Click to play introduction</h3>
              {videoError && (
                <p className="text-red-300 text-sm mt-2">{videoError}</p>
              )}
            </div>
          )}

          {(videoState === 'ready' || videoState === 'playing') && (
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl overflow-hidden">
              <video 
                ref={videoRef}
                className="w-full rounded-3xl"
                onEnded={handleVideoEnd}
                src={droneVideo}
                playsInline
                muted={false}
                controls
              >
                Your browser does not support the video tag.
              </video>
              {videoError && (
                <p className="text-red-300 text-sm mt-2 p-3">{videoError}</p>
              )}
            </div>
          )}

          {videoState === 'ended' && (
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Track. Invest. Grow.</h3>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4">
              Transform your financial habits with our intelligent tracking system. 
              Monitor income, manage expenses, and build wealth through smart investments.
            </p>
              <div className="bg-white/10 rounded-xl p-3 mt-2 text-center">
                <p className="text-white/90 text-sm">Click <span className="font-semibold">Next</span> button below to continue</p>
              </div>
          </div>
          )}
        </div>
      )
    },
    
    {
      title: "Who Do I Have the Pleasure of Helping Today?",
      subtitle: "My name is Maken and",
      icon: <Building className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-warning",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="userName" className="text-white font-semibold text-sm sm:text-base flex items-center">
                What should I call you? <span className="text-red-300 ml-1">*</span>
              </Label>
              <div className="relative">
              <Input
                id="userName"
                value={data.userName}
                onChange={(e) => setData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Enter your name"
                  className={`${data.userName.trim() === "" && currentStep === 1 ? "border-red-400 bg-red-100/10" : "bg-white/30 border-white/50"} 
                  border-2 text-white placeholder:text-white/60 mt-1 sm:mt-2 h-10 sm:h-11 text-sm sm:text-base 
                  focus:ring-2 focus:ring-white/70 focus:border-white 
                  ${highlightNameInput ? "animate-pulse shadow-lg shadow-yellow-400/20" : ""}`}
                  autoFocus={currentStep === 1}
                  required
                />
                {currentStep === 1 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {data.userName.trim() !== "" ? (
                      <span className="text-green-300">✓</span>
                    ) : (
                      <span className="text-red-300 animate-pulse">Required</span>
                    )}
                  </div>
                )}
              </div>
              {data.userName.trim() === "" && currentStep === 1 ? (
                <p className="text-red-300 text-xs mt-1 flex items-center font-medium">
                  <span className="inline-block mr-1">⚠️</span> Please enter your name to proceed
                </p>
              ) : (
                <p className="text-white/80 text-xs mt-1">Required to continue</p>
              )}
            </div>
            <div>
              <Label htmlFor="monthlyIncome" className="text-white font-semibold text-sm sm:text-base">What is your Monthly Income?</Label>
              <div className="flex space-x-2 mt-1 sm:mt-2">
                <div className="relative w-full">
                  <Input
                    id="monthlyIncome"
                    type="number"
                    inputMode="numeric"
                    value={data.monthlyIncome}
                    onChange={(e) => setData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                    placeholder="5000"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-10 sm:h-11 text-sm sm:text-base pl-9"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white">
                    {getCurrencySymbol(data.currency)}
                  </span>
                </div>
                <div className="relative w-24 sm:w-32">
                  <select 
                    value={data.currency}
                    onChange={(e) => setData(prev => ({ ...prev, currency: e.target.value }))}
                    className="bg-white/30 border-white/40 text-white h-10 sm:h-11 rounded-lg w-full text-xs sm:text-sm pl-2 pr-8 appearance-none cursor-pointer hover:bg-white/40 transition-colors duration-200 font-medium focus:ring-2 focus:ring-white/50 focus:outline-none"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code} className="bg-yellow-700 text-white py-1">
                        {currency.code}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What's Your Financial Goal?",
      subtitle: "Let's set a target to aim for",
      icon: <Target className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="goalMillion"
                  name="goalType"
                  value="million"
                  checked={data.goalType === "million"}
                  onChange={() => setData(prev => ({ 
                    ...prev, 
                    goalType: "million", 
                    targetAmount: "1000000",
                    goalName: "First Million" 
                  }))}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="goalMillion" className="text-white font-medium">
                  Reach My First Million
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="goalCustom"
                  name="goalType"
                  value="custom"
                  checked={data.goalType === "custom"}
                  onChange={() => setData(prev => ({ 
                    ...prev, 
                    goalType: "custom",
                    goalName: prev.goalName || "Dream Car",
                    targetAmount: prev.targetAmount !== "1000000" ? prev.targetAmount : "50000"
                  }))}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="goalCustom" className="text-white font-medium">
                  Set a Custom Goal
                </label>
              </div>
              
              {data.goalType === "custom" && (
                <div className="pl-7 space-y-3 mt-2">
                  <div>
                    <Label htmlFor="goalName" className="text-white font-semibold text-sm">What's your goal?</Label>
                    <Input
                      id="goalName"
                      value={data.goalName}
                      onChange={(e) => setData(prev => ({ ...prev, goalName: e.target.value }))}
                      placeholder="Dream Car, House, Vacation, etc."
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60 mt-1 h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAmount" className="text-white font-semibold text-sm">Target amount</Label>
                    <div className="flex space-x-2 mt-1">
                      <div className="relative w-full">
                        <Input
                          id="targetAmount"
                          type="number"
                          inputMode="numeric"
                          value={data.targetAmount}
                          onChange={(e) => setData(prev => ({ ...prev, targetAmount: e.target.value }))}
                          placeholder="50000"
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-10 text-sm pl-9"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white">
                          {getCurrencySymbol(data.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">
              {data.goalType === "million" ? (
                "The First Million is the hardest"
              ) : (
                `Dream big with your ${data.goalName || "custom goal"}`
              )}
            </h3>
            <p className="text-white/90 text-sm">
              {data.goalType === "million" ? (
                "Once you reach your first million, the path to greater wealth becomes clearer and easier."
              ) : (
                "We'll help you track your progress and reach your goal faster than you thought possible."
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Tell Us About Your Income Sources",
      subtitle: "Select your income categories",
      icon: <PiggyBank className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6">
            <p className="text-white/90 text-sm sm:text-base mb-4">
              How do you make your money? Select the categories that apply to your situation.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {incomeCategories.map(category => (
                <div 
                  key={category.id}
                  onClick={() => toggleIncomeCategory(category.id)}
                  className={`
                    flex items-center p-2 rounded-xl cursor-pointer transition-colors
                    ${data.selectedIncomeCategories.includes(category.id) 
                      ? 'bg-white/30 border-white' 
                      : 'bg-white/10 hover:bg-white/20 border-transparent'}
                    border
                  `}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-2">
                    {category.icon}
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-white/70 text-xs mt-4">
              Selected {data.selectedIncomeCategories.length} of {incomeCategories.length} categories
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Let's Track Your Expenses",
      subtitle: "Select categories you want to track",
      icon: <ShoppingCart className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-to-br from-indigo-500 to-blue-600",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6">
            <p className="text-white/90 text-sm sm:text-base mb-4">
              Choose expense categories that matter to you. You can always add more later.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {expenseCategories.map(category => (
                <div 
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    flex items-center p-2 rounded-xl cursor-pointer transition-colors
                    ${data.selectedExpenseCategories.includes(category.id) 
                      ? 'bg-white/30 border-white' 
                      : 'bg-white/10 hover:bg-white/20 border-transparent'}
                    border
                  `}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-2">
                    {category.icon}
                  </div>
                  <span className="text-white text-xs sm:text-sm font-medium truncate">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-white/70 text-xs mt-4">
              Selected {data.selectedExpenseCategories.length} of {expenseCategories.length} categories
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Your Financial Goal Timeline",
      subtitle: "Let's see how soon you'll reach your goal",
      icon: <CalendarClock className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
              {data.currency === "USD" 
                ? formatCurrency(parseFloat(data.targetAmount))
                : `${currencies.find(c => c.code === data.currency)?.symbol} ${convertFromUSD(parseFloat(data.targetAmount), data.currency).toLocaleString()} ${data.goalType === "million" ? "≈ 1 million US dollars" : ""}`
              }
            </h3>
            <p className="text-white/90 text-sm sm:text-base">
              {data.goalType === "million" ? "Your First Million dollars Target" : `Your ${data.goalName} Goal`}
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-6">
            {data.monthlyIncome ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/30 flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Time to Reach Your Goal</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-white/10 rounded-full px-3 py-1 text-sm text-white">
                        {calculateTimeToTarget().months} months
                      </span>
                      <span className="bg-white/10 rounded-full px-3 py-1 text-sm text-white">
                        {calculateTimeToTarget().years} years
                      </span>
                    </div>
                  </div>
                </div>
                
                {calculateTimeToTarget().isLongPeriod && (
                  <div className="mt-4 bg-white/10 p-3 rounded-xl">
                    <p className="text-white/90 text-sm">
                      That's a long period, but don't worry - we've got you! We'll help you increase income, 
                      decrease expenses, and invest the difference so you can achieve your goal much earlier.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/80 text-center">
                Please enter your monthly income to see your timeline to {data.goalType === "million" ? "$1 million" : `your ${data.goalName} goal`}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      title: "Ready to Begin!",
      subtitle: "Your financial journey starts now",
      icon: <TrendingUp className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} text-white`} />,
      gradient: "bg-gradient-primary",
      content: (
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">
              Welcome aboard, {data.userName || "Future Millionaire"}!
            </h3>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
              You're all set to start tracking your path to financial freedom. 
              Remember: discipline today creates wealth tomorrow.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="bg-white/10 rounded-2xl p-3 sm:p-4">
                <p className="text-white/70">Monthly Income</p>
                <p className="font-bold text-white">
                  {data.monthlyIncome 
                    ? `${currencies.find(c => c.code === data.currency)?.symbol} ${parseFloat(data.monthlyIncome).toLocaleString()}`
                    : `${currencies.find(c => c.code === data.currency)?.symbol} 0`
                  }
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 sm:p-4">
                <p className="text-white/70">
                  {data.goalType === "million" ? "Target Goal" : data.goalName}
                </p>
                <p className="font-bold text-white">
                  {data.currency === "USD" 
                    ? `${currencies.find(c => c.code === data.currency)?.symbol} ${parseFloat(data.targetAmount).toLocaleString()}` 
                    : `${currencies.find(c => c.code === data.currency)?.symbol} ${convertFromUSD(parseFloat(data.targetAmount), data.currency).toLocaleString()}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = steps[currentStep];
  const canProceed = currentStep === 0 || 
    (currentStep === 1 && data.userName.trim() !== "") || 
    (currentStep === 2 && data.userName && data.monthlyIncome) ||
    (currentStep === 3 && (
      (data.goalType === "million") || 
      (data.goalType === "custom" && data.goalName && data.targetAmount)
    )) ||
    (currentStep === 4 && data.selectedIncomeCategories.length > 0) || // Require at least one income category
    (currentStep === 5 && data.selectedExpenseCategories.length > 0) || // Require at least one expense category
    (currentStep === 6); // Financial goal timeline step - can always proceed

  // Store onboarding data in Supabase when a logged-in user completes onboarding
  const storeOnboardingDataInSupabase = async (onboardingData: OnboardingData) => {
    try {
      // Set auth status as skipped (user can sign up later from dashboard)
      localStorage.setItem("firstMillionAuthStatus", "skipped");
      
      // Store onboarding data in localStorage regardless of authentication
      localStorage.setItem("firstMillionUserName", onboardingData.userName);
      localStorage.setItem("firstMillionMonthlyIncome", onboardingData.monthlyIncome);
      localStorage.setItem("firstMillionCurrency", onboardingData.currency);
      localStorage.setItem("firstMillionGoalName", onboardingData.goalName || "First Million");
      localStorage.setItem("firstMillionTargetAmount", onboardingData.targetAmount);
      localStorage.setItem("firstMillionGoalType", onboardingData.goalType);
      
      return true;
    } catch (error) {
      console.error("Error storing onboarding data:", error);
      return false;
    }
  };

  const handleNext = () => {
    console.log(`Current step: ${currentStep}, Total steps: ${steps.length}`);
    
    // Validation for step 1 (name input step) only
    if (currentStep === 1) {
      // Validate name
      if (!data.userName) {
        toast({
          title: "Missing information",
          description: "Please enter your name to continue",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validation for step 2 (income and currency)
    if (currentStep === 2) {
      // Validate income after we have a name
      if (!data.monthlyIncome || parseFloat(data.monthlyIncome) <= 0) {
        toast({
          title: "Invalid income",
          description: "Please enter a valid monthly income",
          variant: "destructive",
        });
        return;
      }
    }
    
    // If this is the final step, complete onboarding
    if (currentStep === steps.length - 1) {
      console.log("Final step reached. Completing onboarding...");
      
      // Prevent multiple clicks
      const buttonsContainer = document.querySelector('[role="dialog"] button');
      if (buttonsContainer) {
        buttonsContainer.setAttribute('disabled', 'true');
      }
      
      // Store basic data
      try {
        // Store onboarding data in localStorage regardless of authentication
        localStorage.setItem("firstMillionUserName", data.userName);
        localStorage.setItem("firstMillionMonthlyIncome", data.monthlyIncome);
        localStorage.setItem("firstMillionCurrency", data.currency);
        localStorage.setItem("firstMillionGoalName", data.goalName || "First Million");
      localStorage.setItem("firstMillionTargetAmount", data.targetAmount);
        localStorage.setItem("firstMillionGoalType", data.goalType);
        
        // Set onboarding flag as completed
        localStorage.setItem("firstMillionOnboardingCompleted", "true");
        // Set auth status
        localStorage.setItem("firstMillionAuthStatus", "skipped");
        
        // Simple direct redirect
        console.log("Navigating directly to dashboard");
        window.location.href = "/dashboard";
      } catch (error) {
        console.error("Error during completion:", error);
        toast({
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
          variant: "destructive",
        });
      }
      
      return;
    }
    
    // Navigate to next step
    setCurrentStep(prev => prev + 1);
  };

  // Create some initial sample data in Supabase so tables aren't empty
  const createInitialSampleData = async (onboardingData: OnboardingData) => {
    try {
      // Get current Supabase user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only attempt to store if authenticated
      if (!user) {
        console.log("No authenticated user found, skipping sample data creation");
        return true; // Return success even if not authenticated since this step is optional
      }
      
      console.log("Creating initial sample data for user:", user.id);
      
      // Define today and some past dates for sample data
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      // 1. Create initial categories if not already created during onboarding
      let expenseCatIds: number[] = [];
      let incomeCatIds: number[] = [];
      
      // Check if we already have categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingCategories || existingCategories.length === 0) {
        console.log("Creating initial categories");
        
        // Process expense categories
        const expenseCats = onboardingData.selectedExpenseCategories.map((id, index) => {
          const category = expenseCategories.find(cat => cat.id === id);
          return {
            id: index + 1, // Start from 1
            user_id: user.id,
            type: 'expense',
            name: category?.name || id,
            icon: category?.faIcon || '',
            color: getRandomColor(),
            created_at: new Date().toISOString()
          };
        });

        // Process income categories
        const incomeCats = onboardingData.selectedIncomeCategories.map((id, index) => {
          const category = incomeCategories.find(cat => cat.id === id);
          return {
            id: expenseCats.length + index + 1,
            user_id: user.id,
            type: 'income',
            name: category?.name || id,
            icon: category?.faIcon || '',
            color: getRandomColor(),
            created_at: new Date().toISOString()
          };
        });
        
        // Insert all categories
        const allCategories = [...expenseCats, ...incomeCats];
        
        if (allCategories.length > 0) {
          const { error: catError } = await supabase
            .from('categories')
            .insert(allCategories);
          
          if (catError) {
            console.error("Error creating initial categories:", catError);
          } else {
            console.log("Created initial categories:", allCategories.length);
            
            // Store IDs for later use
            expenseCatIds = expenseCats.map(cat => cat.id);
            incomeCatIds = incomeCats.map(cat => cat.id);
          }
        }
      } else {
        // Use existing categories
        expenseCatIds = existingCategories
          .filter(cat => cat.type === 'expense')
          .map(cat => cat.id);
        incomeCatIds = existingCategories
          .filter(cat => cat.type === 'income')
          .map(cat => cat.id);
      }
      
      // 2. Create initial assets (bank account, credit card, etc.)
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingAssets || existingAssets.length === 0) {
        console.log("Creating initial assets");
        
        const initialAssets = [
          {
            id: 1,
            user_id: user.id,
            name: "Bank Account",
            type: "account",
            balance: parseFloat(onboardingData.monthlyIncome || "0") * 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            user_id: user.id,
            name: "Credit Card",
            type: "credit",
            balance: -500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            user_id: user.id,
            name: "Savings",
            type: "savings",
            balance: parseFloat(onboardingData.monthlyIncome || "0") * 0.5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const { error: assetsError } = await supabase
          .from('assets')
          .insert(initialAssets);
        
        if (assetsError) {
          console.error("Error creating initial assets:", assetsError);
        } else {
          console.log("Created initial assets");
        }
      }
      
      // 3. Create initial transactions if none exist
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingTransactions || existingTransactions.length === 0) {
        console.log("Creating initial transactions");
        
        // Only create transactions if we have categories
        if (expenseCatIds.length > 0 && incomeCatIds.length > 0) {
          // Sample income transaction (salary)
          const monthlyIncome = parseFloat(onboardingData.monthlyIncome || "0");
          
          const initialTransactions = [
            // Income transaction (salary)
            {
              id: 1,
              user_id: user.id,
              type: "income",
              amount: monthlyIncome,
              description: "Monthly salary",
              date: lastWeek.toISOString(),
              category_id: incomeCatIds[0] || null,
              created_at: lastWeek.toISOString(),
              updated_at: lastWeek.toISOString()
            },
            // Some expense transactions
            {
              id: 2,
              user_id: user.id,
              type: "expense",
              amount: monthlyIncome * 0.1,
              description: "Groceries",
              date: yesterday.toISOString(),
              category_id: expenseCatIds[0] || null,
              created_at: yesterday.toISOString(),
              updated_at: yesterday.toISOString()
            },
            {
              id: 3,
              user_id: user.id,
              type: "expense",
              amount: monthlyIncome * 0.05,
              description: "Dining out",
              date: today.toISOString(),
              category_id: expenseCatIds.length > 1 ? expenseCatIds[1] : expenseCatIds[0],
              created_at: today.toISOString(),
              updated_at: today.toISOString()
            }
          ];
          
          const { error: txError } = await supabase
            .from('transactions')
            .insert(initialTransactions);
          
          if (txError) {
            console.error("Error creating initial transactions:", txError);
          } else {
            console.log("Created initial transactions");
          }
        }
      }
      
      // 4. Create an initial investment if none exist
      const { data: existingInvestments } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingInvestments || existingInvestments.length === 0) {
        console.log("Creating initial investment");
        
        const monthlyIncome = parseFloat(onboardingData.monthlyIncome || "0");
        const initialInvestment = {
          id: 1,
          user_id: user.id,
          name: "Index Fund",
          type: "stock",
          initial_amount: monthlyIncome * 0.2,
          current_value: monthlyIncome * 0.22, // 10% growth
          start_date: lastWeek.toISOString(),
          notes: "Initial investment",
          created_at: lastWeek.toISOString(),
          updated_at: today.toISOString()
        };
        
        const { error: investError } = await supabase
          .from('investments')
          .insert(initialInvestment);
        
        if (investError) {
          console.error("Error creating initial investment:", investError);
        } else {
          console.log("Created initial investment");
        }
      }
      
      // Set the data synced flag in localStorage
      localStorage.setItem("firstMillionDataSynced", "true");
      console.log("Sample data creation complete, data synced flag set");
      return true;
    } catch (err) {
      console.error("Error creating initial sample data:", err);
      return false;
    }
  };

  // Helper function to generate random colors for categories
  const getRandomColor = () => {
    const colors = [
      '#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', 
      '#673ab7', '#3f51b5', '#009688', '#ff5722', '#795548',
      '#607d8b', '#e91e63', '#ffeb3b', '#cddc39', '#8bc34a'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Apply global styles for select dropdown */}
      <style dangerouslySetInnerHTML={{ __html: selectStyles }} />
      
      {/* Progress Bar */}
      <div className="p-3 sm:p-4 pb-0">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center">
            {/* Winged Shoe Icon */}
            <svg 
              className="w-4 h-4 mr-1.5 inline-block" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M16.5 10C16.5 10 15 9.5 14 9C13 8.5 12 6.5 10.5 6C9 5.5 6 6.5 6 6.5L8 11.5L13.5 14L16.5 13V10Z" 
                fill="currentColor" 
                opacity="0.8"
              />
              <path 
                d="M17 13.5L14 14.5L9 12.5L7 8.5C7 8.5 8.5 14 9 15C9.5 16 11.5 17 13 17C14.5 17 16.5 16 17 15C17.5 14 17 13.5 17 13.5Z" 
                fill="currentColor" 
                opacity="0.8"
              />
              <path 
                d="M19 10C20.5 9 22 10 22 10C22 10 20 12 19 12C18 12 17.5 11 17.5 11C17.5 11 17.5 11 19 10Z" 
                fill="currentColor"
              />
              <path 
                d="M16 6C17.5 5 19 6 19 6C19 6 17 8 16 8C15 8 14.5 7 14.5 7C14.5 7 14.5 7 16 6Z" 
                fill="currentColor"
              />
              <path 
                d="M20 6C21.5 5 23 6 23 6C23 6 21 8 20 8C19 8 18.5 7 18.5 7C18.5 7 18.5 7 20 6Z" 
                fill="currentColor"
              />
              <path 
                d="M17 3C18.5 2 20 3 20 3C20 3 18 5 17 5C16 5 15.5 4 15.5 4C15.5 4 15.5 4 17 3Z" 
                fill="currentColor"
              />
            </svg>
            
          </span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 flex items-center justify-center">
        <Card className={`w-full max-w-[95vw] sm:max-w-md border-0 shadow-glow ${currentSlide.gradient} text-white overflow-hidden relative`}>
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16" />
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/5 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12" />
          
          <CardContent className="p-5 sm:p-8 relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className={`${isMobile ? "w-16 h-16" : "w-20 h-20"} bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm`}>
                {currentSlide.icon}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-5 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{currentSlide.title}</h1>
              <p className="text-white/80 text-sm sm:text-base">{currentSlide.subtitle}</p>
            </div>

            {/* Content */}
            {currentSlide.content}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-10"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Back
        </Button>

        <div className="flex space-x-1.5 sm:space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-200 ${
                index === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-gradient-primary text-white shadow-glow disabled:opacity-50 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10"
        >
          {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        </Button>
      </div>
    </div>
  );
}