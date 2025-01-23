# One Health Portal Mobile Application

A comprehensive healthcare management application built with React Native and Expo. One Health Portal streamlines the healthcare experience by providing easy access to medical services, appointment scheduling.

## Features

- **Appointment Management**
  - Book appointments with doctors across multiple specialties
  - View and manage upcoming appointments
  - Access appointment history and download receipts
  - Get real-time availability of doctors

- **Lab Test Services**
  - Schedule laboratory tests
  - View test results and history
  - Manage upcoming lab test appointments
  - Download test reports

- **Symptom Checker**
  - AI-powered symptom analysis
  - Get preliminary health insights
  - Smart doctor recommendations based on symptoms
  - Emergency care guidance

- **Hospital Locator**
  - Find nearby hospitals
  - Access emergency contact information
  - Get directions to medical facilities
  - View hospital details and available services

- **Security Features**
  - Two-factor authentication
  - Secure data encryption
  - HIPAA-compliant data handling
  - Profile and session management

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- npm (v8 or higher)
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/onehealth.git
cd onehealth
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your desired platform:
```bash
# For iOS
npm run ios

# For Android
npm run android

# For web
npm run web
```

## Environment Setup

1. Configure the backend API endpoint in `config/api.config.js`

## Project Structure

```
OneHealth/
├── src/
│   ├── assets/        # Images, fonts, and other static files
│   ├── config/        # Configuration files
│   ├── context/       # React Context providers
│   ├── main/          # Main application logic
│   ├── screens/       # Application screens
│   ├── services/      # API and business logic services
│   └── utils/         # Utility functions and helpers
├── App.js             # Root application component
└── index.js          # Application entry point
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run on web browser

## Dependencies

Key dependencies include:
- expo: ^52.0.23
- react: 18.3.1
- react-native: 0.76.5
- @react-navigation/native: ^7.0.14
- axios: ^1.7.9
- react-native-paper: ^5.12.5

See `package.json` for a complete list of dependencies.

## Security

This application implements various security measures:
- Data encryption using SHA-256
- Secure token-based authentication
- Two-factor authentication support
- Regular security updates
