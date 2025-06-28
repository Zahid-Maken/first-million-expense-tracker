import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import type { Investment } from "@shared/schema";
import { getCurrencySymbol, formatCurrency, smartFormatCurrency } from "@/lib/currencyUtils";
import { getInvestments } from "@/lib/localStorageService";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface InvestmentPortfolioChartProps {
  investments: Investment[];
}

type ChartView = "lines" | "performance";

export default function InvestmentPortfolioChart({ investments }: InvestmentPortfolioChartProps) {
  const [totalValue, setTotalValue] = useState(0);
  const [chartView, setChartView] = useState<ChartView>("lines");
  const currencySymbol = getCurrencySymbol();
  
  useEffect(() => {
    // Calculate total investment value
    const total = investments.reduce((sum, investment) => {
      return sum + parseFloat(investment.current_value);
    }, 0);
    setTotalValue(total);
  }, [investments]);
  
  // Generate historical data for the chart
  const generateHistoricalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Calculate minimum value to ensure chart doesn't show zero
    let minValue = Infinity;
    investments.forEach(investment => {
      const value = parseFloat(investment.initial_amount);
      if (value < minValue && value > 0) minValue = value;
    });
    
    // If no investments or all zero, set a default minimum
    if (minValue === Infinity) minValue = 100;
    
    return months.map((month, index) => {
      const data: any = { month };
      
      // Add data for each investment with realistic variations
      investments.forEach((investment, invIndex) => {
        const initialValue = parseFloat(investment.initial_amount);
        const currentValue = parseFloat(investment.current_value);
        
        // Handle automatic profit strategy
        let monthlyValues = [];
        if (investment.profit_strategy === "automatic" && investment.profit_type && investment.profit_value) {
          // Calculate growth based on profit settings
          const profitValue = parseFloat(investment.profit_value);
          
          // Calculate monthly value based on profit frequency and type
          if (investment.profit_type === "fixed") {
            // Fixed amount added at each interval
            let intervalMultiplier = 1; // Default for monthly
            if (investment.profit_frequency === "weekly") intervalMultiplier = 4;
            if (investment.profit_frequency === "yearly") intervalMultiplier = 1/12;
            
            // Calculate monthly profit
            const monthlyProfit = profitValue * intervalMultiplier;
            
            // Generate values for each month with the fixed profit applied
            for (let i = 0; i <= index; i++) {
              const value = Math.max(initialValue + (monthlyProfit * i), minValue / 10);
              monthlyValues.push(value);
            }
          } else if (investment.profit_type === "percentage") {
            // Percentage growth at each interval
            let intervalMultiplier = 1; // Default for monthly
            if (investment.profit_frequency === "weekly") intervalMultiplier = 4;
            if (investment.profit_frequency === "yearly") intervalMultiplier = 1/12;
            
            // Calculate monthly percentage rate (as decimal)
            const monthlyRate = (profitValue / 100) * intervalMultiplier;
            
            // Generate values for each month with compound growth
            let value = Math.max(initialValue, minValue / 10);
            monthlyValues.push(value);
            for (let i = 1; i <= index; i++) {
              value = value * (1 + monthlyRate);
              monthlyValues.push(value);
            }
          }
          
          // Use the calculated value for this month
          const calculatedValue = monthlyValues[index];
          // Add a small random variation (±1%) to make the chart more natural
          const randomFactor = 0.99 + (Math.random() * 0.02);
          data[investment.name] = Math.max(calculatedValue * randomFactor, minValue / 10);
        } else {
          // Manual profit strategy - calculate a growth trajectory from initial to current value
          const growthFactor = currentValue / Math.max(initialValue, 0.01); // Avoid division by zero
          const monthlyGrowthRate = Math.pow(growthFactor, 1/6) - 1;
          
          // Apply growth with some randomness for each month
          const baseValue = Math.max(initialValue, minValue / 10) * Math.pow(1 + monthlyGrowthRate, index);
          const randomFactor = 0.95 + (Math.random() * 0.1); // Random factor between 0.95 and 1.05
          
          data[investment.name] = Math.max(baseValue * randomFactor, minValue / 10);
        }
        
        // For performance view, calculate percentage growth from initial value
        if (chartView === "performance") {
          const initialForCalc = Math.max(initialValue, 0.01); // Avoid division by zero
          data[`${investment.name}_perf`] = ((data[investment.name] / initialForCalc) - 1) * 100;
        }
      });
      
      return data;
    });
  };

  const chartData = generateHistoricalData();
  
  // Define different line styles for investments
  const getLineStyle = (index: number) => {
    const styles = [
      { stroke: "#3B82F6", strokeWidth: 3, strokeDasharray: "" }, // Solid blue
      { stroke: "#EF4444", strokeWidth: 3, strokeDasharray: "5 5" }, // Dashed red
      { stroke: "#10B981", strokeWidth: 3, strokeDasharray: "10 5" }, // Long dash green
      { stroke: "#8B5CF6", strokeWidth: 3, strokeDasharray: "5 2 2 2" }, // Dash-dot purple
      { stroke: "#F59E0B", strokeWidth: 3, strokeDasharray: "2 2" }, // Dotted yellow
      { stroke: "#EC4899", strokeWidth: 3, strokeDasharray: "10 5 5 5" }, // Long dash-dot pink
    ];
    
    return styles[index % styles.length];
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const isPerformance = entry.dataKey.includes("_perf");
              const name = isPerformance ? entry.name.replace("_perf", "") : entry.name;
              const value = entry.value;
              
              // Find the corresponding investment to show profit strategy
              const investment = investments.find(inv => inv.name === name);
              let profitInfo = "";
              
              if (investment?.profit_strategy === "automatic") {
                const frequency = investment.profit_frequency || "";
                const type = investment.profit_type || "";
                const value = investment.profit_value || "";
                
                if (type === "fixed") {
                  profitInfo = `(+${smartFormatCurrency(parseFloat(value))} ${frequency})`;
                } else if (type === "percentage") {
                  profitInfo = `(+${value}% ${frequency})`;
                }
              }
              
              return (
                <div key={`tooltip-${index}`} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium">{name}</span>
                  <span className="text-xs text-gray-500">{profitInfo}</span>
                  <span className="text-xs font-bold ml-auto">
                    {isPerformance 
                      ? `${value.toFixed(2)}%` 
                      : smartFormatCurrency(value)
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (investments.length === 0) {
    return (
      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investment Portfolio</CardTitle>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary">{formatCurrency(0)}</p>
              <p className="text-sm text-muted-foreground">No investments yet</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Add investments to see portfolio growth</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_15px_60px_rgba(0,0,0,0.35)] transition-shadow duration-300 bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Investment Portfolio</CardTitle>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <ToggleGroup type="single" value={chartView} onValueChange={(value) => value && setChartView(value as ChartView)}>
              <ToggleGroupItem value="lines" aria-label="Show actual values" title="Show actual values">
                <LineChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="performance" aria-label="Show percentage performance" title="Show percentage performance">
                <BarChart2 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary">
                {smartFormatCurrency(totalValue)}
              </p>
              <div className="flex items-center text-sm text-secondary justify-end">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Portfolio growth</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                {/* Pattern definitions for lines */}
                <pattern id="pattern-portfolio" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#3B82F6" strokeWidth="4" />
                </pattern>
                <pattern id="pattern-dots" patternUnits="userSpaceOnUse" width="6" height="6">
                  <circle cx="3" cy="3" r="1" fill="#EF4444" />
                </pattern>
                <pattern id="pattern-grid" patternUnits="userSpaceOnUse" width="6" height="6">
                  <path d="M 0 0 L 6 0 L 6 6 L 0 6 Z" fill="none" stroke="#10B981" strokeWidth="0.5" />
                </pattern>
                <pattern id="pattern-diagonal" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#8B5CF6" strokeWidth="2" />
                </pattern>
                <pattern id="pattern-zigzag" patternUnits="userSpaceOnUse" width="6" height="6">
                  <path d="M 0 3 L 3 0 L 6 3 L 3 6 Z" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
                </pattern>

                {/* Enhanced filter for stronger drop shadow */}
                <filter id="shadow-1" height="140%" width="140%" x="-20%" y="-20%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                  <feOffset dx="0" dy="4" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4"/>
                  </feComponentTransfer>
                  <feMerge> 
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (chartView === "performance") {
                    return `${value.toFixed(0)}%`;
                  }
                  if (Math.abs(value) >= 1000000) {
                    return smartFormatCurrency(value).replace(/^\$\s/, '');
                  }
                  return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
                }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                domain={[
                  (dataMin: number) => Math.max(0, dataMin * 0.9),
                  (dataMax: number) => dataMax * 1.1
                ]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => {
                // Clean up legend labels by removing _perf suffix
                return value.replace("_perf", "");
              }} />
              
              {/* Map each investment to a line with unique styling */}
              {investments.map((investment, index) => {
                const style = getLineStyle(index);
                
                // Determine if this is a special type of investment
                const isPortfolio = investment.name.toLowerCase().includes("portfolio");
                const isStock = investment.name.toLowerCase().includes("stock");
                const isBond = investment.name.toLowerCase().includes("bond");
                const isRealEstate = investment.name.toLowerCase().includes("real estate");
                const isCrypto = investment.name.toLowerCase().includes("crypto");
                
                // Set stroke pattern based on investment type
                const strokeDasharray = isPortfolio ? "" :
                  isStock ? "5 5" :
                  isBond ? "10 5" :
                  isRealEstate ? "5 2 2 2" :
                  isCrypto ? "2 2" :
                  style.strokeDasharray;
                
                return (
                  <Line
                    key={investment.id}
                    type="monotone"
                    dataKey={chartView === "performance" ? `${investment.name}_perf` : investment.name}
                    name={chartView === "performance" ? `${investment.name}_perf` : investment.name}
                    stroke={style.stroke}
                    strokeWidth={isPortfolio ? 4 : 3}
                    strokeDasharray={strokeDasharray}
                    dot={{ 
                      r: 4, 
                      strokeWidth: 2, 
                      fill: "#fff",
                      stroke: style.stroke
                    }}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0,
                      fill: style.stroke
                    }}
                    // Apply enhanced filter for shadow effect
                    filter="url(#shadow-1)"
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 