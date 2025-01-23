import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { labTestService } from "../services/api.service";

const { width } = Dimensions.get("window");

const LabTestHistoryScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabTestHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const historyResponse = await labTestService.getLabTestHistory();
        console.log("Lab test history:", historyResponse); // Log the response for debugging

        // Map the backend response to the expected frontend structure
        const mappedTests = historyResponse.map((test) => ({
          id: test.lab_test_id, // Use lab_test_id as the unique identifier
          name: test.test_type, // Map test_type to name
          lab: `${test.hospital_name}`, // Map hospital_id to lab
          status: test.status,
          date: test.test_date,
          time: test.test_time,
          testId: test.lab_test_id, // Use lab_test_id as testId
          instructions: test.instruction, // Add instructions if needed
          result: test.result, // Add result if needed
        }));

        setLabTests(mappedTests);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setError("No lab tests found for the current user.");
        } else {
          setError("Failed to load lab test history. Please try again later.");
          console.log("Lab test history fetch error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLabTestHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return "#FFD60A"; // Yellow for Scheduled
      case "Completed":
        return "#34C759"; // Green for Completed
      case "Cancelled":
        return "#FF3B30"; // Red for Cancelled
      default:
        return "#666"; // Gray for unknown status
    }
  };

  const filteredTests = labTests.filter(
    (test) =>
      (selectedFilter === "All" || test.status === selectedFilter) &&
      (test.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthGroups = filteredTests.reduce((acc, test) => {
    const dateObj = new Date(test.date);
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();
    const key = `${month} ${year}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(test);
    return acc;
  }, {});

  const handleDownloadReceipt = async (testId) => {
    try {
      Alert.alert("Download", "Receipt download functionality not implemented");
    } catch (error) {
      Alert.alert("Error", "Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5998" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="flask" size={80} color="#3b5998" />
        <Text style={styles.emptyStateTitle}>No Lab Tests Found</Text>
        <Text style={styles.emptyStateSubtitle}>{error}</Text>
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
          <Text style={styles.headerTitle}>Lab Tests History</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Lab Tests History..."
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
          {["All", "Completed", "Cancelled", "Scheduled"].map((filter) => (
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
                    : filter === "Scheduled"
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
          <Text style={styles.loadingText}>Loading lab tests...</Text>
        </View>
      ) : filteredTests.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="flask" size={65} color="#3f51b5" />
          </View>
          <Text style={styles.emptyStateTitle}>No Lab Tests Found</Text>
          <Text style={styles.emptyStateDescription}>
            {selectedFilter !== "All"
              ? `No ${selectedFilter.toLowerCase()} lab tests`
              : "You have no lab test history"}
          </Text>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => navigation.navigate("LabTests")}
          >
            <Text style={styles.bookNowButtonText}>Book Lab Test</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {Object.entries(monthGroups).map(([month, tests]) => (
            <View key={month} style={styles.monthSection}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{month}</Text>
                <View style={styles.testCount}>
                  <Ionicons name="flask" size={16} color="#3f51b5" />
                  <Text style={styles.testCountText}>{tests.length} tests</Text>
                </View>
              </View>
              {tests.map((test) => (
                <View key={test.id} style={styles.testCard}>
                  <View style={styles.testHeader}>
                    <Text style={styles.testName}>{test.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(test.status) + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          test.status === "Scheduled"
                            ? "time"
                            : test.status === "Completed"
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={16}
                        color={getStatusColor(test.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(test.status) },
                        ]}
                      >
                        {test.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.labRow}>
                    <Ionicons name="business" size={16} color="#666" />
                    <Text style={styles.labName}>{test.lab}</Text>
                  </View>

                  <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {new Date(test.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.detailText}>{test.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={16} color="#666" />
                      <Text style={styles.detailText}>#{test.testId}</Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() =>
                        navigation.navigate("LabTestDetails", { test })
                      }
                    >
                      <Text style={styles.viewDetailsButtonText}>
                        View Details
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>

                    {test.status === "Completed" && (
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleDownloadReceipt(test.id)}
                      >
                        <Ionicons name="download" size={20} color="#3f51b5" />
                        <Text style={styles.downloadButtonText}>
                          Download Receipt
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
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
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: "#3f51b5",
  },
  filterChipText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
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
  testCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  testCountText: {
    fontSize: 14,
    color: "#3f51b5",
  },
  testCard: {
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
  testHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  labRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  labName: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  detailsSection: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
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
  actionButtons: {
    gap: 8,
  },
  viewDetailsButton: {
    backgroundColor: "#3f51b5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8eaf6",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#3f51b5",
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateDescription: {
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
  statusIcon: {
    marginRight: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
    marginRight: 12,
  },
  testCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: "#3f51b5",
  },
  warningContainer: {
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#f57c00",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#c62828",
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
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
  },
  resultValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  normalRange: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  abnormalValue: {
    color: "#c62828",
  },
  completeButtonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  completeButton: {
    backgroundColor: "#3f51b5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LabTestHistoryScreen;
