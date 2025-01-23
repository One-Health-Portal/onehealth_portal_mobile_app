import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const SettingsScreen = ({ navigation }) => {
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const SettingsSection = ({ title, children }) => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingsItem = ({
    icon,
    title,
    description,
    onPress,
    rightContent,
    disabledText,
  }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
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
        {disabledText && (
          <Text style={styles.disabledText}>{disabledText}</Text>
        )}
        {rightContent}
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Notifications">
          <SettingsItem
            icon="notifications"
            title="Appointment Reminders"
            description="Stay updated with your upcoming medical appointments"
            rightContent={
              <Switch
                value={appointmentReminders}
                onValueChange={setAppointmentReminders}
                trackColor={{ false: "#e0e0e0", true: "#3f51b5" }}
                thumbColor="#fff"
                ios_backgroundColor="#e0e0e0"
              />
            }
          />
          <SettingsItem
            icon="mail"
            title="Email Notifications"
            description="Receive important updates and confirmations"
            rightContent={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#e0e0e0", true: "#3f51b5" }}
                thumbColor="#fff"
                ios_backgroundColor="#e0e0e0"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Language & Region">
          <SettingsItem
            icon="globe"
            title="Language"
            description="Select your preferred language"
            disabledText="English (Default)"
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsItem
            icon="shield"
            title="Security Settings"
            description="Manage your account security"
            onPress={() => navigation.navigate("SecuritySettings")}
            rightContent={
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection title="Help & Support">
          <SettingsItem
            icon="help-circle"
            title="Help Center"
            description="Get assistance and answers to your questions"
            onPress={() => navigation.navigate("HelpCenter")}
            rightContent={
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
              </View>
            }
          />
          <SettingsItem
            icon="information-circle"
            title="About One-Health"
            description="Learn more about our healthcare platform"
            onPress={() => navigation.navigate("AboutOneHealth")}
            rightContent={
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
              </View>
            }
          />
        </SettingsSection>
      </ScrollView>
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
});

export default SettingsScreen;
