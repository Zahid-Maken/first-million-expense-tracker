import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from "recharts";
import type { Transaction, Category } from "@shared/schema";
import { useState, useEffect } from "react";
import { formatCurrency, getCurrencySymbol, smartFormatCurrency } from "@/lib/currencyUtils";

interface ExpensePieChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function ExpensePieChart({ transactions, categories }: ExpensePieChartProps) {
  // Set activeIndex to 0 by default to always have an active slice
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  
  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const expenseTransactions = transactions.filter(t => t.type === "expense");

  const expenseData = categories
    .filter(c => c.type === "expense")
    .map(category => {
      const categoryTransactions = expenseTransactions.filter(t => t.categoryId === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: category.name,
        value: total,
        color: category.color,
        icon: category.icon,
      };
    })
    .filter(item => item.value > 0);

  // Ensure activeIndex is valid based on available data
  useEffect(() => {
    if (expenseData.length > 0 && activeIndex >= expenseData.length) {
      setActiveIndex(0);
    } else if (expenseData.length === 0) {
      setActiveIndex(-1);
    }
  }, [expenseData, activeIndex]);

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const currencySymbol = getCurrencySymbol();

  if (expenseData.length === 0) {
    return (
      <Card className="rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.55)] transition-shadow duration-300 bg-[#0f172a] text-white">
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No expense data available</p>
        </CardContent>
      </Card>
    );
  }

  // Render connecting lines and labels for each pie slice
  const renderCustomizedLabel = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, fill, index, payload, percent, value } = props;
    
    // Calculate the position of the label based on the angle of the pie slice
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    // Dynamic distances based on screen size and quadrant
    const labelDistance = windowSize.width < 480 ? 20 : windowSize.width < 640 ? 30 : 40;
    
    // Adjust box distance based on quadrant to prevent overlap
    let boxDistance = windowSize.width < 480 ? 40 : windowSize.width < 640 ? 50 : 70;
    
    // Increase spacing for more items to prevent overlap - adaptive to total number of items
    const itemSpacingFactor = 5 + Math.min(5, expenseData.length);
    
    // Top right quadrant
    if (midAngle >= 270 || midAngle <= 0) {
      boxDistance += itemSpacingFactor;
    }
    // Bottom right quadrant
    else if (midAngle > 0 && midAngle <= 90) {
      boxDistance += itemSpacingFactor + 5;
    }
    // Bottom left quadrant
    else if (midAngle > 90 && midAngle <= 180) {
      boxDistance += itemSpacingFactor + 5;
    }
    // Top left quadrant
    else {
      boxDistance += itemSpacingFactor;
    }
    
    // Starting point of the line (near the pie)
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    
    // Calculate bend points based on position in the circle
    // Create a curved line with different bend points based on position
    let mx1, my1, mx2, my2;
    
    // Different curve styles based on quadrant
    if (midAngle >= 270 || midAngle < 90) { // Right half
      mx1 = cx + (outerRadius + labelDistance * 0.6) * cos - 10 * sin;
      my1 = cy + (outerRadius + labelDistance * 0.6) * sin + 10 * cos;
      mx2 = cx + (outerRadius + labelDistance * 0.8) * cos;
      my2 = cy + (outerRadius + labelDistance * 0.8) * sin;
    } else { // Left half
      mx1 = cx + (outerRadius + labelDistance * 0.6) * cos + 10 * sin;
      my1 = cy + (outerRadius + labelDistance * 0.6) * sin - 10 * cos;
      mx2 = cx + (outerRadius + labelDistance * 0.8) * cos;
      my2 = cy + (outerRadius + labelDistance * 0.8) * sin;
    }
    
    // Set vertical offsets based on position in circle to avoid overlaps
    // Divide the circle into sections and apply different offsets
    let verticalOffset = 0;
    
    if (expenseData.length > 2) {
      // Define vertical position based on angle position - fan out pattern
      const normalizedAngle = ((midAngle % 360) + 360) % 360;
      const sectionSize = 360 / Math.max(8, expenseData.length * 2);
      
      // Calculate section and offset based on position
      const section = Math.floor(normalizedAngle / sectionSize) % 4;
      
      switch(section) {
        case 0: verticalOffset = -20; break;
        case 1: verticalOffset = -10; break;
        case 2: verticalOffset = 10; break;
        case 3: verticalOffset = 20; break;
      }
      
      // Add small random variation to avoid exact overlaps
      verticalOffset += (index % 3) * 5 - 5;
    }
    
    // End point where the text will be placed
    const ex = cx + (outerRadius + boxDistance) * cos;
    const ey = cy + (outerRadius + boxDistance) * sin + verticalOffset;
    
    // Determine text anchor based on position
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    // Only hide labels if screen is extremely small
    const showLabel = windowSize.width >= 320;
    
    // Calculate percentage text
    const percentText = `${(percent * 100).toFixed(0)}%`;
    
    // Create SVG path for connecting line with bend - use curved path for smoothness
    const path = `M${sx},${sy} Q${mx1},${my1} ${mx2},${my2} T${ex},${ey}`;
    
    // Only skip labels on extremely small screens
    if (!showLabel) return null;
    
    // Choose background width based on text content
    const bgWidth = windowSize.width < 480 ? 45 : 55;
    
    // Enhanced label rendering with background for better readability
    return (
      <g>
        {/* Curved connecting line */}
        <path d={path} stroke={fill} fill="none" strokeWidth={1.5} />
        
        {/* Circle at the end of the line */}
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        
        {/* Semi-transparent background for label area */}
        <rect 
          x={ex + (cos >= 0 ? 5 : -bgWidth)}
          y={ey - 22}
          width={bgWidth} 
          height={30}
          rx={3}
          fill="rgba(0,0,0,0.3)"
          opacity={0.7}
        />
        
        {/* Percentage text */}
        <text 
          x={ex + (cos >= 0 ? 10 : -10)} 
          y={ey - 10} 
          textAnchor={textAnchor} 
          fill={fill} 
          fontSize={windowSize.width < 640 ? 12 : 14}
          fontWeight="bold"
        >
          {percentText}
        </text>
        
        {/* Category name - with adaptive shortening based on screen size */}
        <text 
          x={ex + (cos >= 0 ? 10 : -10)} 
          y={ey + 5} 
          textAnchor={textAnchor} 
          fill="#FFF" 
          fontSize={windowSize.width < 480 ? 9 : windowSize.width < 640 ? 10 : 12}
        >
          {payload.name.length > (windowSize.width < 480 ? 5 : 8) && windowSize.width < 640
            ? `${payload.name.substring(0, windowSize.width < 480 ? 3 : 5)}...` 
            : payload.name}
        </text>
      </g>
    );
  };

  // Active shape to render when a pie slice is selected
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={2}
          filter="url(#outer-shadow)"
        />
      </g>
    );
  };

  // Calculate appropriate height based on screen size
  const chartHeight = windowSize.width < 480 ? 300 : 400;

  return (
    <Card className="rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.55)] transition-shadow duration-300 bg-[#0f172a] text-white">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="relative min-h-[300px]">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-2xl md:text-3xl font-bold">
            {smartFormatCurrency(totalExpenses)}
          </div>
          <div className="text-sm text-gray-400">Total Expenses</div>
        </div>

        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <defs>
              {/* Shadow filter for active pie slice */}
              <filter id="outer-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFF" floodOpacity="0.5" />
              </filter>
              
              {/* Shadow filter for pie */}
              <filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="15" dy="0" stdDeviation="10" floodColor="#000" floodOpacity="0.6" />
              </filter>
            </defs>
            
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={expenseData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              cornerRadius={6}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onClick={(_, index) => setActiveIndex(index)}
              label={renderCustomizedLabel}
              labelLine={false}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              filter="url(#inner-shadow)"
            >
              {expenseData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                  stroke="rgba(0,0,0,0.1)" 
                  strokeWidth={1}
                />
              ))}
            </Pie>
            
            <Tooltip 
              formatter={(value) => [smartFormatCurrency(value as number), "Amount"]}
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
