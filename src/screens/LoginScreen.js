import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // In LoginScreen.js
  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await login(email, password);

      if (response.requires_2fa) {
        navigation.navigate("Verify2FA", {
          email,
          ...(response.two_factor_details || {}),
        });
        return;
      }

      setShowWelcomeModal(true);
    } catch (error) {
      console.log("Login error:", error);

      const errorMessage = error.message || "An unexpected error occurred";

      if (errorMessage.includes("Invalid email or password")) {
        Alert.alert("Authentication Failed", "Invalid email or password");
      } else if (errorMessage.includes("User not found")) {
        Alert.alert("Account Not Found", "No account exists with this email");
      } else if (errorMessage.includes("Email is required")) {
        setErrors((prev) => ({ ...prev, email: "Email is required" }));
      } else if (errorMessage.includes("Password is required")) {
        setErrors((prev) => ({ ...prev, password: "Password is required" }));
      } else if (errorMessage.includes("Failed to process login")) {
        Alert.alert(
          "Server Error",
          "Unable to process login. Please try again"
        );
      } else {
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowWelcomeModal(false); // Close the modal
    navigation.replace("Home"); // Redirect to Home screen
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={["#4c669f", "#3b5998", "#192f6a"]}
          style={styles.header}
        >
          <Image
            source={require("../assets/icons/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>One-Health Portal</Text>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Email Input */}
          <View
            style={[styles.inputContainer, errors.email && styles.inputError]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: null }));
              }}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Input */}
          <View
            style={[
              styles.inputContainer,
              errors.password && styles.inputError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate("ResetPassword")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLinkText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Welcome Modal */}
      <Modal
        visible={showWelcomeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#4c669f", "#3b5998", "#192f6a"]}
              style={styles.modalBadge}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Welcome Back!</Text>
            <Text style={styles.modalSubtitle}>You're now logged in.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  appTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  welcomeText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF3B30",
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
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#3b5998",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#3b5998",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLinkText: {
    color: "#3b5998",
    fontWeight: "600",
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
});

export default LoginScreen;
