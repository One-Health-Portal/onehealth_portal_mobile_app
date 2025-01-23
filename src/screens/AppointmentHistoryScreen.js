import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appointmentService } from "../services/api.service";
import { useAuth } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/api.config";

const { width } = Dimensions.get("window");

const AppointmentHistoryScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    requestPermissions();
    fetchAppointments();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please grant storage permission to download receipts"
        );
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getAppointmentHistory();

      if (response?.data) {
        const formattedAppointments = response.data.map((appointment) => ({
          ...appointment,
          formatted_date: new Date(
            appointment.appointment_date
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          formatted_time: appointment.appointment_time.slice(0, 5),
        }));
        setAppointments(formattedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.log("Error fetching appointments:", error);
      // Alert.alert("Error", "Failed to load appointment history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (appointment) => {
    try {
      setDownloadingReceipt(true);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Please login again to download receipt");
      }

      // Create download path
      const fileName = `receipt_${appointment.appointment_number}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Download file
      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_CONFIG.BASE_URL}/appointments/${appointment.appointment_id}/receipt`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // Share the file after download
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Receipt",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.log("Download error:", error);
      Alert.alert(
        "Download Failed",
        "Could not download receipt. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#FFB300";
      case "Completed":
        return "#4CAF50";
      case "Cancelled":
        return "#FF3B30";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "time";
      case "Completed":
        return "checkmark-circle";
      case "Cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = appointment.doctor_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "All" || appointment.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const groupedAppointments = filteredAppointments.reduce(
    (acc, appointment) => {
      const date = new Date(appointment.appointment_date);
      const key = `${date.toLocaleString("default", {
        month: "long",
      })} ${date.getFullYear()}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(appointment);
      return acc;
    },
    {}
  );

  const renderAppointmentCard = (appointment) => (
    <View
      key={appointment.appointment_id}
      style={[
        styles.appointmentCard,
        { borderLeftColor: getStatusColor(appointment.status) },
      ]}
    >
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(appointment.status) + "15" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(appointment.status)}
            size={16}
            color={getStatusColor(appointment.status)}
            style={styles.statusIcon}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(appointment.status) },
            ]}
          >
            {appointment.status}
          </Text>
        </View>
        <Text style={styles.dateText}>{appointment.formatted_date}</Text>
      </View>

      {/* Doctor Info */}
      <View style={styles.doctorSection}>
        <View style={styles.doctorAvatar}>
          <Text style={styles.avatarText}>
            {appointment.doctor_name?.charAt(0)}
          </Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{appointment.doctor_name}</Text>
          <Text style={styles.specialization}>
            {appointment.doctor_specialization}
          </Text>
        </View>
      </View>

      {/* Appointment Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{appointment.hospital_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{appointment.formatted_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            #{appointment.appointment_number}
          </Text>
        </View>
      </View>

      {/* Always show the Download Receipt button */}
      <TouchableOpacity
        style={[
          styles.downloadButton,
          downloadingReceipt && styles.downloadingButton,
        ]}
        onPress={() => handleDownloadReceipt(appointment)}
        disabled={downloadingReceipt}
      >
        {downloadingReceipt ? (
          <ActivityIndicator size="small" color="#3b5998" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#3b5998" />
            <Text style={styles.downloadButtonText}>Download Receipt</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.noAppointmentsContainer}>
      <View style={styles.noAppointmentsIconContainer}>
        <Ionicons name="calendar-outline" size={100} color="#3b5998" />
      </View>
      <Text style={styles.noAppointmentsTitle}>No Appointments Found</Text>
      <Text style={styles.noAppointmentsSubtitle}>
        {searchQuery
          ? "Try adjusting your search or filters"
          : "You haven't booked any appointments recently"}
      </Text>
      <TouchableOpacity
        style={styles.bookAppointmentButton}
        onPress={() => navigation.navigate("Appointment")}
      >
        <Text style={styles.bookAppointmentButtonText}>
          Book Your First Appointment
        </Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Appointment History</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {["All", "Pending", "Completed", "Cancelled"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Ionicons
                name={
                  filter === "All"
                    ? "apps"
                    : filter === "Pending"
                    ? "time"
                    : filter === "Completed"
                    ? "checkmark-circle"
                    : "close-circle"
                }
                size={16}
                color={selectedFilter === filter ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextSelected,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3f51b5"]}
            />
          }
        >
          {Object.keys(groupedAppointments).length === 0 ? (
            <View style={styles.noAppointmentsContainer}>
              <View style={styles.noAppointmentsIconContainer}>
                <Ionicons name="calendar-outline" size={65} color="#3f51b5" />
              </View>
              <Text style={styles.noAppointmentsTitle}>
                No Appointments Found
              </Text>
              <Text style={styles.noAppointmentsDescription}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "You haven't booked any appointments recently"}
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
            Object.entries(groupedAppointments).map(
              ([month, monthAppointments]) => (
                <View key={month} style={styles.monthSection}>
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthTitle}>{month}</Text>
                    <View style={styles.appointmentCount}>
                      <Ionicons name="calendar" size={16} color="#3f51b5" />
                      <Text style={styles.monthCountText}>
                        {monthAppointments.length} appointments
                      </Text>
                    </View>
                  </View>
                  {monthAppointments.map((appointment) => (
                    <View
                      key={appointment.appointment_id}
                      style={[
                        styles.appointmentCard,
                        { borderLeftColor: getStatusColor(appointment.status) },
                      ]}
                    >
                      <View style={styles.statusHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getStatusColor(appointment.status) + "15",
                            },
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(appointment.status)}
                            size={16}
                            color={getStatusColor(appointment.status)}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(appointment.status) },
                            ]}
                          >
                            {appointment.status}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>
                          {appointment.formatted_date}
                        </Text>
                      </View>

                      <View style={styles.doctorSection}>
                        <View style={styles.doctorAvatar}>
                          <Text style={styles.avatarText}>
                            {appointment.doctor_name?.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.doctorInfo}>
                          <Text style={styles.doctorName}>
                            {appointment.doctor_name}
                          </Text>
                          <Text style={styles.specialization}>
                            {appointment.doctor_specialization}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsSection}>
                        <View style={styles.detailRow}>
                          <Ionicons name="business" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            {appointment.hospital_name}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            {appointment.formatted_time}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="document-text"
                            size={16}
                            color="#666"
                          />
                          <Text style={styles.detailText}>
                            #{appointment.appointment_number}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleDownloadReceipt(appointment)}
                        disabled={downloadingReceipt}
                      >
                        {downloadingReceipt ? (
                          <ActivityIndicator size="small" color="#3f51b5" />
                        ) : (
                          <>
                            <Ionicons
                              name="download"
                              size={20}
                              color="#3f51b5"
                            />
                            <Text style={styles.downloadButtonText}>
                              Download Receipt
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            )
          )}
        </ScrollView>
      )}
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
  searchSection: {
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#1a237e",
    paddingVertical: 12,
  },
  filterContainer: {
    paddingVertical: 5,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterChipSelected: {
    backgroundColor: "#3f51b5",
  },
  filterChipText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  filterChipTextSelected: {
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  monthSection: {
    marginBottom: 25,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  appointmentCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monthCountText: {
    fontSize: 14,
    color: "#3f51b5",
    marginLeft: 6,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  doctorSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#3f51b5",
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: "#666",
  },
  detailsSection: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8eaf6",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: "#3f51b5",
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#3f51b5",
    fontSize: 16,
  },
  noAppointmentsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  noAppointmentsIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  noAppointmentsTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a237e",
    textAlign: "center",
    marginBottom: 10,
  },
  noAppointmentsDescription: {
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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    lastChild: {
      marginBottom: 0,
    },
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8eaf6",
    margin: 16,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  downloadingButton: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: "#3f51b5",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#3f51b5",
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#3f51b5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default AppointmentHistoryScreen;
