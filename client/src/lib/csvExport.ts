import { Transaction, Category, Investment } from "@shared/schema";
import { format } from "date-fns";

/**
 * Converts transaction data to CSV format
 */
export function transactionsToCSV(
  transactions: Transaction[], 
  categories: Category[],
  dateRange: { from: Date | undefined; to: Date | undefined }
): string {
  // Filter transactions by date range if provided
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    
    if (dateRange.from && transactionDate < dateRange.from) {
      return false;
    }
    
    if (dateRange.to) {
      // Include the whole day of the end date
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      if (transactionDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort transactions by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // CSV header
  const header = ["Date", "Type", "Category", "Description", "Amount"];
  
  // Create CSV rows
  const rows = filteredTransactions.map(transaction => {
    const category = categories.find(c => c.id === transaction.categoryId);
    const formattedDate = format(new Date(transaction.date), "yyyy-MM-dd");
    
    return [
      formattedDate,
      transaction.type,
      category?.name || "Uncategorized",
      transaction.description || "",
      transaction.amount
    ];
  });
  
  // Combine header and rows
  const csvContent = [
    header.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  return csvContent;
}

/**
 * Converts investment data to CSV format
 */
export function investmentsToCSV(
  investments: Investment[],
  dateRange: { from: Date | undefined; to: Date | undefined }
): string {
  // CSV header
  const header = ["Name", "Type", "Initial Amount", "Current Value", "ROI %", "Date Added"];
  
  // Create CSV rows
  const rows = investments.map(investment => {
    const initialAmount = parseFloat(investment.initial_amount);
    const currentValue = parseFloat(investment.current_value);
    const roi = ((currentValue - initialAmount) / initialAmount) * 100;
    const formattedDate = format(new Date(investment.date_added), "yyyy-MM-dd");
    
    return [
      investment.name,
      investment.type,
      investment.initial_amount,
      investment.current_value,
      roi.toFixed(2) + "%",
      formattedDate
    ];
  });
  
  // Combine header and rows
  const csvContent = [
    header.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  return csvContent;
}

/**
 * Creates and downloads a CSV file
 */
export function downloadCSV(
  csvContent: string, 
  filename: string = "transactions"
): void {
  // Create a CSV blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  // Set up download attributes
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMdd")}.csv`);
  link.style.display = "none";
  
  // Add to DOM, trigger download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 