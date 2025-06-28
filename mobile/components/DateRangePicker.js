import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, addMonths } from 'date-fns';
import { CalendarIcon, X, Check } from 'lucide-react-native';

const DateRangePicker = ({ onDateRangeSelected }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [markedDates, setMarkedDates] = useState({});
  
  // Format date to string (YYYY-MM-DD)
  const formatDateToString = (date) => {
    return date ? format(date, 'yyyy-MM-dd') : '';
  };
  
  // Show human-readable date range
  const getDisplayText = () => {
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`;
    } else if (selectedRange.from) {
      return format(selectedRange.from, 'MMM dd, yyyy');
    } else {
      return 'Select date range';
    }
  };
  
  // Handle date selection in calendar
  const handleDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    
    if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
      // If no start date selected or both dates are selected, reset and select start date
      const newRange = {
        from: selectedDate,
        to: undefined,
      };
      
      setSelectedRange(newRange);
      
      // Mark the selected date
      setMarkedDates({
        [day.dateString]: {
          selected: true,
          startingDay: true,
          color: '#10b981',
          textColor: 'white',
        },
      });
    } else {
      // If start date is selected, select end date
      // Ensure end date is after start date
      if (selectedDate < selectedRange.from) {
        const newRange = {
          from: selectedDate,
          to: selectedRange.from,
        };
        setSelectedRange(newRange);
        markPeriod(selectedDate, selectedRange.from);
      } else {
        const newRange = {
          from: selectedRange.from,
          to: selectedDate,
        };
        setSelectedRange(newRange);
        markPeriod(selectedRange.from, selectedDate);
      }
    }
  };
  
  // Mark a period of dates between start and end
  const markPeriod = (startDate, endDate) => {
    const markedDays = {};
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = formatDateToString(currentDate);
      
      if (formatDateToString(currentDate) === formatDateToString(startDate)) {
        // Start date
        markedDays[dateString] = {
          selected: true,
          startingDay: true,
          color: '#10b981',
          textColor: 'white',
        };
      } else if (formatDateToString(currentDate) === formatDateToString(endDate)) {
        // End date
        markedDays[dateString] = {
          selected: true,
          endingDay: true,
          color: '#10b981',
          textColor: 'white',
        };
      } else {
        // In-between dates
        markedDays[dateString] = {
          selected: true,
          color: '#10b981',
          textColor: 'white',
        };
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setMarkedDates(markedDays);
  };
  
  // Confirm selection and close modal
  const confirmSelection = () => {
    if (selectedRange.from) {
      onDateRangeSelected(selectedRange);
      setIsVisible(false);
    }
  };
  
  // Reset selection
  const resetSelection = () => {
    setSelectedRange({ from: undefined, to: undefined });
    setMarkedDates({});
  };

  // Format the selected date range for display (similar to screenshot)
  const getFormattedDateRange = () => {
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, 'MMM dd, yyyy').toUpperCase()} - ${format(selectedRange.to, 'MMM dd, yyyy').toUpperCase()}`;
    } else if (selectedRange.from) {
      return `${format(selectedRange.from, 'MMM dd, yyyy').toUpperCase()} - SELECT END DATE`;
    } else {
      return 'SELECT DATE RANGE';
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Date Range Button */}
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setIsVisible(true)}
      >
        <CalendarIcon width={20} height={20} color="#6b7280" style={styles.icon} />
        <Text style={styles.dateText}>{getDisplayText()}</Text>
      </TouchableOpacity>
      
      {/* Calendar Modal */}
      <Modal
        transparent={true}
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{format(new Date(), 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
                <X width={20} height={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType="period"
              style={styles.calendar}
              theme={{
                calendarBackground: '#111827',
                textSectionTitleColor: '#9ca3af',
                textSectionTitleDisabledColor: '#6b7280',
                selectedDayBackgroundColor: '#10b981',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#10b981',
                dayTextColor: '#ffffff',
                textDisabledColor: '#4b5563',
                dotColor: '#10b981',
                selectedDotColor: '#ffffff',
                arrowColor: '#10b981',
                monthTextColor: '#ffffff',
                indicatorColor: '#10b981',
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: 5,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    paddingHorizontal: 10,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#1f2937',
                  },
                  dayHeader: {
                    color: '#9ca3af',
                    fontSize: 13,
                    fontWeight: '500',
                  }
                },
                'stylesheet.day.period': {
                  base: {
                    overflow: 'hidden',
                    height: 34,
                    alignItems: 'center',
                    width: 38,
                  }
                }
              }}
            />
            
            {selectedRange.from && (
              <View style={styles.selectedDateContainer}>
                <CalendarIcon width={16} height={16} color="#f59e0b" style={styles.selectedDateIcon} />
                <Text style={styles.selectedDateText}>{getFormattedDateRange()}</Text>
              </View>
            )}
            
            <View style={styles.exportInfoContainer}>
              <Text style={styles.exportInfoTitle}>What will be exported:</Text>
              <View style={styles.exportInfoItem}>
                <Check width={14} height={14} color="#10b981" style={styles.checkIcon} />
                <Text style={styles.exportInfoText}>Date, Type (Income/Expense)</Text>
              </View>
              <View style={styles.exportInfoItem}>
                <Check width={14} height={14} color="#10b981" style={styles.checkIcon} />
                <Text style={styles.exportInfoText}>Category, Description</Text>
              </View>
              <View style={styles.exportInfoItem}>
                <Check width={14} height={14} color="#10b981" style={styles.checkIcon} />
                <Text style={styles.exportInfoText}>Amount</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, !selectedRange.from && styles.disabledButton]}
                onPress={confirmSelection}
                disabled={!selectedRange.from}
              >
                <Text style={styles.confirmButtonText}>EXPORT CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
  },
  selectedDateIcon: {
    marginRight: 8,
  },
  selectedDateText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  exportInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  exportInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  exportInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkIcon: {
    marginRight: 8,
  },
  exportInfoText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
});

export default DateRangePicker; 