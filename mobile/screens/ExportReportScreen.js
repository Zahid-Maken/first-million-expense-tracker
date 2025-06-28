import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Download, ArrowLeft, FileText, TrendingUp, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateRangePicker from '../components/DateRangePicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const ExportReportScreen = ({ navigation }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [exportType, setExportType] = useState('transactions');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
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
      
      // Load investments
      const investmentsJson = await AsyncStorage.getItem('investments');
      if (investmentsJson) {
        setInvestments(JSON.parse(investmentsJson));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load your financial data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = async () => {
    if (!dateRange.from) {
      Alert.alert('Date Required', 'Please select at least a start date');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create CSV content based on export type
      let csvContent;
      let filename;
      
      if (exportType === 'transactions') {
        csvContent = createTransactionsCSV();
        filename = 'transactions';
      } else {
        csvContent = createInvestmentsCSV();
        filename = 'investments';
      }
      
      // Get a suitable directory for saving files
      const fileUri = `${FileSystem.documentDirectory}${filename}_${format(new Date(), 'yyyyMMdd')}.csv`;
      
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
  
  const createTransactionsCSV = () => {
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
  
  const createInvestmentsCSV = () => {
    // CSV header
    const header = ["Name", "Type", "Initial Amount", "Current Value", "ROI %", "Date Added"];
    
    // Create CSV rows
    const rows = investments.map(investment => {
      const initialAmount = parseFloat(investment.initial_amount);
      const currentValue = parseFloat(investment.current_value);
      const roi = ((currentValue - initialAmount) / initialAmount) * 100;
      const formattedDate = format(new Date(investment.date_added), 'yyyy-MM-dd');
      
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
    return [
      header.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft width={24} height={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Report</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>What would you like to export?</Text>
          
          <View style={styles.exportTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.exportTypeButton, 
                exportType === 'transactions' && styles.exportTypeButtonActive
              ]}
              onPress={() => setExportType('transactions')}
            >
              <FileText 
                width={20} 
                height={20} 
                color={exportType === 'transactions' ? "#ffffff" : "#6b7280"} 
                style={styles.buttonIcon} 
              />
              <Text 
                style={[
                  styles.exportTypeText,
                  exportType === 'transactions' && styles.exportTypeTextActive
                ]}
              >
                Transactions
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.exportTypeButton, 
                exportType === 'investments' && styles.exportTypeButtonActive
              ]}
              onPress={() => setExportType('investments')}
            >
              <TrendingUp 
                width={20} 
                height={20} 
                color={exportType === 'investments' ? "#ffffff" : "#6b7280"} 
                style={styles.buttonIcon} 
              />
              <Text 
                style={[
                  styles.exportTypeText,
                  exportType === 'investments' && styles.exportTypeTextActive
                ]}
              >
                Investments
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>Select Date Range</Text>
          <View style={styles.datePickerContainer}>
            <DateRangePicker onDateRangeSelected={setDateRange} />
          </View>
          
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>What will be exported:</Text>
            
            {exportType === 'transactions' ? (
              <View style={styles.previewContent}>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>Date, Type (Income/Expense)</Text>
                </View>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>Category, Description</Text>
                </View>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>Amount</Text>
                </View>
              </View>
            ) : (
              <View style={styles.previewContent}>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>Investment Name, Type</Text>
                </View>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>Initial Amount, Current Value</Text>
                </View>
                <View style={styles.previewItem}>
                  <Check width={16} height={16} color="#3b82f6" style={styles.checkIcon} />
                  <Text style={styles.previewText}>ROI %, Date Added</Text>
                </View>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.exportButton,
              (isExporting || !dateRange.from) && styles.disabledButton
            ]}
            onPress={handleExport}
            disabled={isExporting || !dateRange.from}
          >
            {isExporting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.exportButtonText}>Exporting...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Download width={20} height={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  exportTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exportTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  exportTypeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonIcon: {
    marginRight: 8,
  },
  exportTypeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  exportTypeTextActive: {
    color: '#ffffff',
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  previewContent: {
    marginLeft: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
  },
  exportButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExportReportScreen; 