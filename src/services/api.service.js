import axios from "axios";
import { API_CONFIG } from "../config/api.config";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
});

let currentAuthToken = null;

// Token management functions
const setAuthToken = async (token, user_id = null) => {
  try {
    currentAuthToken = token;
    if (token) {
      await AsyncStorage.multiSet([
        ["auth_token", token],
        ["user_id", user_id?.toString() || ""], // Save user_id if provided
      ]);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      await AsyncStorage.multiRemove(["auth_token", "user_id"]); // Clear both tokens
      delete api.defaults.headers.common["Authorization"];
    }
  } catch (error) {
    console.log("Error setting auth token:", error);
  }
};

const getAuthToken = async () => {
  try {
    if (!currentAuthToken) {
      currentAuthToken = await AsyncStorage.getItem("auth_token");
      if (currentAuthToken) {
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${currentAuthToken}`;
      }
    }
    return currentAuthToken;
  } catch (error) {
    console.log("Error getting auth token:", error);
    return null;
  }
};

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await setAuthToken(null);
      await AsyncStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  verify2FA: async (email, token) => {
    try {
      console.debug("Verifying 2FA code...");

      // Verify the 2FA code with the backend
      const response = await api.post(API_CONFIG.AUTH.VERIFY_2FA, {
        email,
        token,
      });

      if (!response.data?.access_token || !response.data?.user_id) {
        throw new Error("No access token or user ID received");
      }

      // Set the auth token and user_id
      await setAuthToken(response.data.access_token, response.data.user_id);

      await AsyncStorage.setItem("auth_token", response.data.access_token);
      console.debug("2FA verification successful:", response);

      // Return the session and user data in the expected structure
      return {
        session: { access_token: response.data.access_token },
        user: response.data.user,
        user_id: response.data.user_id, // Include user_id in the response
      };
    } catch (error) {
      console.log("2FA verification error:", error);
      if (error.response?.status === 400) {
        throw new Error("Invalid 2FA code");
      }
      throw new Error("2FA verification failed. Please try again.");
    }
  },
  register: async (userData) => {
    try {
      console.debug("Attempting to register user with backend...");

      // Register with backend
      const response = await api.post(API_CONFIG.AUTH.REGISTER, userData);

      console.debug("Backend registration successful:", response.data);

      return {
        ...response.data,
        success: true,
        message: "Registration successful. Please log in.",
      };
    } catch (error) {
      console.log("Registration error:", error);
      if (error.response?.data?.detail?.includes("already exists")) {
        throw new Error("This email is already registered");
      }
      throw new Error("Registration failed. Please try again.");
    }
  },

  toggleTwoFactor: async (enabled, method = "email") => {
    try {
      console.debug("Toggling 2FA...", { enabled, method });

      const response = await api.post(API_CONFIG.AUTH.TOGGLE_2FA, {
        enabled, // Correct key
        method,
      });

      console.debug("2FA toggle response:", response.data);
      return response.data;
    } catch (error) {
      console.log("Error toggling 2FA:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to toggle 2FA settings"
      );
    }
  },

  login: async (email, password) => {
    try {
      console.debug("Attempting to log in with backend...");

      // Log in with backend
      const response = await api.post(API_CONFIG.AUTH.LOGIN, {
        email,
        password,
      });

      // Check if two-factor authentication is required
      if (response.data.requires_2fa || response.data.two_factor_required) {
        await AsyncStorage.setItem("two_factor_enabled", "true");
        return {
          requires_2fa: true,
          two_factor_details: response.data.two_factor_details || {},
        };
      }

      // If not requiring 2FA, proceed with normal login
      if (
        !response.data?.access_token ||
        !response.data?.user_id ||
        !response.data?.user
      ) {
        throw new Error("No access token, user ID, or user data received");
      }

      // Set the auth token and user_id
      await setAuthToken(response.data.access_token, response.data.user_id);

      // Explicitly retrieve and log the token
      const token = await getAuthToken();
      console.log("Token retrieved after login:", token);

      console.debug("Backend login successful:", response.data);

      // Return the session and user data in the expected structure
      return {
        message: response.data.message, // Include the message from the response
        session: { access_token: response.data.access_token },
        user: response.data.user,
        user_id: response.data.user_id,
      };
    } catch (error) {
      throw new Error(error.response?.data.detail);
    }
  },

  logout: async () => {
    try {
      console.debug("Attempting to log out...");

      // Log out with backend
      const response = await api.post(API_CONFIG.AUTH.LOGOUT);

      // Clear the auth token and user_id
      await setAuthToken(null);

      console.debug("Backend logout successful:", response.data);

      return response.data;
    } catch (error) {
      console.log("Logout error:", error);
      throw new Error("Logout failed. Please try again.");
    }
  },

  resetPassword: async (email) => {
    try {
      console.debug("Sending password reset email to:", email);

      // Send password reset request to backend
      const response = await api.post(API_CONFIG.AUTH.RESET_PASSWORD, {
        email,
      });

      console.debug("Password reset email sent:", response.data);

      return response.data;
    } catch (error) {
      console.log("Password reset error:", error);
      if (error.response?.status === 404) {
        throw new Error("User with this email does not exist");
      }
      throw new Error("Failed to send password reset email");
    }
  },

  getActiveSessions: async () => {
    try {
      console.debug("Retrieving active sessions...");
      const response = await api.get(API_CONFIG.AUTH.ACTIVE_SESSIONS);

      console.debug("Active sessions retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.log("Error retrieving active sessions:", error);
      if (error.response) {
        console.debug("Error response data:", error.response.data);
      }
      throw error;
    }
  },
};

// User Service
export const userService = {
  getProfile: async () => {
    try {
      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem("auth_token");
      console.log("Token retrieved in getProfile:", token);

      if (!token) {
        throw new Error("No authentication token");
      }

      // Make the request with the token in the headers
      const response = await api.get(API_CONFIG.AUTH.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.debug("Profile data fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.log("Error fetching profile:", error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put(API_CONFIG.AUTH.UPDATE_PROFILE, userData);
      return response.data;
    } catch (error) {
      console.log("Error updating profile:", error);
      throw error;
    }
  },
};

// Disease Prediction Service
export const diseasePredictionService = {
  predictDisease: async (symptoms) => {
    try {
      const response = await api.post(API_CONFIG.DISEASE_PREDICTION.PREDICT, {
        symptoms,
      });
      return response.data;
    } catch (error) {
      console.log("Error predicting disease:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to predict disease"
      );
    }
  },

  getDoctorsForSpecialty: async (specialty) => {
    try {
      const doctors = await doctorService.getDoctorsBySpecialization(specialty);
      if (!doctors || doctors.length === 0) {
        return await doctorService.searchDoctors({ specialization: specialty });
      }
      return doctors;
    } catch (error) {
      console.log("Error fetching doctors for specialty:", error);
      throw new Error("Failed to fetch recommended doctors");
    }
  },

  checkHealth: async () => {
    try {
      const response = await api.get(API_CONFIG.DISEASE_PREDICTION.HEALTH);
      return response.data;
    } catch (error) {
      console.log("Error checking disease prediction health:", error);
      throw new Error("Disease prediction service is not available");
    }
  },
};

// Doctor Service
export const doctorService = {
  getDoctorHospitals: async (doctorId) => {
    try {
      const response = await api.get(
        API_CONFIG.DOCTORS.GET_HOSPITALS(doctorId)
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching doctor's hospitals:", error);
      throw error;
    }
  },

  getAvailableTimeSlots: async (doctorId, hospitalId, selectedDate) => {
    try {
      const response = await api.get(
        API_CONFIG.DOCTORS.GET_AVAILABILITY(doctorId),
        {
          params: {
            hospital_id: hospitalId,
            selected_date: selectedDate,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching appointments:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to fetch available time slots"
      );
    }
  },

  getAllDoctors: async () => {
    try {
      const response = await api.get(API_CONFIG.DOCTORS.LIST);
      return response.data;
    } catch (error) {
      console.log("Error fetching doctors:", error);
      throw error;
    }
  },

  getDoctorsBySpecialization: async (specialization) => {
    try {
      const response = await api.get(
        `${
          API_CONFIG.DOCTORS.GET_BY_SPECIALIZATION
        }?specialization=${encodeURIComponent(specialization)}`
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching doctors by specialization:", error);
      throw error;
    }
  },

  getDoctorsByHospital: async (hospitalId) => {
    try {
      const response = await api.get(
        API_CONFIG.HOSPITAL_DOCTOR.GET_DOCTORS(hospitalId)
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching doctors by hospital:", error);
      throw error;
    }
  },

  searchDoctors: async ({
    query = "",
    doctorName = "",
    hospitalName = "",
    specialization = null,
    hospitalId = null,
  }) => {
    try {
      const response = await api.get(
        API_CONFIG.DOCTORS.SEARCH({
          query,
          doctorName,
          hospitalName,
          specialization,
          hospitalId,
        })
      );

      return response.data.map((doctor) => ({
        ...doctor,
        fullName: `${doctor.title} ${doctor.name}`,
        hospitals: doctor.hospitals?.map((hospital) => ({
          ...hospital,
          availability: {
            start: hospital.availability.start,
            end: hospital.availability.end,
          },
        })),
      }));
    } catch (error) {
      console.log("Error searching doctors:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to search doctors"
      );
    }
  },
};

// Appointment Service
export const appointmentService = {
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post(
        API_CONFIG.APPOINTMENTS.CREATE,
        appointmentData
      );
      return response.data;
    } catch (error) {
      console.log("Error creating appointment:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error("Failed to create appointment");
    }
  },

  getAppointmentHistory: async () => {
    try {
      const token = await getAuthToken();
      console.debug("JWT token retrieved:", token);

      if (!token) {
        console.log("No authentication token found.");
        throw new Error("No authentication token");
      }
      const response = await api.get(API_CONFIG.APPOINTMENTS.HISTORY, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.log("Error fetching appointment history:", error);
      if (error.response) {
        console.debug("Error response data:", error.response.data);
      } else if (error.request) {
        console.debug("No response received:", error.request);
      } else {
        console.debug("Error setting up the request:", error.message);
      }
      throw error;
    }
  },

  getAppointmentReceipt: async (appointmentId) => {
    try {
      const response = await api.get(
        API_CONFIG.APPOINTMENTS.GET_RECEIPT(appointmentId),
        {
          responseType: "blob", // To handle PDF file
        }
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching appointment receipt:", error);
      throw error;
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(
        API_CONFIG.APPOINTMENTS.CANCEL(appointmentId)
      );

      if (response.data) {
        return response.data;
      }
      throw new Error("Failed to cancel appointment");
    } catch (error) {
      console.log("Error cancelling appointment:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error("Failed to cancel appointment. Please try again.");
    }
  },
};

// Lab Test Service
export const labTestService = {
  getAvailableTimeSlots: async (hospitalId, selectedDate) => {
    try {
      const response = await api.get(
        API_CONFIG.LAB_TESTS.GET_AVAILABILITY(hospitalId),
        {
          params: {
            selected_date:
              selectedDate instanceof Date
                ? selectedDate.toISOString().split("T")[0]
                : selectedDate,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching available time slots:", error);
      throw error;
    }
  },

  getLabTestHistory: async () => {
    try {
      const response = await api.get(API_CONFIG.LAB_TESTS.HISTORY);
      return response.data;
    } catch (error) {
      console.log("Error fetching lab test history:", error);
      throw error;
    }
  },

  createLabTest: async (labTestData) => {
    try {
      // Validate required fields
      const requiredFields = [
        "user_id",
        "hospital_id",
        "test_type",
        "test_date",
        "test_time",
      ];
      const missingFields = requiredFields.filter(
        (field) => !labTestData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Make the API request
      const response = await api.post(API_CONFIG.LAB_TESTS.BOOK, {
        ...labTestData,
        // Ensure proper data types
        user_id: parseInt(labTestData.user_id, 10),
        hospital_id: parseInt(labTestData.hospital_id, 10),
        test_type: String(labTestData.test_type),
        test_date: labTestData.test_date,
        test_time: labTestData.test_time,
        instruction: labTestData.instruction || "",
      });

      return response.data;
    } catch (error) {
      console.log("Error booking lab test:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },
  cancelLabTest: async (labTestId) => {
    try {
      const response = await api.delete(API_CONFIG.LAB_TESTS.CANCEL(labTestId));
      return response.data;
    } catch (error) {
      console.log("Error cancelling lab test:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error("Failed to cancel lab test. Please try again.");
    }
  },
};

// Hospital Service
export const hospitalService = {
  getAllHospitals: async () => {
    try {
      const response = await api.get(API_CONFIG.HOSPITALS.LIST);
      return response.data;
    } catch (error) {
      console.log("Error fetching hospitals:", error);
      throw error;
    }
  },

  getHospitalById: async (hospitalId) => {
    try {
      const response = await api.get(
        API_CONFIG.HOSPITALS.GET_BY_ID(hospitalId)
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching hospital:", error);
      throw error;
    }
  },
};

// Feedback Service
export const feedbackService = {
  submitFeedback: async (feedbackData) => {
    try {
      const response = await api.post(API_CONFIG.FEEDBACK.SUBMIT, feedbackData);
      return response.data;
    } catch (error) {
      console.log("Error submitting feedback:", error);
      throw error;
    }
  },

  getAllFeedback: async () => {
    try {
      const response = await api.get(API_CONFIG.FEEDBACK.LIST);
      return response.data;
    } catch (error) {
      console.log("Error fetching feedback:", error);
      throw error;
    }
  },

  getFeedbackById: async (feedbackId) => {
    try {
      const response = await api.get(API_CONFIG.FEEDBACK.GET_BY_ID(feedbackId));
      return response.data;
    } catch (error) {
      console.log("Error fetching feedback by ID:", error);
      throw error;
    }
  },

  updateFeedback: async (feedbackId, feedbackData) => {
    try {
      const response = await api.put(
        API_CONFIG.FEEDBACK.UPDATE(feedbackId),
        feedbackData
      );
      return response.data;
    } catch (error) {
      console.log("Error updating feedback:", error);
      throw error;
    }
  },

  deleteFeedback: async (feedbackId) => {
    try {
      const response = await api.delete(API_CONFIG.FEEDBACK.DELETE(feedbackId));
      return response.data;
    } catch (error) {
      console.log("Error deleting feedback:", error);
      throw error;
    }
  },
};

// Payment Service
export const paymentService = {
  createPayment: async (paymentData) => {
    try {
      const response = await api.post(API_CONFIG.PAYMENTS.CREATE, paymentData);
      return response.data;
    } catch (error) {
      console.log("Error creating payment:", error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error("Failed to create payment record");
    }
  },

  getAllPayments: async () => {
    try {
      const response = await api.get(API_CONFIG.PAYMENTS.LIST);
      return response.data;
    } catch (error) {
      console.log("Error fetching payments:", error);
      throw error;
    }
  },
};

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await setAuthToken(null);
      await AsyncStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

// Export helper functions
export const getToken = getAuthToken;
export const setToken = setAuthToken;

// Export the api instance
export { api };
