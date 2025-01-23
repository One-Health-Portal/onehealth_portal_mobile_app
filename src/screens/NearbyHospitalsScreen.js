import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Linking,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { hospitalService } from "../services/api.service"; // Import hospitalService

const NearbyHospitalsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user location and hospitals
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Start a minimum loading time (e.g., 1 second)
        const minimumLoadingTime = new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to find nearby hospitals."
          );
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);

        // Fetch all hospitals
        const hospitalsPromise = hospitalService.getAllHospitals();

        // Wait for both the minimum loading time and the API call
        const [_, response] = await Promise.all([
          minimumLoadingTime,
          hospitalsPromise,
        ]);

        console.log("API Response:", response); // Log the response for debugging

        // Ensure the response is an array
        if (Array.isArray(response)) {
          setHospitals(response); // Set the hospitals directly
        } else {
          throw new Error("Invalid hospital data received");
        }
      } catch (error) {
        console.log("Error fetching data:", error);
        setError("Failed to fetch hospitals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle directions to a hospital
  const handleDirections = async (hospital) => {
    if (!userLocation) {
      Alert.alert("Error", "Unable to get your current location.");
      return;
    }

    const url = Platform.select({
      ios: `maps://app?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${hospital.latitude},${hospital.longitude}`,
      android: `google.navigation:q=${hospital.latitude},${hospital.longitude}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "Maps application not found");
      }
    });
  };

  // Handle emergency call
  const handleEmergencyCall = () => {
    Linking.openURL("tel:1990");
  };

  // Filter hospitals based on search query
  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>Nearby Hospitals</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
            <Text style={styles.emergencySubtitle}>
              Call 1990 Suwa Seriya Ambulance Service
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleEmergencyCall}
          >
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3f51b5" />
            <Text style={styles.loadingText}>Fetching nearby hospitals...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                // Retry fetching hospitals
                hospitalService
                  .getAllHospitals()
                  .then((response) => {
                    if (Array.isArray(response)) {
                      setHospitals(response);
                    } else {
                      throw new Error("Invalid hospital data received");
                    }
                  })
                  .catch((error) => {
                    console.log("Error retrying fetch:", error);
                    setError("Failed to fetch hospitals. Please try again.");
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredHospitals.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <View style={styles.noResultsIconContainer}>
              <Ionicons name="medical" size={65} color="#3f51b5" />
            </View>
            <Text style={styles.noResultsTitle}>No Hospitals Found</Text>
            <Text style={styles.noResultsDescription}>
              Try adjusting your search criteria
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>Clear Search</Text>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredHospitals}
            keyExtractor={(item) => item.hospital_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.hospitalCard}>
                <View style={styles.hospitalCardContent}>
                  <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName}>{item.name}</Text>
                    <View style={styles.hospitalDetailRow}>
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.hospitalDetailText}>
                        {item.address}
                      </Text>
                    </View>
                    <View style={styles.hospitalDetailRow}>
                      <Ionicons name="call" size={16} color="#666" />
                      <Text style={styles.hospitalDetailText}>
                        {item.phone}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.hospitalCardActions}>
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={() => handleDirections(item)}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  emergencyBanner: {
    backgroundColor: "#ffebee",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#c62828",
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: "#ef5350",
    lineHeight: 20,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ef5350",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 12,
    fontSize: 16,
    color: "#1a237e",
  },
  hospitalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hospitalCardContent: {
    padding: 16,
    flexDirection: "row",
  },
  hospitalInfo: {
    flex: 1,
    marginRight: 16,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  hospitalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  hospitalDetailText: {
    fontSize: 14,
    color: "#666",
  },
  hospitalCardActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  directionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3f51b5",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  noResultsIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
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
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  clearButton: {
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
  clearButtonText: {
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
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#c62828",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3f51b5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NearbyHospitalsScreen;
