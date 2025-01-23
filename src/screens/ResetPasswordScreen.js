import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext"; // Import useAuth

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const { resetPassword } = useAuth(); // Use the resetPassword function from AuthContext

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setIsEmailValid(validateEmail(text));
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Call the resetPassword function from AuthContext
      await resetPassword(email);

      Alert.alert(
        "Success",
        "Password reset email has been sent to your inbox.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

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
          <Image
            source={require("../assets/icons/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>One-Health Portal</Text>
          <Text style={styles.headerSubtitle}>Reset Your Password</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Forgot Your Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset
            your password.
          </Text>

          <View
            style={[
              styles.inputGroup,
              !isEmailValid && email.length > 0 && styles.inputError,
            ]}
          >
            <Ionicons
              name="mail"
              size={20}
              color={!isEmailValid && email.length > 0 ? "#FF3B30" : "#666"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {isEmailValid && email.length > 0 && (
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            )}
          </View>

          {!isEmailValid && email.length > 0 && (
            <Text style={styles.errorText}>
              Please enter a valid email address
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.resetButton,
              (loading || !email || !isEmailValid) && styles.buttonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={loading || !email || !isEmailValid}
          >
            <Text style={styles.resetButtonText}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Ionicons name="arrow-back" size={20} color="#3b5998" />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 20,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
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
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: "#3b5998",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backToLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 10,
  },
  backToLoginText: {
    color: "#3b5998",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
});

export default ResetPasswordScreen;
