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
  Platform,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { feedbackService, appointmentService } from "../services/api.service";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const SubmitFeedbackScreen = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { profile } = useAuth();

  useEffect(() => {
    checkUserData();
    fetchUserAppointments();
  }, []);

  const checkUserData = async () => {
    try {
      // Fetch user_id from AsyncStorage
      const userId = await AsyncStorage.getItem("user_id");

      if (!userId) {
        // If user_id is not found in local storage, check the profile
        if (!profile?.user_id) {
          Alert.alert("Error", "Could not retrieve user information");
          navigation.goBack();
        }
      } else {
        // If user_id is found, use it
        console.log("User ID from local storage:", userId);
      }
    } catch (error) {
      console.log("Error checking user data:", error);
    }
  };

  const fetchUserAppointments = async () => {
    try {
      const appointmentsResponse =
        await appointmentService.getAppointmentHistory();
      const appointments = appointmentsResponse.data;
      setAppointments(appointments);
    } catch (error) {
      console.log("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to fetch appointment data. Please try again later."
      );
    }
  };

  const formatAppointmentDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderAppointmentOption = (appointment) => {
    const formattedDate = formatAppointmentDate(appointment.appointment_date);
    return `${appointment.appointment_number} - ${formattedDate} - ${appointment.doctor_name} (${appointment.doctor_specialization})`;
  };

  const validateInput = async () => {
    if (!selectedAppointment) {
      Alert.alert(
        "Error",
        "Please select an appointment to provide feedback for"
      );
      return false;
    }
    if (rating === 0) {
      Alert.alert("Error", "Please rate your experience");
      return false;
    }
    if (!comments.trim()) {
      Alert.alert("Error", "Please provide detailed feedback");
      return false;
    }

    // Fetch user_id from local storage if not available in profile
    const userId = profile?.user_id || (await AsyncStorage.getItem("user_id"));
    if (!userId) {
      Alert.alert("Error", "User information not found");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    try {
      setIsSubmitting(true);

      // Fetch user_id from local storage if not available in profile
      const userId =
        profile?.user_id || (await AsyncStorage.getItem("user_id"));

      if (!userId) {
        Alert.alert("Error", "User information not found");
        return;
      }

      const feedbackData = {
        user_id: parseInt(userId), // Use the fetched user_id
        rating,
        comments: comments.trim(),
        appointment_id: selectedAppointment,
      };

      await feedbackService.submitFeedback(feedbackData);

      Alert.alert(
        "Feedback Submitted",
        "Thank you for helping us improve our services!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log("Feedback submission error:", error);
      Alert.alert(
        "Submission Failed",
        "We couldn't submit your feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.headerTitle}>Your Feedback</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appointment Selection */}
        <View style={styles.feedbackSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="clipboard" size={20} color="#3f51b5" />
            </View>
            <Text style={styles.sectionTitle}>Select Appointment</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedAppointment}
              onValueChange={(itemValue) => setSelectedAppointment(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select an appointment" value={null} />
              {appointments.map((appointment) => (
                <Picker.Item
                  key={appointment.appointment_id}
                  label={renderAppointmentOption(appointment)}
                  value={appointment.appointment_id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.feedbackSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="star" size={20} color="#3f51b5" />
            </View>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          </View>
          <Text style={styles.ratingDescription}>
            How would you rate the quality of care and service provided?
          </Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={32}
                  color={star <= rating ? "#FFD700" : "#c5cae9"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0
              ? "Select your rating"
              : `${rating}/5 - ${
                  rating === 1
                    ? "Poor"
                    : rating === 2
                    ? "Fair"
                    : rating === 3
                    ? "Good"
                    : rating === 4
                    ? "Very Good"
                    : "Excellent"
                }`}
          </Text>
        </View>

        {/* Comments Section */}
        <View style={styles.feedbackSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="chatbox" size={20} color="#3f51b5" />
            </View>
            <Text style={styles.sectionTitle}>Your Comments</Text>
          </View>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Share your experience, suggestions, or areas for improvement..."
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={6}
              placeholderTextColor="#666"
              maxLength={500}
            />
          </View>
          <Text style={styles.characterCount}>
            {comments.length}/500 characters
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
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
  feedbackSection: {
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
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 8,
  },
  picker: {
    height: 50,
  },
  ratingDescription: {
    color: "#666",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: "center",
    color: "#1a237e",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  textAreaContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  textArea: {
    minHeight: 150,
    padding: 12,
    fontSize: 16,
    color: "#1a237e",
    textAlignVertical: "top",
  },
  characterCount: {
    textAlign: "right",
    color: "#666",
    fontSize: 12,
    marginTop: 8,
    marginRight: 4,
  },
  submitButton: {
    backgroundColor: "#3f51b5",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#c5cae9",
  },
});

export default SubmitFeedbackScreen;
