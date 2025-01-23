import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doctorService } from "../services/api.service";
import debounce from "lodash/debounce";
import _ from "lodash";

const { width } = Dimensions.get("window");

const DoctorCard = ({ doctor, onBook }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(animatedValue, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const rotateIcon = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.doctorCard}>
      <TouchableOpacity
        style={styles.doctorHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  doctor.profile_picture_url ||
                  "https://via.placeholder.com/60",
              }}
              style={styles.doctorImage}
            />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {doctor.title} {doctor.name}
            </Text>
            <View style={styles.specializationContainer}>
              <Ionicons name="medical" size={14} color="#27ae60" />
              <Text style={styles.specialization}>{doctor.specialization}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="business-outline" size={14} color="#666" />
                <Text style={styles.statText}>
                  {doctor.hospitals?.length || 0} Hospital
                  {doctor.hospitals?.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
          <View style={styles.expandButton}>
            <Ionicons name="chevron-down" size={20} color="#3498db" />
          </View>
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.availabilitySection}>
          {doctor.hospitals?.map((hospital, index) => (
            <View
              key={hospital.hospital_id || `hospital-${index}`}
              style={styles.hospitalCard}
            >
              <View style={styles.hospitalMainInfo}>
                <Image
                  source={{
                    uri: hospital.logo_url || "https://via.placeholder.com/40",
                  }}
                  style={styles.hospitalLogo}
                />
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <View style={styles.timeWrapper}>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.availabilityTime}>
                        {hospital.availability.start} -{" "}
                        {hospital.availability.end}
                      </Text>
                    </View>
                    {hospital.emergency_services_available && (
                      <View style={styles.emergencyBadge}>
                        <Ionicons name="medical" size={12} color="#fff" />
                        <Text style={styles.emergencyText}>24/7</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => onBook(doctor, hospital)}
                activeOpacity={0.8}
              >
                <Text style={styles.bookButtonText}>Book Appointment</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const HospitalItem = ({ hospital, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.hospitalItem, isSelected && styles.selectedHospital]}
    onPress={() => onSelect(hospital)}
  >
    <Image
      source={{ uri: hospital.logo_url || "https://via.placeholder.com/50" }}
      style={styles.hospitalItemLogo}
    />
    <View style={styles.hospitalItemInfo}>
      <Text style={styles.hospitalItemName} numberOfLines={2}>
        {hospital.name}
      </Text>
      <Text style={styles.hospitalItemAddress} numberOfLines={1}>
        {hospital.address}
      </Text>
    </View>
    {hospital.emergency_services_available && (
      <View style={styles.smallEmergencyBadge}>
        <Text style={styles.smallEmergencyText}>24/7</Text>
      </View>
    )}
  </TouchableOpacity>
);

const AppointmentScreen = ({ navigation }) => {
  const [searchDoctor, setSearchDoctor] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    {
      id: 1,
      name: "GP",
      displayName: "General Practitioner",
      icon: "medkit",
      color: "#4CAF50",
    },
    {
      id: 2,
      name: "Cardio",
      displayName: "Cardiologist",
      icon: "heart",
      color: "#2196F3",
    },
    {
      id: 3,
      name: "Gyneco",
      displayName: "Gynecologist",
      icon: "female",
      color: "#9C27B0",
    },
    {
      id: 4,
      name: "Psych",
      displayName: "Psychiatrist",
      icon: "happy",
      color: "#FF5722",
    },
    {
      id: 5,
      name: "Neuro",
      displayName: "Neurologist",
      icon: "pulse",
      color: "#3F51B5",
    },
    {
      id: 6,
      name: "Derma",
      displayName: "Dermatologist",
      icon: "body",
      color: "#795548",
    },
    {
      id: 7,
      name: "Pedia",
      displayName: "Pediatrician",
      icon: "people",
      color: "#FF9800",
    },
    {
      id: 8,
      name: "Ortho",
      displayName: "Orthopedist",
      icon: "walk",
      color: "#607D8B",
    },
  ];

  const parseSearchTerm = (searchTerm) => {
    const term = searchTerm.trim();

    // Check if search term contains specific prefixes
    if (term.toLowerCase().startsWith("dr")) {
      return { doctorName: term };
    } else if (term.toLowerCase().includes("hospital")) {
      return { hospitalName: term };
    }

    // If no specific prefix, use as general query
    return { query: term };
  };

  // Helper function to check if there are any search criteria
  const hasSearchCriteria = (searchParams) => {
    return Object.values(searchParams).some(
      (value) => value && value.trim().length > 0
    );
  };

  const debouncedSearch = debounce(async (searchTerm) => {
    try {
      setIsSearching(true);

      // Parse search term to check if it's for doctor or hospital
      const searchParams = parseSearchTerm(searchTerm);

      // If there's no search criteria and no filters, clear results
      if (
        !hasSearchCriteria(searchParams) &&
        !selectedSpecialization &&
        !selectedHospital
      ) {
        setSearchResults([]);
        return;
      }

      const results = await doctorService.searchDoctors({
        ...searchParams,
        specialization: selectedSpecialization,
        hospitalId: selectedHospital?.hospital_id,
      });

      setSearchResults(results);
    } catch (error) {
      console.log("Search error:", error);
      Alert.alert(
        "Search Error",
        error.message || "Failed to search doctors. Please try again."
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  const filterResults = (results) => {
    let filteredResults = [...results];

    if (selectedHospital) {
      filteredResults = filteredResults.filter((doctor) =>
        doctor.hospitals?.some(
          (h) => h.hospital_id === selectedHospital.hospital_id
        )
      );
    }

    if (selectedSpecialization) {
      filteredResults = filteredResults.filter(
        (doctor) => doctor.specialization === selectedSpecialization
      );
    }

    return filteredResults;
  };

  const clearFilters = () => {
    setSearchDoctor("");
    setSelectedHospital(null);
    setSelectedSpecialization("");
    setSearchResults([]);
  };

  const getCurrentFilterSummary = () => {
    const filters = [];

    if (searchDoctor) {
      filters.push({
        type: "search",
        label: `Search: "${searchDoctor}"`,
        icon: "search",
      });
    }

    if (selectedSpecialization) {
      filters.push({
        type: "specialization",
        label: selectedSpecialization,
        icon: "medical",
      });
    }

    if (selectedHospital) {
      filters.push({
        type: "hospital",
        label: selectedHospital.name,
        icon: "business",
      });
    }

    return filters;
  };

  const removeFilter = (filterType) => {
    switch (filterType) {
      case "search":
        setSearchDoctor("");
        break;
      case "specialization":
        setSelectedSpecialization("");
        break;
      case "hospital":
        setSelectedHospital(null);
        break;
    }
  };

  useEffect(() => {
    if (searchDoctor) {
      debouncedSearch(searchDoctor);
    } else {
      setSearchResults([]);
    }
    return () => debouncedSearch.cancel();
  }, [searchDoctor]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [doctorsData, specializationDoctors] = await Promise.all([
          doctorService.getAllDoctors(),
          selectedSpecialization
            ? doctorService.getDoctorsBySpecialization(selectedSpecialization)
            : Promise.resolve([]),
        ]);

        setDoctors(doctorsData);

        // Extract unique hospitals from doctors data
        const uniqueHospitals = [
          ...new Map(
            doctorsData
              .flatMap((doctor) =>
                doctor.hospitals?.map((hospital) => ({
                  ...hospital,
                  doctor_count: doctorsData.filter((d) =>
                    d.hospitals?.some(
                      (h) => h.hospital_id === hospital.hospital_id
                    )
                  ).length,
                }))
              )
              .map((hospital) => [hospital.hospital_id, hospital]) // Use hospital_id as the key
          ).values(), // Convert Map values back to an array
        ];

        setHospitals(uniqueHospitals);

        const uniqueSpecializations = [
          ...new Set(doctorsData.map((doctor) => doctor.specialization)),
        ];
        setSpecializations(uniqueSpecializations);

        if (selectedSpecialization) {
          setSearchResults(filterResults(specializationDoctors));
        }
      } catch (error) {
        console.log("Error fetching initial data:", error);
        Alert.alert("Error", "Failed to load doctors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedSpecialization]);

  const handleSpecializationSelect = async (specialization) => {
    try {
      setLoading(true);
      setSelectedSpecialization(specialization);

      if (specialization) {
        const doctors = await doctorService.getDoctorsBySpecialization(
          specialization
        );
        setSearchResults(filterResults(doctors));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log("Error fetching doctors by specialization:", error);
      Alert.alert("Error", "Failed to fetch doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalSelect = async (hospital) => {
    if (!hospital || !hospital.hospital_id) {
      Alert.alert("Error", "Invalid hospital selected.");
      return;
    }
    setSelectedHospital(hospital);
    try {
      setLoading(true);
      const doctors = await doctorService.getDoctorsByHospital(
        hospital.hospital_id
      );

      // Ensure each doctor has the selected hospital in their hospitals array
      const doctorsWithSelectedHospital = doctors.map((doctor) => ({
        ...doctor,
        hospitals: [hospital], // Only show the selected hospital
      }));

      setSearchResults(doctorsWithSelectedHospital);
    } catch (error) {
      console.log("Error fetching doctors by hospital:", error);
      Alert.alert("Error", "Failed to fetch doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
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
          <Text style={styles.headerTitle}>Book Appointment </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageBookings")}
            style={styles.manageButton}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Section - Always visible */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Search doctors by name or specialization"
              style={styles.searchInput}
              value={searchDoctor}
              onChangeText={setSearchDoctor}
              maxLength={30}
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

        {searchDoctor || selectedSpecialization || selectedHospital ? (
          // Show only search results when searching
          <View style={styles.section}>
            {/* Active Filters Section */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersContainer}
            >
              {getCurrentFilterSummary().map((filter) => (
                <TouchableOpacity
                  key={filter.type}
                  style={styles.activeFilterChip}
                  onPress={() => removeFilter(filter.type)}
                >
                  <Ionicons name={filter.icon} size={16} color="#fff" />
                  <Text style={styles.activeFilterChipText}>
                    {filter.label}
                  </Text>
                  <Ionicons
                    name="close"
                    size={16}
                    color="#fff"
                    style={styles.removeFilterIcon}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {searchResults.length > 0 ? (
              <>
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsCount}>
                    <Ionicons name="people" size={20} color="#3498db" />
                    <Text style={styles.resultsCountText}>
                      {searchResults.length}{" "}
                      {searchResults.length === 1 ? "Doctor" : "Doctors"} Found
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearFilters}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color="#3f51b5"
                    />
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.doctorsList}>
                  {searchResults.map((doctor) => (
                    <DoctorCard
                      key={doctor.doctor_id}
                      doctor={doctor}
                      onBook={(doctor, hospital) =>
                        navigation.navigate("AppointmentBooking", {
                          doctor,
                          hospital,
                          hospital_id: hospital.hospital_id,
                        })
                      }
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <View style={styles.noResultsIconContainer}>
                  <Ionicons
                    name="search"
                    size={40}
                    color="#e8eaf6"
                    style={styles.noResultsBackIcon}
                  />
                  <Ionicons name="medical" size={65} color="#3f51b5" />
                </View>
                <Text style={styles.noResultsTitle}>No Doctors Found</Text>
                <Text style={styles.noResultsDescription}>
                  We couldn't find any doctors matching your current filters
                </Text>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={clearFilters}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.tryAgainButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // Show all sections when not searching
          <>
            {/* Specializations Slider */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Medical Specialties</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categorySlider}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categorySliderItem,
                      { backgroundColor: category.color },
                      selectedSpecialization === category.displayName &&
                        styles.selectedCategory,
                    ]}
                    onPress={() =>
                      handleSpecializationSelect(category.displayName)
                    }
                    activeOpacity={0.9}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Ionicons name={category.icon} size={28} color="#fff" />
                    </View>
                    <View style={styles.categoryTextContainer}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text style={styles.tooltipText} numberOfLines={1}>
                        {category.displayName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Hospitals Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Available Hospitals</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hospitalSlider}
              >
                {hospitals.map((hospital, index) => (
                  <HospitalItem
                    key={`hospital-${index}`}
                    hospital={hospital}
                    isSelected={
                      selectedHospital?.hospital_id === hospital.hospital_id
                    }
                    onSelect={() => handleHospitalSelect(hospital)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Popular Doctors Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Popular Doctors</Text>
              </View>
              <View style={styles.doctorsList}>
                {doctors.slice(0, 3).map((doctor) => (
                  <DoctorCard
                    key={doctor.doctor_id}
                    doctor={doctor}
                    onBook={(doctor, hospital) =>
                      navigation.navigate("AppointmentBooking", {
                        doctor,
                        hospital,
                        hospital_id: hospital.hospital_id,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles at the bottom of the file
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
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  manageButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageButtonText: {
    color: "#3f51b5",
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  categorySlider: {
    paddingVertical: 10,
  },
  categorySliderItem: {
    width: width * 0.35,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  tooltipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "400",
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  hospitalSlider: {
    paddingVertical: 10,
  },
  hospitalItem: {
    width: width * 0.4,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hospitalItemLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  hospitalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  hospitalItemAddress: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  smallEmergencyBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  smallEmergencyText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  doctorCard: {
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
  doctorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    marginRight: 16,
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#e8eaf6",
  },
  experienceBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#3498db",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  experienceText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  doctorInfo: {
    flex: 1,
    justifyContent: "center",
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
    marginBottom: 6,
  },
  specialization: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "500",
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 2,
  },
  expandButton: {
    width: 32,
    height: 32,
    backgroundColor: "#f5f6fa",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  availabilitySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 16,
  },
  hospitalCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  hospitalMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  hospitalLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 6,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityTime: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  emergencyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "500",
  },
  noResultsContainer: {
    alignItems: "center",
    padding: 20,
  },
  noResultsIcon: {
    marginBottom: 20,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#3f51b5",
    fontSize: 16,
  },
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
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  manageButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageButtonText: {
    color: "#3f51b5",
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
  activeFiltersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3f51b5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterChipText: {
    color: "#fff",
    fontSize: 14,
    marginHorizontal: 5,
  },
  removeFilterIcon: {
    marginLeft: 5,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  categorySlider: {
    paddingVertical: 10,
  },
  categorySliderItem: {
    width: width * 0.35,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  tooltipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "400",
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  hospitalSlider: {
    paddingVertical: 10,
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
    color: "#3498db",
    fontWeight: "500",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "#3f51b5",
    marginLeft: 5,
    fontSize: 14,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noResultsIconContainer: {
    flexDirection: "row",
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
  },
  tryAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3f51b5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  tryAgainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default AppointmentScreen;
