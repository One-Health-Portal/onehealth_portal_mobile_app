import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start the animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Set a timer to navigate to the Login screen after the splash screen
    const timer = setTimeout(() => {
      navigation.replace("Login"); // Always navigate to the Login screen
    }, 2000); // Wait for 2 seconds before navigating

    // Clean up the timer
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        <Image
          source={require("../assets/icons/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>One-Health Portal</Text>
      </Animated.View>
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
