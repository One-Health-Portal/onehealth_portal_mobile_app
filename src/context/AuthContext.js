import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, userService } from "../services/api.service";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    console.log("Initializing auth context");
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if we have a cached auth token
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        // Fetch user profile from the backend
        const profileData = await userService.getProfile();
        if (profileData) {
          // Retrieve user_id from AsyncStorage
          const userId = await AsyncStorage.getItem("user_id");

          // Set minimal user data including user_id
          setUser({
            email: profileData.email,
            user_id: userId, // Include user_id
          });

          setProfile(profileData);
          await AsyncStorage.setItem(
            "user_profile",
            JSON.stringify(profileData)
          );
        }
      }
    } catch (error) {
      console.log("Auth initialization error:", error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    setUser(null);
    setProfile(null);
    await AsyncStorage.multiRemove([
      "auth_token",
      "user_profile",
      "user_id",
      "first_name",
      "email",
      "phone",
      "role",
    ]);
  };

  const register = async (userData) => {
    try {
      setLoading(true);

      // Use the backend's register endpoint
      const response = await authService.register(userData);

      return {
        success: true,
        message: "Registration successful. Please log in.",
      };
    } catch (error) {
      console.log("Registration error:", error);
      if (error.message?.includes("already exists")) {
        throw new Error("This email is already registered");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const set2FAStatus = async (enabled) => {
    try {
      await AsyncStorage.setItem("two_factor_enabled", enabled.toString());
    } catch (error) {
      console.log("Error saving 2FA status:", error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.debug("Attempting to log in with backend...");

      // Use the backend's login endpoint
      const response = await authService.login(email, password);

      // Check if two-factor authentication is required
      if (response.requires_2fa || response.two_factor_required) {
        return {
          requires_2fa: true,
          email: email, // Use the provided email
          message: response.message || "Two-factor authentication required",
        };
      }

      // Validate the login response
      if (
        !response?.session?.access_token ||
        !response?.user ||
        !response?.user_id
      ) {
        throw new Error("Invalid login response");
      }

      // Store the auth token and user_id
      console.log(
        "Saving auth token to local storage:",
        response.session.access_token
      );
      await AsyncStorage.setItem("auth_token", response.session.access_token);

      // Ensure user_id is converted to string and handle potential undefined
      const userId = response.user_id?.toString() || "";
      await AsyncStorage.setItem("user_id", userId);

      // Print user_id and 2FA status to the console
      console.log("User ID saved to local storage:", userId);

      // Set user and profile
      const userData = {
        email: response.user.email,
        user_id: userId, // Include user_id in the user object
      };

      setUser(userData);
      setProfile(response.user);
      await AsyncStorage.setItem("user_profile", JSON.stringify(response.user));

      console.debug("Backend login successful:", response);

      return response;
    } catch (error) {
      console.log("Login error2:", error);

      // More specific error handling
      if (error.response && error.response.status === 500) {
        throw new Error("Server error. Please try again later.");
      } else if (error.response && error.response.status === 401) {
        throw new Error("Invalid email or password");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (email, token) => {
    try {
      setLoading(true);

      const response = await authService.verify2FA(email, token);

      if (!response?.session?.access_token || !response?.user) {
        throw new Error("Invalid 2FA verification response");
      }

      await AsyncStorage.setItem("auth_token", response.session.access_token);
      await AsyncStorage.setItem("user_id", response.user_id?.toString() || "");

      // Store 2FA status
      await set2FAStatus(true);

      const userData = {
        email: response.user.email,
        user_id: response.user_id,
      };

      setUser(userData);
      setProfile(response.user);
      await AsyncStorage.setItem("user_profile", JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.log("2FA verification error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        const profileData = await userService.getProfile();
        if (profileData) {
          const userId = await AsyncStorage.getItem("user_id");
          return {
            email: profileData.email,
            user_id: userId,
          };
        }
      }
      return null;
    } catch (error) {
      console.log("Error fetching user data:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Use the backend's logout endpoint
      await authService.logout();

      // Clear local auth data
      await clearAuthData();
    } catch (error) {
      console.log("Logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setLoading(true);

      // Use the backend's reset password endpoint
      const response = await authService.resetPassword(email);

      return response;
    } catch (error) {
      console.log("Reset password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        register,
        login,
        logout,
        resetPassword,
        getUserData,
        verify2FA,
        isAuthenticated: !!user && !!profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
