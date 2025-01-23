import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { labTestService } from "../services/api.service"; // Import the lab test service
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook
import moment from "moment"; // Import moment.js for date/time formatting

const UpcomingLabTestsScreen = ({ navigation }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth(); // Get the authenticated user

  // Fetch lab test history when the component mounts
  useEffect(() => {
    fetchLabTestHistory();
  }, []);

  const fetchLabTestHistory = async () => {
    try {
      setLoading(true);
      const response = await labTestService.getLabTestHistory(skip, limit);
      console.log("Fetched bookings:", response); // Log the fetched data
      if (response.length > 0) {
        setBookings((prev) => [...prev, ...response]);
        setSkip((prev) => prev + limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log("Error fetching lab test history:", error);
      Alert.alert(
        "Error",
        "Failed to fetch lab test history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return {
          color: "#1a237e",
          bgColor: "#E8EAF6",
          icon: "time-outline",
        };
      case "completed":
        return {
          color: "#2E7D32",
          bgColor: "#E8F5E9",
          icon: "checkmark-circle-outline",
        };
      case "cancelled":
        return {
          color: "#C62828",
          bgColor: "#FFEBEE",
          icon: "close-circle-outline",
        };
      default:
        return {
          color: "#666",
          bgColor: "#F5F5F5",
          icon: "help-circle-outline",
        };
    }
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      if (!selectedBooking) return;

      // Call the backend API to cancel the lab test
      await labTestService.cancelLabTest(selectedBooking.lab_test_id);

      // Update the local state to reflect the cancellation
      setBookings(
        bookings.map((booking) =>
          booking.lab_test_id === selectedBooking.lab_test_id
            ? { ...booking, status: "Cancelled" }
            : booking
        )
      );

      setShowCancelModal(false);
      Alert.alert("Booking Cancelled", "Your booking has been cancelled.");
    } catch (error) {
      console.log("Error cancelling lab test:", error);
      Alert.alert("Error", "Failed to cancel booking. Please try again.");
    }
  };

  const renderBookingCard = (booking) => {
    const statusConfig = getStatusConfig(booking.status);

    // Ensure the key is unique using lab_test_id and test_date
    const uniqueKey = `${booking.lab_test_id}-${booking.test_date}`;

    // Format the test_time using moment.js
    const formattedTime = moment(booking.test_time, "hh:mm A").format(
      "hh:mm A"
    );

    return (
      <View key={uniqueKey} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.testName}>{booking.test_type}</Text>
            <Text style={styles.testShortName}>{booking.test_type}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Ionicons
              name={statusConfig.icon}
              size={16}
              color={statusConfig.color}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={20} color="#1a237e" />
            </View>
            <Text style={styles.infoText}>{booking.hospital_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#1a237e" />
            </View>
            <Text style={styles.infoText}>
              {new Date(booking.test_date).toDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={20} color="#1a237e" />
            </View>
            <Text style={styles.infoText}>{formattedTime}</Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          {booking.status.toLowerCase() === "scheduled" && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(booking)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasMore) {
      fetchLabTestHistory();
    }
  };

  if (loading && skip === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading lab test history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      <LinearGradient
        colors={["#1a237e", "#3949ab", "#3f51b5"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Lab Tests</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          if (
            nativeEvent.layoutMeasurement.height +
              nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 20
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {bookings.length > 0 ? (
          bookings.map(renderBookingCard)
        ) : (
          <Text style={styles.noBookingsText}>No lab tests found.</Text>
        )}
        {loading && skip > 0 && (
          <ActivityIndicator size="small" color="#1a237e" />
        )}
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal visible={showCancelModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#C62828" />
            </View>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this booking?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>No, Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmCancellation}
              >
                <Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  testName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 4,
  },
  testShortName: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8EAF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: "#424242",
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#424242",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalButtonCancel: {
    backgroundColor: "#E8EAF6",
  },
  modalButtonConfirm: {
    backgroundColor: "#C62828",
  },
  modalButtonCancelText: {
    color: "#1a237e",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#1a237e",
  },
  noBookingsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});

export default UpcomingLabTestsScreen;
