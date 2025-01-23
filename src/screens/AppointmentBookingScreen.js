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
import { doctorService } from "../services/api.service"; // Import doctorService

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctor, hospital } = route.params;

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch available time slots when the component mounts or when the selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date) => {
    try {
      console.log("Original selected date:", date);
      setLoading(true);

      // Add one day to the selected date for the API request
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() + 1);

      // Format the adjusted date as YYYY-MM-DD for the API request
      const formattedDate = adjustedDate.toISOString().split("T")[0];

      console.log("Fetching time slots for adjusted date:", formattedDate);

      const response = await doctorService.getAvailableTimeSlots(
        doctor.doctor_id,
        hospital.hospital_id,
        formattedDate
      );

      console.log("API response:", response);

      if (response && response.available_slots && response.unavailable_slots) {
        // Combine available and unavailable slots
        const allSlots = [
          ...response.available_slots.map((slot) => ({
            ...slot,
            formattedTime: slot.time,
          })),
          ...response.unavailable_slots.map((slot) => ({
            ...slot,
            formattedTime: slot.time,
          })),
        ];

        // Sort slots by time
        allSlots.sort((a, b) => {
          const timeA = new Date(`2000/01/01 ${a.time}`);
          const timeB = new Date(`2000/01/01 ${b.time}`);
          return timeA - timeB;
        });

        setAvailableTimeSlots(allSlots);

        if (allSlots.length === 0) {
          Alert.alert(
            "No Availability",
            "No time slots available for this date.",
            [{ text: "OK" }]
          );
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.log("Error fetching time slots:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to load available time slots. Please try again."
      );
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking an appointment
  const handleBooking = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Incomplete Selection", "Please select both date and time");
      return;
    }

    // Format the date as ISO string for serialization
    const formattedDate = selectedDate.toISOString();

    // Navigate to payment screen with serializable data
    navigation.navigate("AppointmentPayment", {
      doctor: doctor,
      hospital: hospital,
      selectedDate: formattedDate, // Send as string instead of Date object
      selectedTime: selectedTime,
    });
  };

  // Generate available dates (starting from today)
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

    // Add dates for next month if needed (to always show at least 7 available dates)
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

  if (loading && !availableTimeSlots.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5998" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
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
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Info Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <View style={styles.specializationContainer}>
                <Ionicons name="medical" size={14} color="#27ae60" />
                <Text style={styles.specialization}>
                  {doctor.specialization}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.hospitalSection}>
            <View style={styles.hospitalInfo}>
              <Ionicons name="business" size={16} color="#666" />
              <Text style={styles.hospitalName}>{hospital.name}</Text>
            </View>
            {hospital.emergency_services_available && (
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyText}>24/7</Text>
              </View>
            )}
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
          </ScrollView>
        </View>

        {/* Time Slots */}
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
                      {slot.formattedTime}
                    </Text>
                    {!slot.available && slot.reason === "Booked" && (
                      <Text style={styles.bookedText}>Booked</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Appointment Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Duration: {doctor.appointment_duration || "30"} minutes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <TouchableOpacity
        style={[
          styles.bookingButton,
          (!selectedDate || !selectedTime || bookingInProgress) &&
            styles.bookingButtonDisabled,
        ]}
        onPress={handleBooking}
        disabled={!selectedDate || !selectedTime || bookingInProgress}
      >
        <Text style={styles.bookingButtonText}>
          {bookingInProgress ? "Booking..." : "Book Appointment"}
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
  doctorCard: {
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
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  specializationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  specialization: {
    fontSize: 14,
    color: "#27ae60",
    marginLeft: 4,
    fontWeight: "500",
  },
  hospitalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  hospitalInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  hospitalName: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  emergencyBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
  dateScrollView: {
    marginHorizontal: -8,
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
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  },
  bookingButton: {
    backgroundColor: "#3f51b5",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookingButtonDisabled: {
    backgroundColor: "#c5cae9",
  },
  bookingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default AppointmentBookingScreen;
