import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const AboutOneHealthScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About One-Health</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aboutContent}>
          <Text style={styles.aboutTitle}>
            Revolutionizing Healthcare with One-Health
          </Text>
          <Text style={styles.aboutText}>
            One-Health is a comprehensive healthcare platform designed to
            streamline and improve the patient experience. Our mission is to
            provide accessible, high-quality healthcare services to the
            communities we serve.
          </Text>
          <Text style={styles.aboutText}>
            Our team of healthcare professionals and technology experts work
            tirelessly to develop innovative solutions that empower our users to
            take control of their health and wellness. From appointment
            scheduling to telemedicine consultations, our platform offers a
            seamless and personalized healthcare experience.
          </Text>
          <Text style={styles.aboutText}>
            We believe that healthcare should be convenient, affordable, and
            patient-centric. That's why we're constantly evolving and improving
            our services to better meet the needs of our users. By integrating
            the latest advancements in medical technology and data-driven
            decision-making, we're revolutionizing the way people access and
            manage their healthcare.
          </Text>
          <Text style={styles.aboutText}>
            At One-Health, we're driven by a passion for improving lives and
            creating a healthier future for all. Join us on this journey as we
            redefine the healthcare landscape and empower you to live your best
            life.
          </Text>
        </View>
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
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  aboutContent: {
    padding: 20,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b5998",
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default AboutOneHealthScreen;
