import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/context/AuthContext";
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import AppointmentScreen from "./src/screens/AppointmentScreen";
import AppointmentBookingScreen from "./src/screens/AppointmentBookingScreen";
import AppointmentPaymentScreen from "./src/screens/AppointmentPaymentScreen";
import ManageBookingsScreen from "./src/screens/ManageBookingsScreen";
import LabTestsScreen from "./src/screens/LabTestsScreen";
import LabTestBookingScreen from "./src/screens/LabTestBookingScreen";
import LabTestPaymentScreen from "./src/screens/LabTestPaymentScreen";
import UpcomingLabTestsScreen from "./src/screens/UpcomingLabTestsScreen";
import NearbyHospitalsScreen from "./src/screens/NearbyHospitalsScreen";
import ProfileManagementScreen from "./src/screens/ProfileManagementScreen";
import SecuritySettingsScreen from "./src/screens/SecuritySettingsScreen";
import AppointmentHistoryScreen from "./src/screens/AppointmentHistoryScreen";
import LabTestHistoryScreen from "./src/screens/LabTestHistoryScreen";
import SubmitFeedbackScreen from "./src/screens/SubmitFeedbackScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import LabTestDetailsScreen from "./src/screens/LabTestDetailsScreen";
import HelpCenterScreen from "./src/screens/HelpCenterScreen";
import AboutOneHealthScreen from "./src/screens/AboutOneHealthScreen";
import SymptomCheckerScreen from "./src/screens/SymptomCheckerScreen";
import Verify2FAScreen from "./src/screens/Verify2FAScreen";
import TermsScreen from "./src/screens/TermsScreen";
import PrivacyPolicyScreen from "./src/screens/PrivacyPolicyScreen";
import Toast from "react-native-toast-message";
import { View, Text } from "react-native";

const Stack = createNativeStackNavigator();

// Toast configuration
const toastConfig = {
  success: ({ text1, text2 }) => (
    <View
      style={{
        backgroundColor: "green",
        padding: 15,
        borderRadius: 10,
        width: "90%",
        alignSelf: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>{text1}</Text>
      <Text style={{ color: "white" }}>{text2}</Text>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View
      style={{
        backgroundColor: "red",
        padding: 15,
        borderRadius: 10,
        width: "90%",
        alignSelf: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>{text1}</Text>
      <Text style={{ color: "white" }}>{text2}</Text>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View
      style={{
        backgroundColor: "blue",
        padding: 15,
        borderRadius: 10,
        width: "90%",
        alignSelf: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>{text1}</Text>
      <Text style={{ color: "white" }}>{text2}</Text>
    </View>
  ),
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{
              presentation: "modal",
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyPolicyScreen}
            options={{
              presentation: "modal",
              animationEnabled: true,
            }}
          />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Appointment" component={AppointmentScreen} />
          <Stack.Screen
            name="AppointmentBooking"
            component={AppointmentBookingScreen}
          />
          <Stack.Screen
            name="AppointmentPayment"
            component={AppointmentPaymentScreen}
          />
          <Stack.Screen
            name="ManageBookings"
            component={ManageBookingsScreen}
          />
          <Stack.Screen name="LabTests" component={LabTestsScreen} />
          <Stack.Screen
            name="LabTestBooking"
            component={LabTestBookingScreen}
          />
          <Stack.Screen
            name="LabTestPaymentScreen" // Ensure this matches the name used in navigation.navigate
            component={LabTestPaymentScreen}
          />
          <Stack.Screen
            name="UpcomingLabTests"
            component={UpcomingLabTestsScreen}
          />
          <Stack.Screen
            name="NearbyHospitals"
            component={NearbyHospitalsScreen}
          />
          <Stack.Screen
            name="ProfileManagement"
            component={ProfileManagementScreen}
          />
          <Stack.Screen
            name="SecuritySettings"
            component={SecuritySettingsScreen}
          />
          <Stack.Screen
            name="AppointmentHistory"
            component={AppointmentHistoryScreen}
          />
          <Stack.Screen
            name="LabTestHistory"
            component={LabTestHistoryScreen}
          />
          <Stack.Screen
            name="SubmitFeedback"
            component={SubmitFeedbackScreen}
          />

          <Stack.Screen name="Verify2FA" component={Verify2FAScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen
            name="LabTestDetails"
            component={LabTestDetailsScreen}
            options={{ title: "Lab Test Details" }}
          />
          <Stack.Screen
            name="SymptomChecker"
            component={SymptomCheckerScreen}
          />

          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{ title: "Help Center" }}
          />
          <Stack.Screen
            name="AboutOneHealth"
            component={AboutOneHealthScreen}
            options={{ title: "About One-Health" }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Add Toast component with custom config */}
      <Toast config={toastConfig} />
    </AuthProvider>
  );
};

export default App;
