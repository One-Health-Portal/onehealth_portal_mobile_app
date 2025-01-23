import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { labTestService } from "../services/api.service"; // Removed paymentService
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LabTestPaymentScreen = ({ route, navigation }) => {
  const { test, lab, date, time } = route.params;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [userId, setUserId] = useState(null);

  const { user, profile, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert("Error", "User session not found. Please login again.");
          navigation.navigate("Login");
        }
      } catch (error) {
        console.log("Error fetching user_id from AsyncStorage:", error);
        Alert.alert("Error", "Failed to fetch user information.");
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert("Error", "User session not found. Please login again.");
      navigation.navigate("Login");
    }
  }, [isAuthenticated]);

  const testFee = test.price || 2500;
  const serviceFee = 550;
  const totalAmount = testFee + serviceFee;

  const prepareBookingData = () => {
    const formattedDate =
      date instanceof Date
        ? date.toISOString().split("T")[0]
        : new Date(date).toISOString().split("T")[0];

    if (!userId) {
      throw new Error("User ID not found. Please log in again.");
    }

    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      throw new Error("Invalid user ID");
    }

    return {
      user_id: parsedUserId,
      hospital_id: parseInt(lab.hospitalId, 10),
      test_type: test.name,
      test_date: formattedDate,
      test_time: time,
      instruction: test.instructions || "",
    };
  };

  const handleBooking = async () => {
    try {
      setLoading(true);

      const bookingData = prepareBookingData();
      const labTestResponse = await labTestService.createLabTest(bookingData);

      if (!labTestResponse) {
        throw new Error("No response received from lab test booking");
      }

      setBookingDetails({
        ...labTestResponse,
        test: test,
        lab: lab,
        date: date,
        time: time,
      });

      setShowConfirmation(true);
    } catch (error) {
      console.log("Booking error:", error);
      Alert.alert(
        "Booking Failed",
        error.message || "Unable to complete your booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewBookings = () => {
    setShowConfirmation(false);
    navigation.navigate("LabTestHistory");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>
          Processing your lab test booking...
        </Text>
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
          <Text style={styles.headerTitle}>Lab Test Payment</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.testInfoSection}>
          <Text style={styles.testName}>{test.name}</Text>
          <Text style={styles.testType}>{test.shortName}</Text>

          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color="#666" />
            <Text style={styles.detailText}>{lab.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.detailText}>
              {new Date(date).toDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.detailText}>{time}</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Test Fee</Text>
            <Text style={styles.paymentAmount}>Rs. {testFee.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Service Fee</Text>
            <Text style={styles.paymentAmount}>
              Rs. {serviceFee.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.paymentItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Rs. {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodCard}>
            <Ionicons name="cash" size={24} color="#3f51b5" />
            <Text style={styles.methodText}>Pay at Lab</Text>
          </View>
        </View>

        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>Important Notice</Text>
          <Text style={styles.noticeText}>
            • Please arrive 15 minutes before your appointment{"\n"}• Bring
            valid ID and any previous test reports{"\n"}• Payment to be made at
            the lab counter{"\n"}• Follow any specific test preparation
            instructions{"\n"}• Cancellation should be made 24 hours prior
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Amount</Text>
          <Text style={styles.priceAmount}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookingButton, loading && styles.disabledButton]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.bookingButtonText}>Confirm Booking</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirmation} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={40} color="#3f51b5" />
            </View>
            <Text style={styles.modalTitle}>Booking Confirmed!</Text>
            {bookingDetails && (
              <Text style={styles.bookingNumber}>
                Booking #{bookingDetails.booking_number}
              </Text>
            )}
            <Text style={styles.modalMessage}>
              Your lab test has been successfully booked. Please make the
              payment at the lab counter before your test.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleViewBookings}
            >
              <Text style={styles.modalButtonText}>View My Lab Tests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  testInfoSection: {
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
  testName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  testType: {
    fontSize: 14,
    color: "#3f51b5",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  paymentSection: {
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
    color: "#1a237e",
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666",
  },
  paymentAmount: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3f51b5",
  },
  methodSection: {
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  methodText: {
    fontSize: 14,
    color: "#3f51b5",
    fontWeight: "500",
  },
  noticeSection: {
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
  noticeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3f51b5",
  },
  bookingButton: {
    backgroundColor: "#3f51b5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#c5cae9",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
    textAlign: "center",
  },
  bookingNumber: {
    fontSize: 16,
    color: "#3f51b5",
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#3f51b5",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default LabTestPaymentScreen;
