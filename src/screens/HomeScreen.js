import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  authService,
  userService,
  appointmentService,
} from "../services/api.service";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

// Function to generate dynamic styles based on width
const getStyles = (width) =>
  StyleSheet.create({
    newsCard: {
      backgroundColor: "#fff",
      borderRadius: 15,
      width: width - 40,
      marginRight: 20,
      elevation: 3,
      overflow: "hidden",
    },
    newsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
  });

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const NewsCarousel = ({ newsItems, renderNewsItem }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = Dimensions.get("window");
  const cardWidth = width - 40;
  const spacerWidth = (width - cardWidth) / 2;

  // Auto-swipe functionality
  useEffect(() => {
    const autoSwipe = setInterval(() => {
      if (flatListRef.current && newsItems.length > 0) {
        const nextIndex = (currentIndex + 1) % newsItems.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, 3000);

    return () => clearInterval(autoSwipe);
  }, [currentIndex, newsItems.length]);

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / cardWidth);
    setCurrentIndex(newIndex);
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          width: cardWidth,
          transform: [{ scale }],
          opacity,
        }}
      >
        {renderNewsItem({ item, index })}
      </Animated.View>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {newsItems.map((_, index) => {
          const inputRange = [
            (index - 1) * cardWidth,
            index * cardWidth,
            (index + 1) * cardWidth,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.2, 1],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View>
      <AnimatedFlatList
        ref={flatListRef}
        data={newsItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: spacerWidth,
        }}
        getItemLayout={(data, index) => ({
          length: cardWidth,
          offset: cardWidth * index,
          index,
        })}
      />
      {renderPaginationDots()}
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [showMenu, setShowMenu] = useState(false);
  const [firstName, setFirstName] = useState("User");
  const [userId, setUserId] = useState(null);
  const [latestAppointment, setLatestAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const slideAnimation = useRef(new Animated.Value(width)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Generate dynamic styles
  const dynamicStyles = getStyles(width);

  const parseAppointmentDateTime = (date, time) => {
    // Ensure date is in YYYY-MM-DD format
    const formattedDate = date;

    // Convert time to 24-hour format if it's in AM/PM format
    let formattedTime = time;
    if (time.includes("AM") || time.includes("PM")) {
      const [timePart, modifier] = time.split(" ");
      let [hours, minutes] = timePart.split(":");

      if (modifier === "PM" && hours !== "12") {
        hours = String(parseInt(hours) + 12);
      }
      if (modifier === "AM" && hours === "12") {
        hours = "00";
      }

      formattedTime = `${hours.padStart(2, "0")}:${minutes}`;
    }

    // Combine date and time
    return new Date(`${formattedDate}T${formattedTime}:00`);
  };

  const fetchUserData = async () => {
    setIsLoading(true); // Start loading
    try {
      console.log("Fetching user profile...");
      const profile = await userService.getProfile();
      console.log("Profile response:", profile);

      if (profile) {
        setFirstName(profile.first_name || "User");
        setUserId(profile.user_id || "N/A");
      }

      console.log("Fetching appointment history...");
      const response = await appointmentService.getAppointmentHistory();
      console.log("Appointment history response:", response.data);

      if (response.data?.length > 0) {
        // Current date and time
        const now = new Date();
        console.log("Current time:", now);

        const upcomingAppointments = response.data
          .filter((appointment) => {
            try {
              // Parse the appointment date and time
              const appointmentDateTime = parseAppointmentDateTime(
                appointment.appointment_date,
                appointment.appointment_time
              );

              console.log("Parsed appointment datetime:", appointmentDateTime);

              // Check if the parsed date is valid and in the future
              return (
                !isNaN(appointmentDateTime.getTime()) &&
                appointmentDateTime > now
              );
            } catch (parseError) {
              console.log("Error parsing appointment date:", parseError);
              return false;
            }
          })
          .sort((a, b) => {
            // Correctly parse and compare dates
            const aDateTime = parseAppointmentDateTime(
              a.appointment_date,
              a.appointment_time
            );
            const bDateTime = parseAppointmentDateTime(
              b.appointment_date,
              b.appointment_time
            );
            return aDateTime.getTime() - bDateTime.getTime();
          });

        console.log("Upcoming appointments:", upcomingAppointments);

        if (upcomingAppointments.length > 0) {
          const nearestAppointment = upcomingAppointments[0]; // Get the nearest appointment
          console.log("Nearest appointment:", nearestAppointment);
          setLatestAppointment({
            date: nearestAppointment.appointment_date,
            time: nearestAppointment.appointment_time,
            doctorName: nearestAppointment.doctor_name,
            specialization: nearestAppointment.doctor_specialization,
            hospitalName: nearestAppointment.hospital_name,
            note: nearestAppointment.note,
          });
        } else {
          console.log("No upcoming appointments found.");
          setLatestAppointment(null); // No upcoming appointments
        }
      } else {
        console.log("No appointments found in response.");
        setLatestAppointment(null); // No appointments found
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      // Optionally set error state or show error toast
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // When using the function in useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await authService.logout();

      // Show success toast
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been successfully logged out.",
      });

      navigation.navigate("Login");
    } catch (error) {
      console.log("Error logging out:", error);

      // Show error toast
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: "An error occurred while logging out. Please try again.",
      });
    }
  };

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: showMenu ? 0 : width, // Slide to 0 when visible, slide to width when hidden
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [showMenu]);

  const homeItems = [
    {
      id: 1,
      title: "Book Appointment",
      icon: "calendar-outline",
      route: "Appointment",
      color: "#4CAF50",
    },
    {
      id: 2,
      title: "Symptom Checker",
      icon: "medical-outline",
      route: "SymptomChecker",
      color: "#2196F3",
    },
    {
      id: 3,
      title: "Lab Tests",
      icon: "flask-outline",
      route: "LabTests",
      color: "#9C27B0",
    },
    {
      id: 4,
      title: "Find Hospitals",
      icon: "location-outline",
      route: "NearbyHospitals",
      color: "#FF5722",
    },
  ];

  const menuOptions = [
    {
      id: 1,
      title: "Profile Management",
      icon: "person-outline",
      route: "ProfileManagement",
    },
    {
      id: 2,
      title: "Security Settings",
      icon: "shield-outline",
      route: "SecuritySettings",
    },
    {
      id: 3,
      title: "Appointment History",
      icon: "calendar-outline",
      route: "AppointmentHistory",
    },
    {
      id: 4,
      title: "Lab Test History",
      icon: "document-text-outline",
      route: "LabTestHistory",
    },
    {
      id: 5,
      title: "Submit Feedback",
      icon: "chatbox-outline",
      route: "SubmitFeedback",
    },
    {
      id: 6,
      title: "Settings",
      icon: "settings-outline",
      route: "Settings",
    },
    {
      id: 7,
      title: "Logout",
      icon: "log-out-outline",
      route: "Login",
      isLogout: true,
    },
  ];

  const newsItems = [
    {
      id: "1",
      title: "New Medical Breakthrough",
      description:
        "Scientists discover promising treatment for chronic conditions",
      image: require("../assets/news/news1.jpg"),
      category: "Research",
    },
    {
      id: "2",
      title: "Health Tips for Better Living",
      description: "Five essential habits for maintaining good health",
      image: require("../assets/news/news2.jpg"),
      category: "Lifestyle",
    },
    {
      id: "3",
      title: "COVID-19 Updates",
      description: "Latest guidelines and vaccination information",
      image: require("../assets/news/news3.jpg"),
      category: "Updates",
    },
  ];

  const renderMenuItem = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.sidebarItem, option.isLogout && styles.sidebarLogoutItem]}
      onPress={() => {
        if (option.isLogout) {
          handleLogout();
        } else {
          navigation.navigate(option.route);
        }
        setShowMenu(false);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.sidebarContent}>
        <Ionicons
          name={option.icon}
          size={22}
          color={option.isLogout ? "#FF4D4F" : "#1a237e"}
          style={styles.sidebarIcon}
        />
        <Text
          style={[
            styles.sidebarText,
            option.isLogout && styles.sidebarLogoutText,
          ]}
        >
          {option.title}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={option.isLogout ? "#FF4D4F" : "#8F9BB3"}
        style={styles.sidebarArrow}
      />
    </TouchableOpacity>
  );

  const renderHomeItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate(item.route)}
      activeOpacity={0.9}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons name={item.icon} size={28} color="#fff" />
      </View>
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#fff"
        style={styles.menuArrow}
      />
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        dynamicStyles.newsCard,
        {
          transform: [
            {
              scale: Animated.divide(scrollX, width).interpolate({
                inputRange: [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
                ],
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.newsImageContainer}>
        <Image
          source={item.image}
          style={styles.newsImage}
          resizeMode="cover"
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsDescription} numberOfLines={3}>
          {item.description}
        </Text>
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read More</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      <LinearGradient
        colors={["#1a237e", "#3949ab", "#3f51b5"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../assets/icons/logo.png")}
              style={styles.logo}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>{homeItems.map(renderHomeItem)}</View>

        {/* Upcoming Appointment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
            {latestAppointment && (
              <TouchableOpacity
                onPress={() => navigation.navigate("AppointmentHistory")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3f51b5" />
            </View>
          ) : latestAppointment ? (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.doctorName}>
                    Dr. {latestAppointment.doctorName}
                  </Text>
                  <Text style={styles.specialization}>
                    {latestAppointment.specialization}
                  </Text>
                </View>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateTime}>
                    {new Date(latestAppointment.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.dateTime}>{latestAppointment.time}</Text>
                </View>
              </View>
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {latestAppointment.hospitalName}
                  </Text>
                </View>
                {latestAppointment.note && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      {latestAppointment.note}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noAppointmentCard}>
              <Ionicons name="calendar-outline" size={48} color="#3f51b5" />
              <Text style={styles.noAppointmentTitle}>
                No Upcoming Appointments
              </Text>
              <Text style={styles.noAppointmentText}>
                Schedule your next appointment with our trusted healthcare
                providers
              </Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate("Appointment")}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* News Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Health News</Text>
          </View>
          <NewsCarousel newsItems={newsItems} renderNewsItem={renderNewsItem} />
        </View>
      </ScrollView>

      {/* Side Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <Animated.View
            style={[
              styles.sidebarContainer,
              {
                transform: [{ translateX: slideAnimation }],
              },
            ]}
          >
            <ScrollView
              style={styles.sidebarScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {menuOptions.map(renderMenuItem)}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Static styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  noAppointmentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginTop: 15,
    marginBottom: 8,
  },
  noAppointmentText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  bookButton: {
    backgroundColor: "#3f51b5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  newsImageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  newsImage: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(26, 35, 126, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  newsContent: {
    padding: 20,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
    lineHeight: 24,
  },
  newsDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  readMoreButton: {
    alignSelf: "flex-start",
  },
  readMoreText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "80%",
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    elevation: 5,
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: "#666",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: "rgba(63, 81, 181, 0.1)",
  },
  menuItemIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: "#1a237e",
    flex: 1,
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "#f44336",
    marginLeft: 10,
    fontWeight: "600",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  welcomeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
  },
  quickActions: {
    padding: 20,
    gap: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  menuArrow: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  viewAllText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "500",
  },
  appointmentCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 4,
  },
  specialization: {
    color: "#666",
    fontSize: 14,
  },
  dateTimeContainer: {
    alignItems: "flex-end",
  },
  dateTime: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "500",
  },
  appointmentDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: "#666",
    fontSize: 14,
  },
  noAppointmentCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawerContainer: {
    backgroundColor: "#fff",
    width: "80%",
    height: "100%",
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: "#1a237e",
    borderBottomLeftRadius: 20,
  },
  drawerUserInfo: {
    marginTop: 10,
  },
  drawerUserName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  drawerUserId: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 15,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  drawerItemActive: {
    backgroundColor: "rgba(63, 81, 181, 0.1)",
  },
  drawerItemIcon: {
    marginRight: 15,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemText: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: "#f44336",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  quickActionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    backgroundColor: "#3f51b5",
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  newsSection: {
    marginTop: 20,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  newsHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
  },
  newsCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  newsImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  categoryChip: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(26, 35, 126, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  newsCardContent: {
    padding: 15,
  },
  newsCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 8,
  },
  newsCardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  readMoreText: {
    color: "#3f51b5",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "80%",
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 15,
  },
  menuItemContainer: {
    paddingVertical: 8,
  },
  badgeContainer: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#3f51b5",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  refreshButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#3f51b5",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#ffebee",
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#c62828",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3f51b5",
    fontWeight: "500",
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  logoutMenuItem: {
    marginTop: 10,
    backgroundColor: "#FFF1F0",
    borderRadius: 0,
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoutIconBg: {
    backgroundColor: "#FFF1F0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#1a237e",
    fontWeight: "500",
  },
  logoutText: {
    color: "#FF4D4F",
  },
  menuItemArrow: {
    opacity: 0.5,
  },
  menuHeader: {
    padding: 20,
    backgroundColor: "#1a237e",
    borderBottomLeftRadius: 20,
  },
  menuProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileId: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebarContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "75%",
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
  },
  sidebarScrollContent: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  sidebarContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sidebarIcon: {
    marginRight: 16,
    width: 22,
    height: 22,
  },
  sidebarText: {
    fontSize: 15,
    color: "#1a237e",
    fontWeight: "500",
  },
  sidebarArrow: {
    opacity: 0.5,
  },
  sidebarLogoutItem: {
    backgroundColor: "#FFF1F0",
    marginTop: 8,
  },
  sidebarLogoutText: {
    color: "#FF4D4F",
  },
});

export default HomeScreen;
