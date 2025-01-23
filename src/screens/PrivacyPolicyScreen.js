// PrivacyPolicyScreen.js
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

const PrivacyPolicyScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>One-Health-Portal</Text>
      </LinearGradient>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Effective Date: 27/12/2024</Text>
        <Text style={styles.introText}>
          Welcome to the One-Health-Portal. The following policies outline the
          terms under which we operate and ensure the security, privacy, and
          ethical management of user data. We are committed to maintaining the
          highest standards of compliance, particularly in adherence to the
          Health Insurance Portability and Accountability Act (HIPAA) and
          relevant Sri Lankan regulations.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Privacy Policy</Text>
          <Text style={styles.sectionText}>
            At One-Health-Portal, safeguarding your Personal Health Information
            (PHI) is our top priority.
          </Text>

          <Text style={styles.subSectionTitle}>1.1 Data Collection</Text>
          <Text style={styles.sectionText}>
            We collect and process the following data to provide essential
            healthcare services:{"\n\n"}• Personal information: Name, contact
            details, demographic information.{"\n"}• Health-related information:
            Symptoms, appointment details, and specialist preferences.{"\n"}•
            Usage data: Information collected through app interactions to
            enhance functionality and user experience.
          </Text>

          <Text style={styles.subSectionTitle}>1.2 Purpose of Data Use</Text>
          <Text style={styles.sectionText}>
            Your data is used solely to provide and improve the services within
            the app, including:{"\n\n"}• Symptom analysis and recommendations.
            {"\n"}• Scheduling appointments with healthcare providers.{"\n"}•
            Sending notifications, reminders, and service updates.
          </Text>

          <Text style={styles.subSectionTitle}>1.3 Data Sharing</Text>
          <Text style={styles.sectionText}>
            We do not share your PHI with third parties unless:{"\n\n"}•
            Required by law.{"\n"}• Necessary for service provision (e.g.,
            sharing appointment details with healthcare providers).{"\n"}•
            Explicitly authorized by you.
          </Text>

          <Text style={styles.subSectionTitle}>1.4 Data Security</Text>
          <Text style={styles.sectionText}>
            All PHI is encrypted using industry-standard algorithms (SHA-256)
            and stored on HIPAA-compliant servers. Access to sensitive data is
            restricted to authorized personnel only.
          </Text>

          <Text style={styles.subSectionTitle}>1.5 User Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:{"\n\n"}• Access, review, and update your
            personal information.{"\n"}• Request the deletion of your data,
            subject to legal retention requirements.{"\n"}• Withdraw consent for
            data processing at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Security Policy</Text>
          <Text style={styles.sectionText}>
            We employ robust security measures to protect user information
            against unauthorized access, disclosure, and breaches.
          </Text>

          <Text style={styles.subSectionTitle}>
            2.1 Authentication and Access Control
          </Text>
          <Text style={styles.sectionText}>
            • Multi-Factor Authentication (MFA) ensures secure login.{"\n"}•
            Role-Based Access Control (RBAC) limits access based on user roles
            (e.g., patient, doctor, administrator).
          </Text>

          <Text style={styles.subSectionTitle}>2.2 Session Management</Text>
          <Text style={styles.sectionText}>
            • Automatic logout is enforced after 15 minutes of inactivity to
            prevent unauthorized access.
          </Text>

          <Text style={styles.subSectionTitle}>2.3 Data Encryption</Text>
          <Text style={styles.sectionText}>
            • All data transmitted between users and our servers is encrypted
            using TLS.{"\n"}• Sensitive data at rest is secured using advanced
            encryption standards.
          </Text>

          <Text style={styles.subSectionTitle}>2.4 Incident Response</Text>
          <Text style={styles.sectionText}>
            • In the event of a data breach, we will notify affected users and
            relevant authorities within 72 hours, detailing the nature of the
            breach and mitigation steps.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Acceptable Use Policy</Text>
          <Text style={styles.subSectionTitle}>3.1 Prohibited Activities</Text>
          <Text style={styles.sectionText}>
            • Do not attempt to access unauthorized features or data.{"\n"}• Do
            not upload malicious files or engage in activities that could
            compromise system security.
          </Text>

          <Text style={styles.subSectionTitle}>
            3.2 Account Responsibilities
          </Text>
          <Text style={styles.sectionText}>
            • You are responsible for maintaining the confidentiality of your
            login credentials.{"\n"}• Notify us immediately if you suspect
            unauthorized access to your account.
          </Text>

          <Text style={styles.subSectionTitle}>
            3.3 Accuracy of Information
          </Text>
          <Text style={styles.sectionText}>
            • Users are required to provide accurate and up-to-date information
            during registration and use of the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Compliance Policy</Text>
          <Text style={styles.sectionText}>
            One-Health-Portal operates in full compliance with:{"\n\n"}• HIPAA
            Regulations: Ensuring secure handling of PHI.{"\n"}• Sri Lankan Data
            Protection Act: Protecting user data under local laws and standards.
            {"\n"}• ISO/IEC 27001: Adhering to the globally recognized standard
            for Information Security Management Systems (ISMS).{"\n"}• ISO/IEC
            27002: Following best practices and guidelines for implementing and
            maintaining controls.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Retention Policy</Text>
          <Text style={styles.sectionText}>
            We retain user data only for as long as it is necessary to provide
            services or comply with legal obligations. Upon account
            deactivation, data is either anonymized or securely deleted, except
            where retention is required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. Feedback and Dispute Resolution
          </Text>
          <Text style={styles.sectionText}>
            • We value your feedback and are committed to resolving disputes
            promptly and professionally.{"\n"}• For feedback or complaints,
            please use the in-app feedback form or contact us directly.{"\n"}•
            Disputes will be addressed in compliance with local and
            international regulations, ensuring fair and transparent resolution.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Modifications to Policies</Text>
          <Text style={styles.sectionText}>
            These policies may be updated to reflect changes in legal
            requirements, technology, or app functionality. Users will be
            notified of updates, and continued use of the app constitutes
            acceptance of the revised policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have questions about our policies or wish to exercise your
            data rights, please contact us:{"\n\n"}
            Email: <Text style={styles.link}>onehealthportal@gmail.com</Text>
          </Text>
        </View>

        <Text style={styles.footerText}>
          By continuing to use One-Health-Portal, you acknowledge and agree to
          these privacy policies and data protection measures.
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
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

export default PrivacyPolicyScreen;
