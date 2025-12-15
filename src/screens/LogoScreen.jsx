import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LogoScreen() {
  const nav = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const prepareApp = async () => {
      try {
        const minWaitTime = new Promise((resolve) => setTimeout(resolve, 2500));
        
        // Check for user session
        const userCheck = AsyncStorage.getItem("currentUser");

        const [_, userSession] = await Promise.all([minWaitTime, userCheck]);

        // Navigate
        if (userSession) {
          nav.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        } else {
          nav.reset({
            index: 0,
            routes: [{ name: "login" }],
          });
        }
      } catch (e) {
        console.warn(e);
        nav.reset({
          index: 0,
          routes: [{ name: "login" }],
        });
      }
    };

    prepareApp();
  }, [fadeAnim, scaleAnim, nav]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/ClimixLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C36", 
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.6,
    height: width * 0.6,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});