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

const HelpCenterScreen = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Help Center</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.helpCenterContent}>
          <Text style={styles.helpCenterTitle}>
            Welcome to the One-Health Help Center
          </Text>
          <Text style={styles.helpCenterText}>
            Here you can find answers to your questions and get assistance with
            using our comprehensive healthcare platform. Our team is dedicated
            to providing you with the support you need to manage your health and
            wellness effectively.
          </Text>
          <Text style={styles.helpCenterText}>
            Browse through the different topics in the menu below, or use the
            search function to find information on specific issues. If you can't
            find what you're looking for, feel free to reach out to our customer
            support team for personalized assistance.
          </Text>
          <Text style={styles.helpCenterText}>
            We're here to help you navigate your healthcare journey with ease
            and confidence. Let us know how we can best support you!
          </Text>
          {/* Add help center content categories and search functionality here */}
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
  helpCenterContent: {
    padding: 20,
  },
  helpCenterTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b5998",
    marginBottom: 10,
  },
  helpCenterText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default HelpCenterScreen;
