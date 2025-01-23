import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const Verify2FAScreen = ({ route, navigation }) => {
  const { verify2FA } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showWelcomeModal, setShowWelcomeModal] = useState(false); // State for welcome modal
  const { email } = route.params;

  // Create refs for each input field
  const inputs = useRef([]);

  // Function to focus next input
  const focusNext = (index) => {
    if (index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  // Function to focus previous input
  const focusPrev = (index) => {
    if (index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const token = code.join("");
    if (token.length !== 6) {
      setErrors({ code: "Please enter all 6 digits" });
      return;
    }

    try {
      setLoading(true);
      const response = await verify2FA(email, token);

      if (response && response.session && response.user) {
        setShowWelcomeModal(true); // Show welcome modal on successful verification
      } else {
        throw new Error("Invalid 2FA verification response");
      }
    } catch (error) {
      Alert.alert("Verification Failed", error.message);
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
          <Text style={styles.welcomeText}>Two-Factor Authentication</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.verificationText}>
            Please enter the 6-digit verification code sent to your email
          </Text>

          <View style={styles.codeContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={[styles.codeInput, errors.code && styles.inputError]}
                maxLength={1}
                keyboardType="numeric"
                value={code[index]}
                onChangeText={(text) => {
                  const newCode = [...code];
                  newCode[index] = text;
                  setCode(newCode);
                  setErrors({});
                  if (text) {
                    focusNext(index);
                  }
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && !code[index]) {
                    focusPrev(index);
                  }
                }}
              />
            ))}
          </View>
          {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabledButton]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
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
  verificationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 10,
  },
  codeInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#3b5998",
    borderRadius: 10,
    fontSize: 24,
    textAlign: "center",
    backgroundColor: "#f5f5f5",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -20,
    marginBottom: 10,
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#3b5998",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  verifyButtonText: {
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

export default Verify2FAScreen;
