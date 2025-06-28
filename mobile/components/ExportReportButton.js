import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import DateRangePicker from './DateRangePicker';

const ExportReportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load transactions
      const transactionsJson = await AsyncStorage.getItem('transactions');
      if (transactionsJson) {
        setTransactions(JSON.parse(transactionsJson));
      }

      // Load categories
      const categoriesJson = await AsyncStorage.getItem('categories');
      if (categoriesJson) {
        setCategories(JSON.parse(categoriesJson));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExport = async (dateRange) => {
    if (!dateRange.from) {
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create CSV content
      const csvContent = createTransactionsCSV(dateRange);
      
      // Get a suitable directory for saving files
      const fileUri = `${FileSystem.documentDirectory}transactions_${format(new Date(), 'yyyyMMdd')}.csv`;
      
      // Write the CSV file
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(
          'Sharing not available', 
          'Sharing is not available on this device'
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const createTransactionsCSV = (dateRange) => {
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      if (dateRange.from && transactionDate < dateRange.from) {
        return false;
      }
      
      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        if (transactionDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
    
    // CSV header
    const header = ["Date", "Type", "Category", "Description", "Amount"];
    
    // Create CSV rows
    const rows = filteredTransactions.map(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const formattedDate = format(new Date(transaction.date), 'yyyy-MM-dd');
      
      return [
        formattedDate,
        transaction.type,
        category?.name || "Uncategorized",
        transaction.description || "",
        transaction.amount
      ];
    });
    
    // Combine header and rows
    return [
      header.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
  };

  return (
    <View style={styles.container}>
      <DateRangePicker onDateRangeSelected={handleExport} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  }
});

export default ExportReportButton; 