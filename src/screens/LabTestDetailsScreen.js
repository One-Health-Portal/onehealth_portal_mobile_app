import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const LabTestDetailsScreen = ({ route, navigation }) => {
  const { test } = route.params;

  const getStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return "#FFD60A";
      case "Completed":
        return "#34C759";
      case "Cancelled":
        return "#FF3B30";
      default:
        return "#666";
    }
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
          <Text style={styles.headerTitle}>Test Details</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Test Header */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{test.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(test.status) + "15" },
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

          {/* Lab Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.detailRow}>
                <Ionicons name="business" size={20} color="#666" />
                <Text style={styles.detailText}>{test.lab}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.detailText}>
                  {new Date(test.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.detailText}>{test.time}</Text>
              </View>
            </View>
          </View>

          {/* Test Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.detailRow}>
                <Ionicons name="document-text" size={20} color="#666" />
                <Text style={styles.detailText}>Test ID: {test.testId}</Text>
              </View>
              {test.instructions && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#666"
                    />
                    <Text style={styles.detailText}>{test.instructions}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Test Results */}
          {test.status === "Completed" && test.result && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <View style={styles.infoCard}>
                <View style={styles.resultRow}>
                  <View style={styles.resultIconContainer}>
                    <Ionicons name="flask" size={24} color="#3f51b5" />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultText}>{test.result}</Text>
                  </View>
                </View>
                {test.normalRange && (
                  <View style={styles.normalRange}>
                    <Text style={styles.normalRangeText}>
                      Normal Range: {test.normalRange}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  card: {
    gap: 20,
  },
  titleSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    marginRight: 12,
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  normalRange: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  normalRangeText: {
    fontSize: 14,
    color: "#666",
  },
});

export default LabTestDetailsScreen;
