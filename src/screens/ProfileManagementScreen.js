import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_CONFIG, getAuthHeader } from "../config/api.config";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");
const titles = ["Mr.", "Ms.", "Dr.", "Prof."];

const ProfileManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "Mr.",
    firstName: "",
    lastName: "",
    phone: "",
    idType: "NIC",
    idNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_picture_url: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access your photos"
      );
    }
  };

  const loadProfile = async () => {
    try {
      const backendToken = await AsyncStorage.getItem("auth_token");
      console.log("Token retrieved from AsyncStorage:", backendToken); // Log the token

      // Fetch current user profile using API_CONFIG
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.PROFILE}`,
        {
          headers: getAuthHeader(backendToken),
        }
      );

      const profileData = response.data;

      // Update form data with fetched profile
      setFormData({
        title: profileData.title || "Mr.",
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        phone: profileData.phone || "",
        idType: profileData.id_type || "NIC",
        idNumber: profileData.nic_passport || "",
        email: profileData.email || "",
        password: "",
        confirmPassword: "",
        profile_picture_url: profileData.profile_picture_url || null,
      });

      // Set profile image if it exists
      if (profileData.profile_picture_url) {
        setProfileImage(profileData.profile_picture_url);
      }

      // Store profile data in AsyncStorage
      await AsyncStorage.setItem(
        "user_profile",
        JSON.stringify({
          title: profileData.title,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          phone: profileData.phone,
          idType: profileData.id_type,
          idNumber: profileData.nic_passport,
          email: profileData.email,
          profile_picture_url: profileData.profile_picture_url,
        })
      );
    } catch (error) {
      console.log("Error loading profile:", error);
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
      } else {
        Alert.alert("Error", "Failed to load profile data. Please try again.");
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      setUploading(true);
      const backendToken = await AsyncStorage.getItem("auth_token");

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile-image.jpg",
      });

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/upload/user/profile-picture`,
        formData,
        {
          headers: {
            ...getAuthHeader(backendToken),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.url) {
        setProfileImage(response.data.url);
        setFormData((prev) => ({
          ...prev,
          profile_picture_url: response.data.url,
        }));
        Alert.alert("Success", "Profile picture updated successfully");
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to upload profile picture"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleTitleSelect = (selectedTitle) => {
    setFormData({ ...formData, title: selectedTitle });
    setShowTitleDropdown(false);
  };

  const validateForm = () => {
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return false;
    }
    if (formData.password && formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const backendToken = await AsyncStorage.getItem("auth_token");
      console.log("Token retrieved from AsyncStorage:", backendToken);

      const profileData = {
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        id_type: formData.idType,
        nic_passport: formData.idNumber,
        email: formData.email,
        profile_picture_url: formData.profile_picture_url,
      };

      // Update backend database using API_CONFIG
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.UPDATE_PROFILE}`,
        profileData,
        {
          headers: getAuthHeader(backendToken),
        }
      );

      // Update local storage
      await AsyncStorage.setItem("user_profile", JSON.stringify(profileData));

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated. Please log in again.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch (error) {
      console.log("Profile update error:", error);
      Alert.alert(
        "Update Failed",
        error.response?.data?.detail || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5998" />
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
          <Text style={styles.headerTitle}>Profile Management</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.mainContent}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImage}>
                <Ionicons name="person" size={40} color="#3b5998" />
              </View>
            )}
            {uploading ? (
              <ActivityIndicator
                size="small"
                color="#3b5998"
                style={styles.uploadIndicator}
              />
            ) : (
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
            <Text style={styles.userName}>
              {`${formData.firstName} ${formData.lastName}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowTitleDropdown(true)}
            >
              <Text style={styles.pickerText}>{formData.title}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
            />

            <TextInput
              style={styles.textInput}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
            />

            <TextInput
              style={styles.textInput}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <View style={styles.idTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.idTypeButton,
                  formData.idType === "NIC" && styles.idTypeSelected,
                ]}
                onPress={() => setFormData({ ...formData, idType: "NIC" })}
              >
                <Text
                  style={[
                    styles.idTypeText,
                    formData.idType === "NIC" && styles.idTypeTextSelected,
                  ]}
                >
                  NIC
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.idTypeButton,
                  formData.idType === "Passport" && styles.idTypeSelected,
                ]}
                onPress={() => setFormData({ ...formData, idType: "Passport" })}
              >
                <Text
                  style={[
                    styles.idTypeText,
                    formData.idType === "Passport" && styles.idTypeTextSelected,
                  ]}
                >
                  Passport
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder={`${formData.idType} Number`}
              value={formData.idNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, idNumber: text })
              }
            />

            <TextInput
              style={styles.textInput}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
            />

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="New Password (Optional)"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, confirmPassword: text })
                }
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              8-12 characters including number, capital letter, simple letter
              and special character
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveChanges}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showTitleDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTitleDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTitleDropdown(false)}
        >
          <View style={styles.modalContent}>
            {titles.map((title) => (
              <TouchableOpacity
                key={title}
                style={styles.modalOption}
                onPress={() => handleTitleSelect(title)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    formData.title === title && styles.selectedModalOptionText,
                  ]}
                >
                  {title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  mainContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    color: "#3f51b5",
    fontSize: 16,
  },
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  editIconContainer: {
    position: "absolute",
    right: -5,
    bottom: 25,
    backgroundColor: "#3f51b5",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadIndicator: {
    position: "absolute",
    right: 0,
    bottom: 30,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  pickerInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  pickerText: {
    fontSize: 16,
    color: "#1a237e",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1a237e",
    backgroundColor: "#fff",
  },
  passwordInputContainer: {
    position: "relative",
  },
  eyeIconContainer: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  idTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  idTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  idTypeSelected: {
    backgroundColor: "#3f51b5",
  },
  idTypeText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  idTypeTextSelected: {
    color: "#fff",
  },
  passwordHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: "#3f51b5",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
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
    borderRadius: 16,
    width: "80%",
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#1a237e",
    textAlign: "center",
  },
  selectedModalOptionText: {
    fontWeight: "600",
    color: "#3f51b5",
  },
});

export default ProfileManagementScreen;
