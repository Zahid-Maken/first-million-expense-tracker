import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Trash2, AlertCircle, Wallet } from "lucide-react";
import { getInvestments, updateInvestment, deleteInvestment, getAssets, saveAssets } from "@/lib/localStorageService";
import { formatCurrency, smartFormatCurrency } from "@/lib/currencyUtils";
import type { Investment } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to generate dates for the current month
const generateDaysInCurrentMonth = (startDate: Date): Date[] => {
  const dates = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  
  // Get the last day of the month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // Generate dates from first day of month to last day of month
  let currentDate = new Date(firstDayOfMonth);
  while (currentDate <= lastDayOfMonth) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

interface DataPoint {
  date: Date;
  value: number;
  isHighlighted?: boolean;
  isActive?: boolean;
}

// Generate historical data points with natural variations
const generateHistoricalData = (
  startDate: Date, 
  initialValue: number, 
  currentValue: number, 
  allDates: Date[]
): DataPoint[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find index of start date and today in the dates array
  const startIndex = allDates.findIndex(date => 
    date.getDate() === startDate.getDate() && 
    date.getMonth() === startDate.getMonth()
  );
  
  const todayIndex = allDates.findIndex(date => 
    date.getDate() === today.getDate() && 
    date.getMonth() === today.getMonth()
  );
  
  // Calculate how many days from start to today
  const activeDays = todayIndex - startIndex + 1;
  
  // Generate data points with natural variations
  return allDates.map((date, index) => {
    // Before investment started
    if (index < startIndex) {
      return { date, value: 0, isActive: false };
    }
    
    // After today
    if (index > todayIndex) {
      return { date, value: 0, isActive: false };
    }
    
    // For days between start and today
    const daysFromStart = index - startIndex;
    
    // Create a smooth progression from initial to current value
    // Use a more natural curve that handles both positive and negative changes well
    let progress;
    if (activeDays <= 1) {
      progress = 1; // If only one day, use the current value
    } else {
      // Use a cubic easing function for smoother progression
      progress = daysFromStart / (activeDays - 1);
      // Apply cubic easing: progress^3
      progress = progress * progress * progress;
    }
    
    // Calculate the value for this day
    let value = initialValue + (currentValue - initialValue) * progress;
    
    // Add some random variation to make the chart look natural
    // Less variation at the beginning and end points
    if (index !== startIndex && index !== todayIndex) {
      // Smaller variations for larger value differences to avoid extreme spikes
      const variationFactor = Math.min(0.03, Math.abs(initialValue - currentValue) / Math.max(initialValue, 100) * 0.01);
      const randomFactor = 1 + (Math.random() * variationFactor * 2 - variationFactor);
      value *= randomFactor;
    }
    
    // The last active point is always exactly the current value
    if (index === todayIndex) {
      return { date, value: currentValue, isHighlighted: true, isActive: true };
    }
    
    return { date, value, isActive: true };
  });
};

export default function InvestmentDetailsPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const investmentId = params ? parseInt(params.id as string) : null;

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [profitLossAmount, setProfitLossAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [chartColor, setChartColor] = useState<string>("");
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [investmentStartDate, setInvestmentStartDate] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (investmentId) {
      const allInvestments = getInvestments();
      const foundInvestment = allInvestments.find(inv => inv.id === investmentId);
      if (foundInvestment) {
        setInvestment(foundInvestment);
        
        // Set chart color based on investment ID (to match dashboard card colors)
        const colorIndex = (investmentId - 1) % 4;
        const colors = [
          "from-blue-500 to-indigo-600",
          "from-red-500 to-orange-600",
          "from-green-500 to-teal-600",
          "from-purple-500 to-pink-600"
        ];
        setChartColor(colors[colorIndex]);
        
        // Simulate a creation date for the investment (since we don't have actual date)
        // In a real app, you would store and use the actual creation date
        const creationDate = new Date();
        creationDate.setDate(creationDate.getDate() - 15); // Assume created 15 days ago
        setInvestmentStartDate(creationDate);
        
        // Generate all days in the current month
        const allDaysInMonth = generateDaysInCurrentMonth(creationDate);
        
        // Generate historical data points
        const initialAmount = parseFloat(foundInvestment.initial_amount);
        const currentValue = parseFloat(foundInvestment.current_value);
        const dataPoints = generateHistoricalData(creationDate, initialAmount, currentValue, allDaysInMonth);
        
        setChartData(dataPoints);
        
        // Find and select the latest active point
        const lastActivePoint = [...dataPoints].reverse().find(point => point.isActive === true) as DataPoint;
        if (lastActivePoint) {
          setSelectedPoint(lastActivePoint);
        }
      } else {
        toast({
          title: "Investment Not Found",
          description: "The requested investment could not be found.",
          variant: "destructive",
        });
        setLocation("/dashboard?tab=investments"); // Redirect back to dashboard with investments tab active
      }
    } else {
      setLocation("/dashboard?tab=investments"); // Redirect if no ID provided
    }
    setIsLoading(false);
  }, [investmentId, setLocation, toast]);

  const handleUpdateProfitLoss = () => {
    if (!investment || !investmentStartDate) return;

    const amount = parseFloat(profitLossAmount);
    if (isNaN(amount)) {
      setErrorMessage("Please enter a valid number.");
      return;
    }

    setErrorMessage(null);
    const newCurrentValue = (parseFloat(investment.current_value) + amount).toFixed(2);

    try {
      const updatedInvestment = updateInvestment(investment.id, { current_value: newCurrentValue });
      setInvestment(updatedInvestment); // Update local state with new value
      setProfitLossAmount(""); // Clear input
      
      // Generate all days in the current month
      const allDaysInMonth = generateDaysInCurrentMonth(investmentStartDate);
      
      // Regenerate historical data with the new current value
      const initialAmount = parseFloat(updatedInvestment.initial_amount);
      const currentValue = parseFloat(newCurrentValue);
      const newDataPoints = generateHistoricalData(investmentStartDate, initialAmount, currentValue, allDaysInMonth);
      
      setChartData(newDataPoints);
      
      // Find and select the latest active point
      const lastActivePoint = [...newDataPoints].reverse().find(point => point.isActive === true) as DataPoint;
      if (lastActivePoint) {
        setSelectedPoint(lastActivePoint);
      }
      
      toast({
        title: "Investment Updated",
        description: `Current value adjusted by ${formatCurrency(amount)} to ${smartFormatCurrency(parseFloat(newCurrentValue))}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error Updating Investment",
        description: "Failed to update the investment value.",
        variant: "destructive",
      });
      console.error("Error updating investment:", error);
    }
  };

  const handleDeleteInvestment = () => {
    if (!investment) return;
    
    try {
      deleteInvestment(investment.id);
      toast({
        title: "Investment Deleted",
        description: `${investment.name} has been removed from your portfolio.`,
        variant: "default",
      });
      setLocation("/dashboard?tab=investments");
    } catch (error) {
      toast({
        title: "Error Deleting Investment",
        description: "Failed to delete the investment.",
        variant: "destructive",
      });
      console.error("Error deleting investment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!investment) {
    return null; // Should redirect by now
  }

  const currentProfitLoss = parseFloat(investment.current_value) - parseFloat(investment.initial_amount);
  const isProfit = currentProfitLoss >= 0;
  const profitLossPercentage = (currentProfitLoss / parseFloat(investment.initial_amount) * 100).toFixed(1);

  // Filter only active data points for min/max calculation
  const activePoints = chartData.filter(point => point.isActive && point.value > 0);
  
  // Calculate min and max values for the chart with padding to avoid extreme edges
  let minValue = Math.min(...activePoints.map(d => d.value));
  let maxValue = Math.max(...activePoints.map(d => d.value));
  
  // Add padding to prevent the chart from touching the edges
  const valueRange = maxValue - minValue;
  const paddingFactor = 0.1; // 10% padding
  
  // Ensure we have a minimum range to handle cases where min and max are very close
  const minRange = Math.max(maxValue * 0.1, 10);
  const effectiveRange = Math.max(valueRange, minRange);
  
  minValue = Math.max(0, minValue - effectiveRange * paddingFactor);
  maxValue = maxValue + effectiveRange * paddingFactor;
  
  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 100;
  
  // Generate SVG path for the chart line with smooth curve - only for active points
  const activeDates = chartData.filter(point => point.isActive && point.value > 0);
  
  // Find indices of active points in the full chart data
  const activeIndices = activeDates.map(activePoint => 
    chartData.findIndex(point => 
      point.date.getDate() === activePoint.date.getDate() &&
      point.date.getMonth() === activePoint.date.getMonth()
    )
  );
  
  let chartPath = "";
  if (activeDates.length > 0) {
    // Start the path at the first active point
    const firstIndex = activeIndices[0];
    const firstPoint = chartData[firstIndex];
    const firstX = (firstIndex / (chartData.length - 1)) * chartWidth;
    const firstY = chartHeight - ((firstPoint.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    chartPath = `M${firstX},${firstY}`;
    
    // Add curve segments between active points
    for (let i = 1; i < activeDates.length; i++) {
      const prevIndex = activeIndices[i-1];
      const currIndex = activeIndices[i];
      
      const x1 = (prevIndex / (chartData.length - 1)) * chartWidth;
      const y1 = chartHeight - ((chartData[prevIndex].value - minValue) / (maxValue - minValue || 1)) * chartHeight;
      const x2 = (currIndex / (chartData.length - 1)) * chartWidth;
      const y2 = chartHeight - ((chartData[currIndex].value - minValue) / (maxValue - minValue || 1)) * chartHeight;
      
      // Calculate control points for smooth curve
      const cpx1 = x1 + (x2 - x1) / 3;
      const cpy1 = y1;
      const cpx2 = x1 + 2 * (x2 - x1) / 3;
      const cpy2 = y2;
      
      chartPath += ` C${cpx1},${cpy1} ${cpx2},${cpy2} ${x2},${y2}`;
    }
  }
  
  const gradientId = `chart-gradient-${investment.id}`;
  const shadowId = `chart-shadow-${investment.id}`;

  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  // Calculate the x positions for the area under the curve
  const firstActiveX = activeIndices.length > 0 
    ? (activeIndices[0] / (chartData.length - 1)) * chartWidth 
    : 0;
  const lastActiveX = activeIndices.length > 0 
    ? (activeIndices[activeIndices.length - 1] / (chartData.length - 1)) * chartWidth 
    : chartWidth;

  // Format creation date
  const creationDate = investmentStartDate ? 
    investmentStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
    'Unknown';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setLocation("/dashboard?tab=investments")}
            className="rounded-full h-10 w-10 flex items-center justify-center border-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{investment.name}</h1>
            <p className="text-muted-foreground">Investment Details</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Chart and stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Chart */}
            <Card className={`overflow-hidden bg-gradient-to-br ${chartColor} text-white shadow-lg`}>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white/90">Performance</h3>
                    <p className="text-3xl font-bold">{smartFormatCurrency(parseFloat(investment.current_value))}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    isProfit ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
                  }`}>
                    {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold text-sm">{isProfit ? "+" : ""}{profitLossPercentage}%</span>
                  </div>
                </div>
                
                <div className="h-[220px] w-full relative">
                  {/* Selected point tooltip */}
                  {selectedPoint && selectedPoint.isActive && (
                    <div 
                      className="absolute bg-black/80 backdrop-blur-sm text-white rounded-lg px-3 py-2 z-10 transform -translate-x-1/2 -translate-y-full pointer-events-none shadow-xl"
                      style={{ 
                        left: `${(chartData.indexOf(selectedPoint) / (chartData.length - 1)) * 100}%`,
                        top: `${chartHeight - ((selectedPoint.value - minValue) / (maxValue - minValue || 1)) * chartHeight}px`,
                        marginTop: "-10px"
                      }}
                    >
                      <div className="text-xs font-medium opacity-80">{selectedPoint.date.getDate()} {currentMonth}</div>
                      <div className="text-sm font-bold">{smartFormatCurrency(selectedPoint.value)}</div>
                    </div>
                  )}
                  
                  <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.05" />
                      </linearGradient>
                      
                      {/* Add drop shadow filter */}
                      <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      
                      {/* Add pattern for portfolio graph */}
                      <pattern id="portfolioPattern" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                      </pattern>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio, i) => (
                      <line 
                        key={i}
                        x1="0" 
                        y1={chartHeight * ratio} 
                        x2={chartWidth} 
                        y2={chartHeight * ratio} 
                        stroke="white" 
                        strokeOpacity="0.1" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                      />
                    ))}
                    
                    {/* Horizontal axis line */}
                    <line 
                      x1="0" 
                      y1={chartHeight} 
                      x2={chartWidth} 
                      y2={chartHeight} 
                      stroke="white" 
                      strokeOpacity="0.2" 
                      strokeWidth="1"
                    />
                    
                    {/* Area under the line - only for active points */}
                    {chartPath && (
                      <path 
                        d={`${chartPath} L${lastActiveX} ${chartHeight} L${firstActiveX} ${chartHeight} Z`} 
                        fill={investment.name.toLowerCase().includes("portfolio") ? "url(#portfolioPattern)" : `url(#${gradientId})`}
                        className="transition-all duration-300"
                      />
                    )}
                    
                    {/* Line with drop shadow - only for active points */}
                    {chartPath && (
                      <path
                        d={chartPath}
                        fill="none"
                        stroke="white"
                        strokeWidth={investment.name.toLowerCase().includes("portfolio") ? "3" : "2"}
                        strokeLinecap="round"
                        filter={`url(#${shadowId})`}
                        className="transition-all duration-300"
                      />
                    )}
                    
                    {/* Only show highlighted current day point */}
                    {chartData.map((point, i) => {
                      if (point.isHighlighted && point.isActive) {
                        const x = (i / (chartData.length - 1)) * chartWidth;
                        const y = chartHeight - ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
                        
                        return (
                          <g key={i}>
                            <circle 
                              cx={x} 
                              cy={y} 
                              r={investment.name.toLowerCase().includes("portfolio") ? "8" : "6"}
                              fill="white" 
                              stroke="white" 
                              strokeWidth="2"
                              filter={`url(#${shadowId})`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedPoint(point)}
                              className="transition-all duration-300"
                            />
                            {investment.name.toLowerCase().includes("portfolio") && (
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="3"
                                fill={chartColor.includes("blue") ? "#4299e1" : 
                                      chartColor.includes("red") ? "#f56565" : 
                                      chartColor.includes("green") ? "#48bb78" : "#9f7aea"}
                                className="transition-all duration-300"
                              />
                            )}
                          </g>
                        );
                      }
                      return null;
                    })}
                    
                    {/* X-axis labels (days) */}
                    {chartData.map((point, i) => {
                      // Show days at regular intervals
                      const daysToShow = [1, 5, 10, 15, 20, 25, chartData.length];
                      if (daysToShow.includes(point.date.getDate())) {
                        const x = (i / (chartData.length - 1)) * chartWidth;
                        return (
                          <text 
                            key={i}
                            x={x} 
                            y={chartHeight + 15} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="white" 
                            opacity="0.7"
                          >
                            {point.date.getDate()}
                          </text>
                        );
                      }
                      return null;
                    })}
                  </svg>
                  
                  {/* Month label in center */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white/80 font-medium">
                    {currentMonth}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-black/10 px-6 py-3">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Started on {creationDate}</span>
                </div>
              </CardFooter>
            </Card>

            {/* Investment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    Initial Investment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-3xl font-bold text-foreground">{smartFormatCurrency(parseFloat(investment.initial_amount))}</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    Current Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-3xl font-bold text-foreground">{smartFormatCurrency(parseFloat(investment.current_value))}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Profit/Loss Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>Current Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-3 ${
                  isProfit ? "text-success" : "text-destructive"
                }`}>
                  <div className={`p-3 rounded-full ${
                    isProfit ? "bg-success/10" : "bg-destructive/10"
                  }`}>
                    {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{smartFormatCurrency(currentProfitLoss)}</p>
                    <p className="text-sm opacity-80">{isProfit ? "+" : ""}{profitLossPercentage}% from initial investment</p>
                  </div>
                </div>
                
                {/* Withdraw Profit Button - Only show if there's profit */}
                {isProfit && currentProfitLoss > 0 && (
                  <div className="mt-6">
                    <Button 
                      variant="outline"
                      className={`w-full ${isProfit ? "text-success hover:bg-success/10" : ""}`}
                      onClick={() => {
                        // Get investment asset
                        const assets = getAssets();
                        const investmentAsset = assets.find(asset => asset.id === "4");
                        if (!investmentAsset) {
                          toast({
                            title: "Error",
                            description: "Investment asset not found.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Update the investment asset balance
                        const updatedAssets = assets.map(asset => {
                          if (asset.id === "4") {
                            return {
                              ...asset,
                              balance: asset.balance + currentProfitLoss
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
                          const updated = updateInvestment(investment.id, updatedInvestment);
                          setInvestment(updated);
                          
                          // Show success toast
                          toast({
                            title: "Profit Withdrawn",
                            description: `${smartFormatCurrency(currentProfitLoss)} has been added to your investments asset.`,
                            variant: "default",
                          });
                          
                          // Update chart data
                          if (investmentStartDate) {
                            // Generate all days in the current month
                            const allDaysInMonth = generateDaysInCurrentMonth(investmentStartDate);
                            
                            // Regenerate historical data with the new current value
                            const initialAmount = parseFloat(updated.initial_amount);
                            const currentValue = parseFloat(updated.current_value);
                            const dataPoints = generateHistoricalData(investmentStartDate, initialAmount, currentValue, allDaysInMonth);
                            
                            setChartData(dataPoints);
                            
                            // Find and select the latest active point
                            const lastActivePoint = [...dataPoints].reverse().find(point => point.isActive === true) as DataPoint;
                            if (lastActivePoint) {
                              setSelectedPoint(lastActivePoint);
                            }
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to withdraw profit.",
                            variant: "destructive",
                          });
                          console.error("Error withdrawing profit:", error);
                        }
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Withdraw Profit to Investment Asset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Adjust value */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Adjust Value</CardTitle>
                <CardDescription>Update your investment's current value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profitLossAmount" className="text-sm font-medium">
                      Amount to add or subtract
                    </Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="profitLossAmount"
                        type="number"
                        placeholder="e.g., 500 for profit, -100 for loss"
                        value={profitLossAmount}
                        onChange={(e) => setProfitLossAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {errorMessage && <p className="text-destructive text-sm mt-1.5">{errorMessage}</p>}
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-1">How to use:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Enter a positive number to add profit</li>
                      <li>Enter a negative number to record a loss</li>
                      <li>Values update the chart automatically</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  onClick={handleUpdateProfitLoss} 
                  className="w-full"
                  size="lg"
                >
                  Update Investment Value
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Investment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{investment?.name}</span>? 
              This action cannot be undone and all investment data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvestment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Investment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 