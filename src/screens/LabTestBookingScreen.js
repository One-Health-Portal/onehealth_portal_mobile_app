import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { labTestService, hospitalService } from "../services/api.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LabTestBookingScreen = ({ route, navigation }) => {
  const { test } = route.params;
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const response = await hospitalService.getAllHospitals();
        setHospitals(response);
      } catch (error) {
        Alert.alert("Error", "Failed to load hospitals");
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  // Fetch available time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedLab && selectedDate) {
        try {
          setLoading(true);
          const timeSlots = await labTestService.getAvailableTimeSlots(
            selectedLab,
            selectedDate.toISOString().split("T")[0]
          );
          setAvailableTimeSlots(timeSlots.time_slots);
        } catch (error) {
          Alert.alert("Error", "Failed to load available time slots");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTimeSlots();
  }, [selectedLab, selectedDate]);

  // Generate dates for the next 7 days
  const getDates = () => {
    const dates = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDate = today.getDate();

    // Add dates from current date till end of month
    for (let i = currentDate; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        // Exclude weekends
        dates.push(date);
      }
    }

    // Add dates for next month if needed
    if (dates.length < 7) {
      const nextMonth = currentMonth + 1;
      let i = 1;
      while (dates.length < 7) {
        const date = new Date(currentYear, nextMonth, i);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date);
        }
        i++;
      }
    }

    return dates;
  };

  const handleBooking = async () => {
    if (!selectedLab || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Please select all booking details");
      return;
    }

    try {
      const selectedHospital = hospitals.find(
        (h) => h.hospital_id === selectedLab
      );

      if (!selectedHospital) {
        throw new Error("Selected hospital not found");
      }

      navigation.navigate("LabTestPaymentScreen", {
        test: {
          name: test.name,
          shortName: test.shortName,
          price: test.price || 2500,
          instructions: test.instructions || "",
        },
        lab: {
          name: selectedHospital.name,
          hospitalId: selectedLab,
        },
        date: selectedDate,
        time: selectedTime,
      });
    } catch (error) {
      console.log("Booking error:", error);
      Alert.alert("Error", "Failed to process booking. Please try again.");
    }
  };

  if (loading && !hospitals.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>Loading test details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />

      <LinearGradient
        colors={["#1a237e", "#3949ab", "#3f51b5"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lab Test Booking</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Info Card */}
        <View style={styles.testInfoCard}>
          <View style={styles.testHeader}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testType}>{test.shortName}</Text>
            </View>
          </View>
        </View>

        {/* Lab Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Laboratory</Text>
          <View style={styles.labOptions}>
            {hospitals.map((hospital) => (
              <TouchableOpacity
                key={hospital.hospital_id}
                style={[
                  styles.labCard,
                  selectedLab === hospital.hospital_id &&
                    styles.selectedLabCard,
                ]}
                onPress={() => setSelectedLab(hospital.hospital_id)}
              >
                <Ionicons
                  name="business"
                  size={24}
                  color={
                    selectedLab === hospital.hospital_id ? "#fff" : "#2c3e50"
                  }
                  style={styles.labIcon}
                />
                <Text
                  style={[
                    styles.labName,
                    selectedLab === hospital.hospital_id &&
                      styles.selectedLabName,
                  ]}
                >
                  {hospital.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
          >
            <View style={styles.dateList}>
              {getDates().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    selectedDate?.toDateString() === date.toDateString() &&
                      styles.selectedDateCard,
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dayName,
                      selectedDate?.toDateString() === date.toDateString() &&
                        styles.selectedDateText,
                    ]}
                  >
                    {date.toLocaleString("default", { weekday: "short" })}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      selectedDate?.toDateString() === date.toDateString() &&
                        styles.selectedDateText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <Text
                    style={[
                      styles.monthName,
                      selectedDate?.toDateString() === date.toDateString() &&
                        styles.selectedDateText,
                    ]}
                  >
                    {date.toLocaleString("default", { month: "short" })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#3f51b5" />
            ) : (
              <View style={styles.timeGrid}>
                {availableTimeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.timeSlot,
                      selectedTime === slot.time && styles.selectedTimeSlot,
                      !slot.available && styles.unavailableTimeSlot,
                    ]}
                    onPress={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available || bookingInProgress}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedTime === slot.time && styles.selectedTimeText,
                        !slot.available && styles.unavailableTimeText,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {!slot.available && (
                      <Text style={styles.bookedText}>Unavailable</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#666"
            />
            <Text style={styles.infoText}>
              Please arrive 15 minutes before your scheduled time
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <TouchableOpacity
        style={[
          styles.bookingButton,
          (!selectedLab ||
            !selectedDate ||
            !selectedTime ||
            bookingInProgress) &&
            styles.bookingButtonDisabled,
        ]}
        onPress={handleBooking}
        disabled={
          !selectedLab || !selectedDate || !selectedTime || bookingInProgress
        }
      >
        <Text style={styles.bookingButtonText}>
          {bookingInProgress ? "Booking..." : "Continue to Payment"}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    color: "#3f51b5",
    fontSize: 16,
  },
  testInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  testType: {
    fontSize: 14,
    color: "#27ae60",
    marginLeft: 4,
    fontWeight: "500",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  labOptions: {
    gap: 12,
  },
  labCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  selectedLabCard: {
    backgroundColor: "#3f51b5",
  },
  labIcon: {
    marginRight: 12,
  },
  labName: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  selectedLabName: {
    color: "#fff",
  },
  dateScrollView: {
    marginHorizontal: -8,
  },
  dateList: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDateCard: {
    backgroundColor: "#3f51b5",
  },
  dayName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2c3e50",
  },
  monthName: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  selectedDateText: {
    color: "#fff",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  selectedTimeSlot: {
    backgroundColor: "#3f51b5",
  },
  unavailableTimeSlot: {
    backgroundColor: "#f0f0f0",
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  selectedTimeText: {
    color: "#fff",
  },
  unavailableTimeText: {
    color: "#999",
  },
  bookedText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  bookingButton: {
    backgroundColor: "#3f51b5",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingButtonDisabled: {
    backgroundColor: "#c5cae9",
  },
  bookingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LabTestBookingScreen;
