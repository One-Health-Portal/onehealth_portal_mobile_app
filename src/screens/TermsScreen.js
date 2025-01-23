// TermsScreen.js
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const TermsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.headerBackground}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
        <Text style={styles.headerSubtitle}>
          One-Health-Portal Healthcare App
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: 26/12/2024</Text>
        <Text style={styles.introText}>
          Welcome to the One-Health-Portal. Please read these Terms and
          Conditions carefully before using the app. By accessing or using the
          app, you agree to be bound by these Terms.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.sectionText}>
            The One-Health-Portal is a healthcare application designed to
            provide users with AI-powered symptom checking, appointment
            scheduling, lab test bookings, and a nearby hospital locator. This
            app is intended for use within Sri Lanka and complies with relevant
            healthcare privacy and data protection laws, including the U.S.
            HIPAA standards where applicable for secure data handling.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.sectionText}>
            • You must be 18 years or older to use this app. Minors may use the
            app with parental or guardian supervision.{"\n"}• By using this app,
            you confirm that the information provided during registration is
            accurate and truthful.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Privacy and Data Protection
          </Text>
          <Text style={styles.sectionText}>
            • All personal health information (PHI) collected through the app is
            securely processed and stored in compliance with HIPAA standards and
            Sri Lankan data protection laws.{"\n"}• Data encryption (SHA-256) is
            implemented to protect sensitive user information.{"\n"}•
            Multi-factor authentication (MFA) is required to secure user
            accounts.{"\n"}• The app enforces strong password policies to ensure
            account security.{"\n"}• Inactive sessions will automatically log
            out after a set period to protect user privacy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.sectionText}>
            • Users are responsible for maintaining the confidentiality of their
            login credentials.{"\n"}• Users must not share or misuse their
            accounts.{"\n"}• You agree to use the app for personal healthcare
            management purposes only and not for any illegal or unauthorized
            activities.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Scope of Services</Text>
          <Text style={styles.sectionText}>
            The app provides the following services:{"\n\n"}• Symptom Checker:
            AI-powered suggestions based on user-input symptoms. Note: This
            feature is not a substitute for professional medical advice,
            diagnosis, or treatment.{"\n"}• Appointment Scheduling: Book and
            manage appointments with healthcare providers.{"\n"}• Lab Test
            Booking: Schedule tests based on availability.{"\n"}• Emergency
            Locator: Search for nearby hospitals in case of an emergency.
            {"\n\n"}
            The app does not provide:{"\n\n"}• Telemedicine or video
            consultations.{"\n"}• Health insurance claim processing.{"\n"}•
            Advanced diagnostics or real-time health monitoring.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Security Measures</Text>
          <Text style={styles.sectionText}>
            • Role-Based Access Control (RBAC) ensures that only authorized
            personnel can access specific features and sensitive data.{"\n"}•
            All data exchanges occur over secure protocols (HTTPS).{"\n"}• Data
            breach notifications will be promptly communicated to affected users
            as per applicable laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            • The app and its features are provided on an "as-is" and
            "as-available" basis.{"\n"}• The app developers are not liable for
            any harm, injury, or damage resulting from the use of the app.{"\n"}
            • Users should consult a licensed healthcare provider for medical
            advice and not rely solely on the app's recommendations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. User Feedback</Text>
          <Text style={styles.sectionText}>
            • The app includes a feedback feature for users to provide
            suggestions and comments.{"\n"}• By submitting feedback, you grant
            the app developers the right to use your suggestions to improve the
            service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Termination</Text>
          <Text style={styles.sectionText}>
            • Users may terminate their accounts at any time through the app.
            {"\n"}• The app developers reserve the right to suspend or terminate
            accounts for violations of these Terms or misuse of the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.sectionText}>
            • These Terms are governed by the laws of Sri Lanka.{"\n"}• Any
            disputes arising from the use of this app will be resolved under the
            jurisdiction of Sri Lankan courts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Modifications</Text>
          <Text style={styles.sectionText}>
            • The app developers reserve the right to update or modify these
            Terms at any time.{"\n"}• Users will be notified of significant
            changes through email or app notifications.
          </Text>
        </View>

        <Text style={styles.footerText}>
          By using the One-Health-Portal, you agree to these Terms and
          Conditions. For questions or concerns, please contact our support team
          at <Text style={styles.link}>onehealthportal@gmail.com</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerBackground: {
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
    opacity: 0.9,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 20,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentInner: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  introText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "justify",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "justify",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
    lineHeight: 20,
  },
  link: {
    color: "#3b5998",
    textDecorationLine: "underline",
  },
});

export default TermsScreen;
