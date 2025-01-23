import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api.service";

const SecuritySettingsScreen = ({ navigation }) => {
  const [rememberDevice, setRememberDevice] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const { user, resetPassword, logout, profile } = useAuth();

  // Load 2FA status and remember device setting on component mount
  useEffect(() => {
    console.debug("Loading 2FA status and remember device setting...");
    loadRememberDevice();
    load2FAStatus();
  }, []);

  // Update 2FA status if profile changes
  useEffect(() => {
    if (profile) {
      console.debug(
        "Profile updated, syncing 2FA status:",
        profile.two_factor_enabled
      );
      setTwoFactorEnabled(profile.two_factor_enabled || false);
    }
  }, [profile]);

  // Load 2FA status from AsyncStorage
  const load2FAStatus = async () => {
    try {
      console.debug("Loading 2FA status from AsyncStorage...");
      const twoFactorEnabled2 = await AsyncStorage.getItem(
        "two_factor_enabled"
      );
      console.debug(
        "Retrieved 2FA status from AsyncStorage:",
        twoFactorEnabled2
      );

      if (twoFactorEnabled2 !== null) {
        console.debug("Setting 2FA state to:", twoFactorEnabled2 === "true");
        setTwoFactorEnabled(twoFactorEnabled2 === "true");
      } else {
        console.debug("No 2FA status found in AsyncStorage.");
      }
    } catch (error) {
      console.log("Error loading 2FA status:", error);
    }
  };

  // Load remember device setting from AsyncStorage
  const loadRememberDevice = async () => {
    try {
      console.debug("Loading remember device setting from AsyncStorage...");
      const remembered = await AsyncStorage.getItem("rememberDevice");
      console.debug("Retrieved remember device setting:", remembered);

      setRememberDevice(remembered === "true");
    } catch (error) {
      console.log("Error loading remember device setting:", error);
    }
  };

  // Handle remember device toggle
  const handleRememberDevice = async (value) => {
    try {
      console.debug("Updating remember device setting to:", value);
      setRememberDevice(value);
      await AsyncStorage.setItem("rememberDevice", value.toString());
      Alert.alert(
        "Setting Updated",
        value
          ? "Your device will remember your login"
          : "Your device will not remember your login"
      );
    } catch (error) {
      console.log("Error updating remember device setting:", error);
      Alert.alert("Error", "Failed to update device settings");
    }
  };

  // Handle 2FA toggle
  const handleToggle2FA = async (value) => {
    try {
      console.debug("Toggling 2FA to:", value);
      setTwoFactorLoading(true);
      await authService.toggleTwoFactor(value);
      setTwoFactorEnabled(value);

      // Update 2FA status in AsyncStorage
      console.debug("Updating 2FA status in AsyncStorage to:", value);
      await AsyncStorage.setItem("two_factor_enabled", value.toString());

      Alert.alert(
        "2FA Settings Updated",
        value
          ? "Two-factor authentication has been enabled"
          : "Two-factor authentication has been disabled"
      );
    } catch (error) {
      console.log("Error toggling 2FA:", error);
      Alert.alert("Error", error.message || "Failed to update 2FA settings");
      setTwoFactorEnabled(!value);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Handle password reset
  const handleChangePassword = async () => {
    if (!user?.email) {
      Alert.alert("Error", "Email address not found");
      return;
    }

    try {
      console.debug("Initiating password reset for:", user.email);
      setPasswordResetLoading(true);
      await resetPassword(user.email);
      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email."
      );
    } catch (error) {
      console.log("Error initiating password change:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send password reset email."
      );
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // Handle session end
  const handleEndSession = async () => {
    Alert.alert("End Session", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            console.debug("Ending session and logging out...");
            setLoading(true);
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.log("Error ending session:", error);
            Alert.alert("Error", "Failed to end session.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Loading state
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
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Two-Factor Authentication">
          <SettingsItem
            icon="shield-checkmark"
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            loading={twoFactorLoading}
            rightContent={
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggle2FA}
                trackColor={{ false: "#e0e0e0", true: "#3f51b5" }}
                thumbColor="#fff"
                ios_backgroundColor="#e0e0e0"
                disabled={twoFactorLoading}
              />
            }
          />
          {twoFactorEnabled && (
            <SettingsItem
              icon="mail"
              title="2FA Method"
              description="Currently using email verification"
              disabledText="Email"
            />
          )}
        </SettingsSection>

        <SettingsSection title="Password Management">
          <SettingsItem
            icon="lock-closed"
            title="Change Password"
            description="Reset or modify your account password"
            onPress={handleChangePassword}
            loading={passwordResetLoading}
            rightContent={
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection title="Session Settings">
          <SettingsItem
            icon="phone-portrait"
            title="Remember Device"
            description="Keep you logged in on this device"
            rightContent={
              <Switch
                value={rememberDevice}
                onValueChange={handleRememberDevice}
                trackColor={{ false: "#e0e0e0", true: "#3f51b5" }}
                thumbColor="#fff"
                ios_backgroundColor="#e0e0e0"
              />
            }
          />
          <SettingsItem
            icon="time"
            title="Auto Logout"
            description="Session timeout after inactivity"
            disabledText={`${timeoutMinutes} minutes`}
          />
        </SettingsSection>

        <SettingsSection title="Current Session">
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="laptop" size={20} color="#3f51b5" />
              </View>
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>Current Device</Text>
                <Text style={styles.settingsItemDescription}>
                  {new Date().toLocaleString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.endSessionButton}
              onPress={handleEndSession}
            >
              <Text style={styles.endSessionButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );
};

// Reusable SettingsSection component
const SettingsSection = ({ title, children }) => (
  <View style={styles.settingsSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// Reusable SettingsItem component
const SettingsItem = ({
  icon,
  title,
  description,
  onPress,
  rightContent,
  disabledText,
  loading = false,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={loading}
  >
    <View style={styles.settingsItemContent}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#3f51b5" />
      </View>
      <View style={styles.settingsItemText}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingsItemDescription}>{description}</Text>
        )}
      </View>
    </View>
    <View style={styles.settingsItemRight}>
      {disabledText && <Text style={styles.disabledText}>{disabledText}</Text>}
      {loading ? <ActivityIndicator color="#3f51b5" /> : rightContent}
    </View>
  </TouchableOpacity>
);

// Styles
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  settingsItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
    marginBottom: 4,
  },
  settingsItemDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledText: {
    fontSize: 14,
    color: "#666",
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
  },
  endSessionButton: {
    backgroundColor: "#ef5350",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  endSessionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SecuritySettingsScreen;
