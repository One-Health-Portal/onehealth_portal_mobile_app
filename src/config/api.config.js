export const API_CONFIG = {
  BASE_URL: "https://api.onehealthportal.xyz:8000/api",
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  AUTH: {
    REGISTER: "/auth/register", // Updated to use the backend's register endpoint
    ACTIVE_SESSIONS: "/auth/active-sessions", // Add this line
    VERIFY_2FA: "/auth/verify-2fa", // Add this line
    TOGGLE_2FA: "/auth/toggle-2fa", // Add this line
    LOGIN: "/auth/login", // Added login endpoint
    LOGOUT: "/auth/logout", // Added logout endpoint
    PROFILE: "/users/profile", // Fetch user profile
    UPDATE_PROFILE: "/users/profile", // Update user profile
    RESET_PASSWORD: "/auth/reset-password", // Reset password endpoint
    REFRESH_TOKEN: "/auth/refresh-token", // Refresh token endpoint
  },
  USERS: {
    GET_ALL: "/users/all", // Get all users
    GET_BY_ID: (id) => `/users/${id}`, // Get user by ID
    UPDATE: (id) => `/users/${id}`, // Update user by ID
    DELETE: (id) => `/users/${id}`, // Delete user by ID
  },
  DISEASE_PREDICTION: {
    PREDICT: "/disease-prediction/predict", // Predict disease
    HEALTH: "/disease-prediction/health", // Health check for disease prediction service
    GET_DOCTORS_BY_SPECIALTY: (specialty) =>
      `/doctors?specialization=${encodeURIComponent(specialty)}`, // Get doctors by specialty
  },
  APPOINTMENTS: {
    CREATE: "/appointments/book", // Book an appointment
    LIST: "/appointments/all", // List all appointments
    HISTORY: "/appointments/history", // Get appointment history
    CANCEL: (id) => `/appointments/${id}/cancel`, // Cancel an appointment
    GET_BY_ID: (id) => `/appointments/${id}`, // Get appointment by ID
    UPDATE: (id) => `/appointments/${id}`, // Update appointment by ID
    GET_BY_USER: (userId) => `/appointments/user/${userId}`, // Get appointments by user ID
    GET_RECEIPT: (id) => `/appointments/${id}/receipt`, // Get appointment receipt
    GET_DOCTOR_AVAILABILITY: (doctorId) =>
      `/appointments/doctors/${doctorId}/appointments`, // Get doctor availability
  },
  DOCTORS: {
    LIST: "/doctors", // List all doctors
    GET_BY_SPECIALIZATION: "/doctors", // Get doctors by specialization
    GET_BY_ID: (id) => `/doctors/${id}`, // Get doctor by ID
    GET_HOSPITALS: (doctorId) => `/doctors/${doctorId}/hospitals`, // Get hospitals for a doctor
    GET_AVAILABILITY: (doctorId) =>
      `/appointments/doctors/${doctorId}/appointments`, // Get doctor availability
    SEARCH: (params = {}) => {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append("query", params.query);
      if (params.doctorName)
        queryParams.append("doctor_name", params.doctorName);
      if (params.hospitalName)
        queryParams.append("hospital_name", params.hospitalName);
      if (params.specialization)
        queryParams.append("specialization", params.specialization);
      if (params.hospitalId)
        queryParams.append("hospital_id", params.hospitalId);
      return `/doctors/search/?${queryParams.toString()}`; // Search doctors
    },
    CREATE: "/doctors", // Create a new doctor
    UPDATE: (id) => `/doctors/${id}`, // Update doctor by ID
    DELETE: (id) => `/doctors/${id}`, // Delete doctor by ID
  },
  HOSPITALS: {
    LIST: "/hospitals/all", // List all hospitals
    GET_BY_ID: (id) => `/hospitals/${id}`, // Get hospital by ID
    CREATE: "/hospitals", // Create a new hospital
    UPDATE: (id) => `/hospitals/${id}`, // Update hospital by ID
    DELETE: (id) => `/hospitals/${id}`, // Delete hospital by ID
    GET_DOCTORS: (hospitalId) => `/hospitals/${hospitalId}/doctors`, // Get doctors for a hospital
  },
  LAB_TESTS: {
    CREATE: "/lab-tests", // Create a new lab test
    BOOK: "/lab-tests/book", // Book a lab test
    LIST: "/lab-tests", // List all lab tests
    HISTORY: "/lab-tests/history", // Get lab test history
    CANCEL: (labTestId) => `/lab-tests/${labTestId}`,
    GET_BY_ID: (id) => `/lab-tests/${id}`, // Get lab test by ID
    UPDATE: (id) => `/lab-tests/${id}`, // Update lab test by ID
    GET_AVAILABILITY: (hospitalId) => `/lab-tests/${hospitalId}/availability`, // Get lab test availability
  },
  FEEDBACK: {
    SUBMIT: "/feedback", // Submit feedback
    LIST: "/feedback/all", // List all feedback
    GET_BY_ID: (id) => `/feedback/${id}`, // Get feedback by ID
    UPDATE: (id) => `/feedback/${id}`, // Update feedback by ID
    DELETE: (id) => `/feedback/${id}`, // Delete feedback by ID
  },
  PAYMENTS: {
    CREATE: "/payments", // Create a payment
    LIST: "/payments/all", // List all payments
    GET_BY_ID: (id) => `/payments/${id}`, // Get payment by ID
    UPDATE: (id) => `/payments/${id}`, // Update payment by ID
    DELETE: (id) => `/payments/${id}`, // Delete payment by ID
  },
  HOSPITAL_DOCTOR: {
    CREATE: "/hospital-doctor", // Create a hospital-doctor relationship
    GET_DOCTORS: (hospitalId) =>
      `/hospital-doctor/hospital/${hospitalId}/doctors`, // Get doctors for a hospital
    GET_HOSPITALS: (doctorId) =>
      `/hospital-doctor/doctor/${doctorId}/hospitals`, // Get hospitals for a doctor
    UPDATE: (hospitalId, doctorId) =>
      `/hospital-doctor/hospital/${hospitalId}/doctor/${doctorId}`, // Update hospital-doctor relationship
    DELETE: (hospitalId, doctorId) =>
      `/hospital-doctor/hospital/${hospitalId}/doctor/${doctorId}`, // Delete hospital-doctor relationship
  },
};

/**
 * Generates the authorization header with a JWT token.
 * @param {string} token - The JWT token.
 * @returns {Object} - The authorization header.
 */
export const getAuthHeader = (token) => ({
  ...API_CONFIG.HEADERS,
  Authorization: `Bearer ${token}`,
});
