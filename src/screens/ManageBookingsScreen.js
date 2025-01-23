import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appointmentService } from "../services/api.service";
import { useFocusEffect } from "@react-navigation/native";

const ManageBookingsScreen = ({ navigation }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointmentHistory();

      if (response.data) {
        // Sort appointments by date with upcoming first
        const sortedBookings = response.data.sort((a, b) => {
          const dateA = new Date(a.appointment_date);
          const dateB = new Date(b.appointment_date);
          return dateA - dateB;
        });

        // Filter out past appointments or show them differently
        const now = new Date();
        const categorizedBookings = sortedBookings.map((booking) => ({
          ...booking,
          isPast: new Date(booking.appointment_date) < now,
        }));

        setBookings(categorizedBookings);
      }
    } catch (error) {
      console.log("Error fetching bookings:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load your bookings. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (booking) => {
    // Check if appointment is in the past
    const appointmentDate = new Date(booking.appointment_date);
    const currentDate = new Date();

    if (appointmentDate < currentDate) {
      Alert.alert("Cannot Cancel", "Past appointments cannot be cancelled.");
      return;
    }

    if (booking.status.toLowerCase() !== "pending") {
      Alert.alert(
        "Cannot Cancel",
        "Only pending appointments can be cancelled."
      );
      return;
    }

    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      setCancelling(true);

      // Call the cancel endpoint
      await appointmentService.cancelAppointment(
        selectedBooking.appointment_id
      );

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.appointment_id === selectedBooking.appointment_id
            ? { ...booking, status: "Cancelled" }
            : booking
        )
      );

      setShowCancelModal(false);
      Alert.alert(
        "Booking Cancelled",
        "Your appointment has been cancelled successfully."
      );

      // Refresh the bookings list
      fetchBookings();
    } catch (error) {
      console.log("Cancel error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to cancel appointment. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (date, time) => {
    const appointmentDate = new Date(date);
    return {
      date: appointmentDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: time,
    };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#007AFF";
      case "completed":
        return "#34C759";
      case "cancelled":
        return "#FF3B30";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "time";
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  const renderBookingCard = (booking) => {
    const { date, time } = formatDateTime(
      booking.appointment_date,
      booking.appointment_time
    );
    const isPending = booking.status?.toLowerCase() === "pending";
    const showCancelButton = isPending && !booking.isPast;

    return (
      <View key={booking.appointment_id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.doctorName}>{booking.doctor_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) + "15" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(booking.status)}
              size={16}
              color={getStatusColor(booking.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(booking.status) },
              ]}
            >
              {booking.status}
            </Text>
          </View>
        </View>

        <Text style={styles.specialization}>
          {booking.doctor_specialization}
        </Text>

        <View style={styles.detailsSection}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color="#666" />
            <Text style={styles.infoText}>{booking.hospital_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>{date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.infoText}>{time}</Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.paymentInfo}>
            <Text style={styles.amount}>
              Rs. {booking.total_amount?.toFixed(2)}
            </Text>
            <Text style={styles.paymentStatus}>
              {booking.payment_status || "Pending"}
            </Text>
          </View>
          {showCancelButton && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(booking)}
            >
              <Ionicons name="close-circle" size={20} color="#ef5350" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.noBookingsContainer}>
            <View style={styles.noBookingsIconContainer}>
              <Ionicons name="calendar" size={65} color="#3f51b5" />
            </View>
            <Text style={styles.noBookingsTitle}>No Bookings Found</Text>
            <Text style={styles.noBookingsDescription}>
              You haven't made any appointments yet
            </Text>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => navigation.navigate("Appointment")}
            >
              <Text style={styles.bookNowButtonText}>Book Appointment</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Upcoming Appointments */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            </View>
            {bookings
              .filter(
                (booking) =>
                  !booking.isPast && booking.status?.toLowerCase() === "pending"
              )
              .map(renderBookingCard)}

            {/* Past & Other Appointments */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Past & Completed</Text>
            </View>
            {bookings
              .filter(
                (booking) =>
                  booking.isPast || booking.status?.toLowerCase() !== "pending"
              )
              .map(renderBookingCard)}
          </>
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={40} color="#ef5350" />
            </View>
            <Text style={styles.modalTitle}>Cancel Appointment?</Text>
            {selectedBooking && (
              <View style={styles.modalDetails}>
                <Text style={styles.modalDetailText}>
                  Doctor: {selectedBooking.doctor_name}
                </Text>
                <Text style={styles.modalDetailText}>
                  Date:{" "}
                  {
                    formatDateTime(
                      selectedBooking.appointment_date,
                      selectedBooking.appointment_time
                    ).date
                  }
                </Text>
                <Text style={styles.modalDetailText}>
                  Time: {selectedBooking.appointment_time}
                </Text>
              </View>
            )}
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                <Text style={styles.modalButtonCancelText}>
                  Keep Appointment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  cancelling && styles.modalButtonDisabled,
                ]}
                onPress={confirmCancellation}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... (keep all existing styles)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#3f51b5",
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
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
    alignItems: "center",
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  specialization: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  detailsSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  paymentInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3f51b5",
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 12,
    color: "#666",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: "#ef5350",
    fontSize: 14,
    fontWeight: "600",
  },
  noBookingsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  noBookingsIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  noBookingsTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 10,
    textAlign: "center",
  },
  noBookingsDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  bookNowButton: {
    backgroundColor: "#3f51b5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDetails: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    width: "100%",
  },
  modalDetailText: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#e8eaf6",
  },
  modalButtonConfirm: {
    backgroundColor: "#ef5350",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalButtonCancelText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  appointmentInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    width: "100%",
  },
  appointmentInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  pastAppointment: {
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  upcomingBadge: {
    backgroundColor: "#e3f2fd",
  },
  upcomingBadgeText: {
    color: "#1976d2",
  },
  pastBadge: {
    backgroundColor: "#f5f5f5",
  },
  pastBadgeText: {
    color: "#757575",
  },
  lastChild: {
    marginBottom: 0,
  },
});

export default ManageBookingsScreen;
