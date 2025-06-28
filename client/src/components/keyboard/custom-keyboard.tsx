import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Delete, 
  Check, 
  X,
  Calculator,
  DollarSign
} from "lucide-react";
import { smartFormatCurrency } from "@/lib/currencyUtils";

interface CustomKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  placeholder?: string;
  maxValue?: number;
  showCategories?: boolean;
  categories?: { id: number; name: string; icon?: string }[];
  selectedCategory?: number;
  onCategorySelect?: (categoryId: number) => void;
}

export default function CustomKeyboard({ 
  value, 
  onChange, 
  onConfirm, 
  onCancel,
  placeholder = "0.00",
  maxValue,
  showCategories = false,
  categories = [],
  selectedCategory,
  onCategorySelect
}: CustomKeyboardProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const handleNumberPress = (num: string) => {
    if (displayValue === "0" && num !== ".") {
      setDisplayValue(num);
      onChange(num);
    } else if (displayValue.includes(".") && num === ".") {
      return;
    } else if (displayValue.includes(".") && displayValue.split(".")[1].length >= 2) {
      return;
    } else {
      const newValue = displayValue + num;
      if (maxValue && parseFloat(newValue) > maxValue) {
        return;
      }
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    if (displayValue.length > 1) {
      const newValue = displayValue.slice(0, -1);
      setDisplayValue(newValue);
      onChange(newValue);
    } else {
      setDisplayValue("0");
      onChange("0");
    }
  };

  const handleClear = () => {
    setDisplayValue("0");
    onChange("0");
  };

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '.']
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
      <Card className="w-full bg-card border-t border-border rounded-t-3xl shadow-glow">
        {/* Amount Display */}
        <div className="p-6 border-b border-border bg-gradient-primary text-white rounded-t-3xl">
          <div className="text-center">
            <p className="text-white/80 text-sm font-medium">Enter Amount</p>
            <div className="flex items-center justify-center mt-2">
              <DollarSign className="w-8 h-8 text-white mr-1" />
              <span className="text-4xl font-bold">
                {displayValue === "0" ? placeholder : displayValue}
              </span>
            </div>
            {maxValue && (
              <p className="text-white/70 text-sm mt-2">
                Available: {maxValue >= 1000000 
                  ? smartFormatCurrency(maxValue).replace(/^\$\s/, '') 
                  : `$ ${maxValue.toLocaleString()}`}
              </p>
            )}
          </div>
        </div>

        {/* Categories Section */}
        {showCategories && categories.length > 0 && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground mb-3">Select Category</p>
            <div className="grid grid-cols-3 gap-2 max-h-24 overflow-y-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategorySelect?.(category.id)}
                  className={`p-3 h-auto text-xs ${
                    selectedCategory === category.id 
                      ? "bg-gradient-primary text-white" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="text-center">
                    {category.icon && (
                      <div className="text-lg mb-1">{category.icon}</div>
                    )}
                    <div className="truncate">{category.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className="p-4">
          <div className="grid gap-3">
            {keypadNumbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-3">
                {row.map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    className={`h-14 text-xl font-semibold transition-all duration-200 ${
                      key === 'C' 
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30' 
                        : 'hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                    }`}
                    onClick={() => {
                      if (key === 'C') {
                        handleClear();
                      } else {
                        handleNumberPress(key);
                      }
                    }}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
            
            {/* Backspace Row */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Button
                variant="outline"
                className="h-14 bg-muted/50 hover:bg-muted"
                onClick={handleBackspace}
              >
                <Delete className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                className="h-14 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30"
                onClick={onCancel}
              >
                <X className="w-6 h-6" />
              </Button>
              <Button
                className="h-14 bg-gradient-success text-white shadow-glow"
                onClick={onConfirm}
                disabled={!displayValue || displayValue === "0"}
              >
                <Check className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="p-4 pt-0">
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                className="h-10 text-sm hover:bg-primary/10 hover:border-primary/30"
                onClick={() => {
                  const newValue = amount.toString();
                  if (!maxValue || amount <= maxValue) {
                    setDisplayValue(newValue);
                    onChange(newValue);
                  }
                }}
                disabled={maxValue ? amount > maxValue : false}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}