import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps } from "recharts";
import type { Transaction } from "@shared/schema";
import { useState } from "react";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency, getCurrencySymbol, smartFormatCurrency } from "@/lib/currencyUtils";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    // Calculate total for the month
    const income = payload.find(p => p.dataKey === 'income')?.value as number || 0;
    const expenses = payload.find(p => p.dataKey === 'expenses')?.value as number || 0;
    const total = income + expenses;

    // Calculate percentages
    const incomePercentage = total > 0 ? (income / total * 100).toFixed(1) : '0.0';
    const expensesPercentage = total > 0 ? (expenses / total * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-white text-gray-800 p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-gray-200">
        <p className="font-bold mb-2 text-center">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#10B981] mr-2"></div>
              <span>Income:</span>
            </div>
            <span className="text-[#10B981] font-bold">{incomePercentage}%</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#EF4444] mr-2"></div>
              <span>Expenses:</span>
            </div>
            <span className="text-[#EF4444] font-bold">{expensesPercentage}%</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol();

  // Group transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        income: 0,
        expenses: 0,
      };
    }
    
    const amount = parseFloat(transaction.amount);
    if (transaction.type === "income") {
      acc[monthKey].income += amount;
    } else {
      acc[monthKey].expenses += amount;
    }
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number }>);

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.55)] transition-shadow duration-300 bg-[#0f172a] text-white">
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No transaction data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.55)] transition-shadow duration-300 bg-[#0f172a] text-white">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const dataKey = data.activePayload[0].dataKey as string;
                setActiveBar(activeBar === dataKey ? null : dataKey);
              }
            }}
          >
            <defs>
              <filter id="inner-shadow-bar" x="-50%" y="-50%" width="200%" height="200%">
                <feOffset dx="10" dy="5" />
                <feGaussianBlur stdDeviation="3" result="offset-blur" />
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                <feFlood floodColor="black" floodOpacity="1" result="color" />
                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
              </filter>
              <filter id="outer-shadow-bar" x="-50%" y="-50%" width="200%" height="200%">
                <feOffset dx="0" dy="-4" />
                <feGaussianBlur stdDeviation="4" result="offset-blur" />
                <feFlood floodColor="rgba(255,255,255,0.3)" result="color" />
                <feComposite operator="in" in="color" in2="offset-blur" result="shadow" />
                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
              </filter>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis 
              dataKey="month" 
              stroke="#aaaaaa" 
              tick={{ fill: '#aaaaaa' }}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000000) {
                  return smartFormatCurrency(value).replace(/^\$\s/, '');
                }
                return `${currencySymbol}${value.toLocaleString()}`;
              }}
              stroke="#aaaaaa"
              tick={{ fill: '#aaaaaa' }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ opacity: 0.15 }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Legend
              onClick={(entry) => {
                if (entry && entry.dataKey) {
                  setActiveBar(activeBar === entry.dataKey ? null : entry.dataKey as string);
                }
              }}
            />
            <Bar 
              dataKey="income" 
              name="Income" 
              fill="url(#incomeGradient)" 
              filter={activeBar === "income" ? "url(#outer-shadow-bar)" : "url(#inner-shadow-bar)"}
              radius={[4, 4, 0, 0]}
              animationDuration={300}
              isAnimationActive={true}
            />
            <Bar 
              dataKey="expenses" 
              name="Expenses" 
              fill="url(#expensesGradient)" 
              filter={activeBar === "expenses" ? "url(#outer-shadow-bar)" : "url(#inner-shadow-bar)"}
              radius={[4, 4, 0, 0]}
              animationDuration={300}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
