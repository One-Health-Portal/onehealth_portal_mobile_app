import React, { useState, useRef, useEffect } from "react";
import { View, Text, Dimensions, Animated, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

const NewsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const newsItems = [
    {
      id: 1,
      title: "COVID-19 Vaccination Drive",
      description: "New vaccination centers open across the city",
    },
    {
      id: 2,
      title: "Health Tips",
      description: "Stay healthy during flu season with these tips",
    },
    {
      id: 3,
      title: "Medical Camp",
      description: "Free medical camp this weekend at Central Hospital",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === newsItems.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {newsItems.map((item, index) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          ))}
        </Animated.ScrollView>
      </View>
      <View style={styles.pagination}>
        {newsItems.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  scrollContainer: {
    height: 100,
  },
  card: {
    width: width - 40,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b5998",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b5998",
    marginHorizontal: 4,
  },
});

export default NewsCarousel;
