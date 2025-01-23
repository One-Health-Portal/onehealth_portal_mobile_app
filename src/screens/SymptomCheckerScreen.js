import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  diseasePredictionService,
  doctorService,
} from "../services/api.service";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

// Color Palette
const COLORS = {
  primary: "#3f51b5",
  primaryLight: "#e8eaf6",
  background: "#f5f5f5",
  white: "#ffffff",
  text: "#1a237e",
  textSecondary: "#666666",
  success: "#27ae60",
  danger: "#ef5350",
};

// Doctor Card Component
const DoctorCard = ({ doctor, onBook }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <View style={styles.onlineStatusBadge} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {doctor.title} {doctor.name}
            </Text>
            <View style={styles.specializationContainer}>
              <Ionicons name="medical" size={14} color={COLORS.success} />
              <Text style={styles.specialization} numberOfLines={1}>
                {doctor.specialization}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="business-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
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
            <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
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
                  <Text style={styles.hospitalName} numberOfLines={1}>
                    {hospital.name}
                  </Text>
                  <View style={styles.timeWrapper}>
                    <View style={styles.timeContainer}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.availabilityTime}>
                        {hospital.availability?.start || "09:00 AM"} -{" "}
                        {hospital.availability?.end || "05:00 PM"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onBook(doctor, hospital);
                }}
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

// Main Screen Component
const SymptomCheckerScreen = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState([]);
  const [inputSymptom, setInputSymptom] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSymptoms([]);
        setResults([]);
        setSuggestedDoctors([]);
        setInputSymptom("");
      };
    }, [])
  );

  const addSymptom = () => {
    if (inputSymptom.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!symptoms.includes(inputSymptom.trim())) {
        setSymptoms([...symptoms, inputSymptom.trim()]);
      }
      setInputSymptom("");
    }
  };

  const removeSymptom = (symptomToRemove) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSymptoms(symptoms.filter((symptom) => symptom !== symptomToRemove));
  };

  const handlePrediction = async () => {
    if (symptoms.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please enter at least one symptom");
      return;
    }

    setLoading(true);
    try {
      const result = await diseasePredictionService.predictDisease(
        symptoms.join(", ")
      );

      if (result.predictions && result.predictions.length > 0) {
        setResults(result.predictions);

        const topPrediction = result.predictions[0];
        const specialties = topPrediction.specialty
          .split(",")
          .map((s) => s.trim());
        console.log(specialties);
        let recommendedDoctors = [];
        for (const specialty of specialties) {
          try {
            const doctors = await doctorService.getDoctorsBySpecialization(
              specialty
            );
            if (doctors && doctors.length > 0) {
              const processedDoctors = doctors.map((doctor) => ({
                ...doctor,
                id: doctor.doctor_id,
                name: doctor.name,
                title: doctor.title || "Dr.",
                specialization: doctor.specialization,
                profile_picture_url: doctor.profile_picture_url,
                hospitals: doctor.hospitals.map((hospital) => ({
                  hospital_id: hospital.hospital_id,
                  name: hospital.name,
                  logo_url: hospital.logo_url,
                  availability: {
                    start: hospital.availability?.start || "09:00 AM",
                    end: hospital.availability?.end || "05:00 PM",
                  },
                })),
              }));
              recommendedDoctors = [...recommendedDoctors, ...processedDoctors];
              if (recommendedDoctors.length >= 5) break;
            }
          } catch (error) {
            console.log(
              `Error fetching doctors for specialty ${specialty}:`,
              error
            );
          }
        }

        setSuggestedDoctors(recommendedDoctors.slice(0, 5));
      }
    } catch (error) {
      console.log("Prediction error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to analyze symptoms");
    } finally {
      setLoading(false);
    }
  };

  const navigateToAppointment = (doctor, hospital) => {
    navigation.navigate("AppointmentBooking", {
      doctor,
      hospital,
      hospital_id: hospital.hospital_id,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.primary}
        barStyle="light-content"
        translucent={false}
      />

      <LinearGradient
        colors={[COLORS.primary, "#3949ab", "#3f51b5"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Checker</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.disclaimerContainer}>
          <Ionicons
            name="information-circle"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.disclaimerText}>
            This tool provides general guidance only and should not replace
            professional medical advice.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          What symptoms are you experiencing?
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Type your symptoms..."
            placeholderTextColor={COLORS.textSecondary}
            value={inputSymptom}
            onChangeText={setInputSymptom}
            onSubmitEditing={addSymptom}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity style={styles.addButton} onPress={addSymptom}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.symptomsContainer}>
          {symptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomChip}>
              <Text style={styles.symptomText}>{symptom}</Text>
              <TouchableOpacity
                onPress={() => removeSymptom(symptom)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.enterButton,
            loading && styles.disabledButton,
            {
              backgroundColor:
                symptoms.length > 0 ? COLORS.primary : COLORS.primaryLight,
            },
          ]}
          onPress={handlePrediction}
          disabled={loading || symptoms.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.enterButtonText,
                { color: symptoms.length > 0 ? "#fff" : COLORS.primary },
              ]}
            >
              Analyze Symptoms
            </Text>
          )}
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultTitle}>Analysis Results</Text>
            <View style={styles.conditionsCard}>
              {results.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.conditionRow,
                    index === results.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.conditionInfo}>
                    <Text style={styles.conditionName}>{result.disease}</Text>
                    <Text style={styles.specialtyText}>{result.specialty}</Text>
                  </View>
                  <View
                    style={[
                      styles.matchBadge,
                      {
                        backgroundColor:
                          result.confidence >= 0.05
                            ? "#ffebee"
                            : COLORS.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        {
                          color:
                            result.confidence >= 0.05
                              ? COLORS.danger
                              : COLORS.primary,
                        },
                      ]}
                    >
                      {(result.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {suggestedDoctors.length > 0 && (
          <View style={styles.doctorsSection}>
            <Text style={styles.resultTitle}>Recommended Doctors</Text>
            {suggestedDoctors.map((doctor, index) => (
              <DoctorCard
                key={index}
                doctor={doctor}
                onBook={(doctor, hospital) =>
                  navigateToAppointment(doctor, hospital)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {results.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.primaryButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("Appointment");
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#fff"
              style={styles.footerButtonIcon}
            />
            <Text style={styles.primaryButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 40 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
    alignItems: "flex-end",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  disclaimerContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  symptomChip: {
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  symptomText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  enterButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  conditionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  conditionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  conditionInfo: {
    flex: 1,
    marginRight: 12,
  },
  conditionName: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  specialtyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },
  matchText: {
    fontSize: 12,
    fontWeight: "600",
  },
  doctorsSection: {
    marginBottom: 24,
  },
  doctorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  profileSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  imageContainer: {
    marginRight: 12,
    position: "relative",
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
  },
  onlineStatusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    maxWidth: width * 0.5,
  },
  specializationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  specialization: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "500",
    maxWidth: width * 0.5,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expandButton: {
    padding: 4,
  },
  availabilitySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  hospitalCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  hospitalMainInfo: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  hospitalLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#e0e0e0",
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
    maxWidth: width * 0.6,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  availabilityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  footerButtonIcon: {
    marginRight: 8,
  },
  footerButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SymptomCheckerScreen;
