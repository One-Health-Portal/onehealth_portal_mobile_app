import React, { useState, useCallback, useRef } from "react";
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
  Platform,
  StatusBar,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash/debounce";

const { width } = Dimensions.get("window");

// Sample tests data
const samplePopularTests = [
  {
    id: 1,
    name: "Complete Blood Count (CBC)",
    shortName: "CBC",
    description:
      "A comprehensive blood test that evaluates overall health and detects various disorders.",
    price: 799,
  },
  {
    id: 2,
    name: "Lipid Profile Test",
    shortName: "Lipid Panel",
    description:
      "Measures cholesterol levels and assesses risk of heart disease.",
    price: 1299,
  },
  {
    id: 3,
    name: "Thyroid Function Test",
    shortName: "Thyroid Panel",
    description:
      "Evaluates thyroid hormone levels to diagnose thyroid disorders.",
    price: 1499,
  },
  {
    id: 4,
    name: "Diabetes Screening",
    shortName: "Glucose Test",
    description:
      "Checks blood sugar levels to screen for diabetes and prediabetes.",
    price: 599,
  },
  {
    id: 5,
    name: "Vitamin D and B12 Profile",
    shortName: "Vitamin Screen",
    description:
      "Comprehensive test for vitamin deficiencies that impact overall health.",
    price: 1199,
  },
  {
    id: 6,
    name: "Kidney Function Test",
    shortName: "Renal Panel",
    description:
      "Assesses kidney health and detects potential kidney-related issues.",
    price: 899,
  },
];

const LabTestsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popularTests, setPopularTests] = useState(samplePopularTests);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      try {
        setIsSearching(true);

        if (!query) {
          setSearchResults([]);
          setShowSearchResults(false);
          return;
        }

        const results = samplePopularTests.filter(
          (test) =>
            test.name.toLowerCase().includes(query.toLowerCase()) ||
            test.shortName.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.log("Search error:", error);
        Alert.alert(
          "Search Error",
          "Failed to search lab tests. Please try again."
        );
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  // Navigate to booking screen
  const navigateToBooking = (test) => {
    navigation.navigate("LabTestBooking", { test });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading lab tests...</Text>
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
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lab Tests</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("UpcomingLabTests")}
            style={styles.manageButton}
          >
            <Text style={styles.manageButtonText}>Upcoming</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              ref={searchInputRef}
              placeholder="Search Lab Test..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                debouncedSearch(text);
              }}
              maxLength={30}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {isSearching && (
              <ActivityIndicator
                size="small"
                color="#666"
                style={styles.searchingIndicator}
              />
            )}
          </View>
        </View>

        {/* Search Results or Popular Tests */}
        {showSearchResults || searchQuery ? (
          <View style={styles.section}>
            {/* Results Header */}
            <View style={styles.resultsHeader}>
              <View style={styles.resultsCount}>
                <Ionicons name="medical" size={20} color="#1a237e" />
                <Text style={styles.resultsCountText}>
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "Test" : "Tests"} Found
                </Text>
              </View>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color="#1a237e"
                  />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {searchResults.length > 0 ? (
              <View>
                {searchResults.map((test) => (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.testCard}
                    onPress={() => navigateToBooking(test)}
                  >
                    <View style={styles.testInfo}>
                      <Text style={styles.testName}>{test.name}</Text>
                      <Text style={styles.testShortName}>{test.shortName}</Text>
                      <Text style={styles.testDescription} numberOfLines={2}>
                        {test.description}
                      </Text>
                    </View>
                    <View style={styles.priceSection}>
                      <Text style={styles.priceLabel}>From</Text>
                      <Text style={styles.priceAmount}>Rs. {test.price}</Text>
                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => navigateToBooking(test)}
                      >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <View style={styles.noResultsIconContainer}>
                  <Ionicons
                    name="search"
                    size={40}
                    color="#e8eaf6"
                    style={styles.noResultsBackIcon}
                  />
                  <Ionicons name="medical" size={65} color="#1a237e" />
                </View>
                <Text style={styles.noResultsTitle}>No Tests Found</Text>
                <Text style={styles.noResultsDescription}>
                  We couldn't find any tests matching your search
                </Text>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={clearFilters}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.tryAgainButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // Popular Tests Section
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Tests</Text>
            <View style={styles.popularGrid}>
              {popularTests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.popularTestCard}
                  onPress={() => navigateToBooking(test)}
                >
                  <View style={styles.popularTestIcon}>
                    <Ionicons name="medical" size={24} color="#1a237e" />
                  </View>
                  <Text style={styles.popularTestName} numberOfLines={2}>
                    {test.name}
                  </Text>
                  <Text style={styles.popularTestPrice}>
                    From Rs. {test.price.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  manageButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageButtonText: {
    color: "#1a237e",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
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
  searchingIndicator: {
    marginLeft: 10,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  resultsCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultsCountText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#1a237e",
    fontWeight: "500",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EAF6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#1a237e",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  testCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testInfo: {
    flex: 1,
    marginRight: 15,
  },
  testName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 4,
  },
  testShortName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  priceSection: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: "#1a237e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 15,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  popularTestCard: {
    width: (width - 55) / 2,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  popularTestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8EAF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  popularTestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
    height: 40,
  },
  popularTestPrice: {
    fontSize: 14,
    color: "#1a237e",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#1a237e",
    fontSize: 16,
    fontWeight: "500",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noResultsIconContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  noResultsBackIcon: {
    position: "absolute",
    left: -20,
    opacity: 0.5,
  },
  noResultsTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 10,
    textAlign: "center",
  },
  noResultsDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  tryAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a237e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tryAgainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default LabTestsScreen;
