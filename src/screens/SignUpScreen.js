import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

const SuccessModal = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <LinearGradient
          colors={["#4c669f", "#3b5998", "#192f6a"]}
          style={styles.modalBadge}
        >
          <Ionicons name="checkmark" size={48} color="#fff" />
        </LinearGradient>
        <Text style={styles.modalTitle}>Account Created!</Text>
        <Text style={styles.modalSubtitle}>
          Your account has been successfully registered
        </Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Proceed to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const SignUpScreen = ({ navigation }) => {
  const { register } = useAuth();

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
    termsAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const titles = ["Mr.", "Ms.", "Master."];

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (text) => {
    setFormData({ ...formData, password: text });
    setPasswordStrength(checkPasswordStrength(text));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!formData.termsAccepted) {
      Alert.alert(
        "Error",
        "Please accept the Terms of Service and Privacy Policy"
      );
      return false;
    }

    if (!formData.firstName || !formData.lastName) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const registrationData = {
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        id_type: formData.idType,
        nic_passport: formData.idNumber,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: "Patient",
      };

      const response = await register(registrationData);

      if (response?.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      let errorMessage = "Failed to create account";

      if (error.message?.toLowerCase().includes("email")) {
        errorMessage = "This email is already registered";
      } else if (error.message?.toLowerCase().includes("password")) {
        errorMessage =
          "Password is too weak. Please choose a stronger password";
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const TermsAndConditions = () => (
    <View style={styles.termsContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() =>
          setFormData({ ...formData, termsAccepted: !formData.termsAccepted })
        }
      >
        <View
          style={[
            styles.checkboxInner,
            formData.termsAccepted && styles.checkboxChecked,
          ]}
        >
          {formData.termsAccepted && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.termsTextContainer}>
        <Text style={styles.termsText}>I agree to the </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Terms")}>
          <Text style={styles.termsLinkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}> and </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Privacy")}>
          <Text style={styles.termsLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#4c669f", "#3b5998", "#192f6a"]}
          style={styles.headerBackground}
        >
          <Text style={styles.appTitle}>One-Health Portal</Text>
          <Text style={styles.headerSubtitle}>Create Your Account</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Title Dropdown */}
          <TouchableOpacity
            style={styles.inputGroup}
            onPress={() => setShowTitleDropdown(!showTitleDropdown)}
          >
            <Ionicons
              name="person"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <Text style={styles.inputText}>{formData.title}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {showTitleDropdown && (
            <View style={styles.dropdownList}>
              {titles.map((title) => (
                <TouchableOpacity
                  key={title}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, title });
                    setShowTitleDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Name Inputs */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="person"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons
              name="person"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
            />
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="call"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          {/* ID Type Selection */}
          <View style={styles.idTypeContainer}>
            <TouchableOpacity
              style={[
                styles.idTypeButton,
                formData.idType === "NIC" && styles.selectedIdType,
              ]}
              onPress={() => setFormData({ ...formData, idType: "NIC" })}
            >
              <Text
                style={
                  formData.idType === "NIC"
                    ? styles.selectedIdTypeText
                    : styles.idTypeText
                }
              >
                NIC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.idTypeButton,
                formData.idType === "Passport" && styles.selectedIdType,
              ]}
              onPress={() => setFormData({ ...formData, idType: "Passport" })}
            >
              <Text
                style={
                  formData.idType === "Passport"
                    ? styles.selectedIdTypeText
                    : styles.idTypeText
                }
              >
                Passport
              </Text>
            </TouchableOpacity>
          </View>

          {/* ID Number Input */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="card"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={`${formData.idType} Number`}
              value={formData.idNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, idNumber: text })
              }
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="mail"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={handlePasswordChange}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Meter */}
          <View style={styles.strengthMeterContainer}>
            <View
              style={[
                styles.strengthMeterBar,
                {
                  width: `${(passwordStrength / 4) * 100}%`,
                  backgroundColor:
                    passwordStrength === 0
                      ? "#FF3B30"
                      : passwordStrength <= 2
                      ? "#FFCC00"
                      : "#4CD964",
                },
              ]}
            />
          </View>
          <Text style={styles.strengthText}>
            {passwordStrength === 0
              ? "Weak"
              : passwordStrength <= 2
              ? "Medium"
              : "Strong"}
          </Text>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <TermsAndConditions />

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (loading ||
                !formData.email ||
                !formData.password ||
                !formData.termsAccepted) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={
              loading ||
              !formData.email ||
              !formData.password ||
              !formData.termsAccepted
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signUpText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.signUpLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigation.replace("Login");
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerBackground: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    marginTop: -30,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  dropdownList: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 20,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  idTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  idTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 5,
    alignItems: "center",
  },
  selectedIdType: {
    backgroundColor: "#3b5998",
  },
  idTypeText: {
    color: "#666",
    fontWeight: "600",
  },
  selectedIdTypeText: {
    color: "#fff",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#3b5998",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  signUpText: {
    color: "#666",
  },
  signUpLinkText: {
    color: "#3b5998",
    fontWeight: "700",
  },
  successBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  strengthMeterContainer: {
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginBottom: 10,
    overflow: "hidden",
  },
  strengthMeterBar: {
    height: "100%",
    borderRadius: 5,
  },
  strengthText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },
  modalBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitle: {
    color: "#666",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#3b5998",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // New styles for Terms and Conditions
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 3,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#3b5998",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#3b5998",
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  termsText: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  termsLinkText: {
    color: "#3b5998",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    lineHeight: 20,
  },
});

export default SignUpScreen;
