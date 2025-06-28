import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transactionsToCSV, investmentsToCSV, downloadCSV } from "@/lib/csvExport";
import { Download, FileText, TrendingUp, Check } from "lucide-react";
import type { Transaction, Category, Investment } from "@shared/schema";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

interface ExportReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
}

export default function ExportReportModal({
  open,
  onOpenChange,
  transactions,
  categories,
  investments
}: ExportReportModalProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  
  // Data type to export
  const [exportType, setExportType] = useState<"transactions" | "investments">("transactions");
  
  // Loading state for export button
  const [isExporting, setIsExporting] = useState(false);
  
  // Handle export action
  const handleExport = () => {
    setIsExporting(true);
    
    try {
      let csvContent: string;
      let filename: string;
      
      if (exportType === "transactions") {
        csvContent = transactionsToCSV(transactions, categories, dateRange);
        filename = "transactions";
      } else {
        csvContent = investmentsToCSV(investments, dateRange);
        filename = "investments";
      }
      
      // Download the CSV file
      downloadCSV(csvContent, filename);
      
      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error("Error exporting data:", error);
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Financial Data</DialogTitle>
          <DialogDescription>
            Choose data type and date range to export your financial data as CSV.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">What would you like to export?</label>
            <Tabs 
              defaultValue="transactions" 
              value={exportType} 
              onValueChange={(value) => setExportType(value as "transactions" | "investments")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">
                  <FileText className="w-4 h-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="investments">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Investments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date Range</label>
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
          
          {/* Export Transactions Preview */}
          {exportType === "transactions" && (
            <div className="mt-4 border border-border rounded-md p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2">What will be exported:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  Date, Type (Income/Expense)
                </li>
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  Category, Description
                </li>
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  Amount
                </li>
              </ul>
            </div>
          )}
          
          {/* Export Investments Preview */}
          {exportType === "investments" && (
            <div className="mt-4 border border-border rounded-md p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2">What will be exported:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  Investment Name, Type
                </li>
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  Initial Amount, Current Value
                </li>
                <li className="flex items-center">
                  <Check className="w-3 h-3 mr-2 text-primary" />
                  ROI %, Date Added
                </li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="animate-pulse">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 