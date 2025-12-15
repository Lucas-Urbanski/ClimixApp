import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Platform,
    PermissionsAndroid,
    StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "react-native-geolocation-service";
import AppButton from "../components/appButton.jsx";
import createDayNightStyles from "../assets/styles/dayNightStyles";
import useDayNight from "../components/useDayNight";

export default function HomeScreen() {
    const nav = useNavigation();

    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    const key = "cd074d1d61f925210d6b697e73298d83";

    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMood, setSelectedMood] = useState(null);

    // mood options
    const moodOptions = [
        { id: "happy", label: "😊 Happy" },
        { id: "calm", label: "😌 Calm" },
        { id: "energetic", label: "⚡ Energetic" },
        { id: "melancholy", label: "🌧️ Melancholy" },
        { id: "romantic", label: "💘 Romantic" },
    ];

    useEffect(() => {
        loadWeather();
    }, []);

    /* LOCATION HELPERS */
    async function getGPSPermission() {
        try {
            if (Platform.OS === "android") {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "This app needs your location for local weather",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        } catch (err) {
            console.log("Permission error:", err);
            return false;
        }
    }

    async function getLocation() {
        const hasPermission = await getGPSPermission();
        if (!hasPermission) return null;

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    });
                },
                reject,
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }

    function getTodayISO() {
        return new Date().toISOString().slice(0, 10);
    }

    const cacheKeyFor = (lat, lon, date) =>
        `weather_${date}_${lat.toFixed(3)}_${lon.toFixed(3)}`;

    /* WEATHER LOADING */
    async function loadWeather() {
        try {
            setLoading(true);
            const today = getTodayISO();

            const loc = await getLocation();
            if (!loc) {
                setLoading(false);
                return;
            }

            const { lat, lon } = loc;
            const cacheKey = cacheKeyFor(lat, lon, today);
            const saved = await AsyncStorage.getItem(cacheKey);

            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.date === today && parsed.data) {
                    setWeather(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            await fetchWeather({ lat, lon, today, cacheKey });
        } catch (err) {
            console.log("loadWeather error:", err);
            setLoading(false);
        }
    }

    async function fetchWeather({ lat, lon, today, cacheKey }) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
            const res = await fetch(url);
            if (!res.ok) return;

            const json = await res.json();

            const data = {
                temp: json.main?.temp ?? null,
                feels_like: json.main?.feels_like ?? null,
                main: json.weather?.[0]?.main ?? null,
            };

            await AsyncStorage.setItem(
                cacheKey,
                JSON.stringify({ date: today, data })
            );

            setWeather(data);
        } catch (err) {
            console.log("fetchWeather error:", err);
        } finally {
            setLoading(false);
        }
    }

    /* UI HELPERS */
    function weatherEmoji(main) {
        if (!main) return "";
        const m = main.toLowerCase();
        if (m.includes("cloud")) return "☁️";
        if (m.includes("clear")) return "☀️";
        if (m.includes("rain")) return "🌧️";
        if (m.includes("drizzle")) return "🌦️";
        if (m.includes("snow")) return "❄️";
        if (m.includes("thunder")) return "⛈️";
        if (m.includes("mist") || m.includes("fog") || m.includes("haze"))
            return "🌫️";
        return "🌤️";
    }

    const formatNav = (emoji, label) => `${emoji}\n${label}`;

    const accent = "#8A2BE2";
    const moodBtnBg = isDaytime ? "#f0f0f0" : "#2b3a4a";
    const moodBtnText = isDaytime ? "#022F40" : "#FFFFFF";

    return (
        <View style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}>
            <View style={[shared.contentContainer, styles.contentContainer]}>
                {/* WEATHER */}
                {loading ? (
                    <Text style={[styles.weatherText, isDaytime ? styles.weatherTextDay : styles.weatherTextNight]}>
                        Loading weather...
                    </Text>
                ) : weather ? (
                    <>
                        <Text style={[styles.temp, { color: isDaytime ? "#022F40" : "#FFFFFF" }]}>
                            {Math.round(weather.temp)}°C
                        </Text>
                        <Text style={[styles.weatherText, isDaytime ? styles.weatherTextDay : styles.weatherTextNight]}>
                            {weather.main} {weatherEmoji(weather.main)}
                        </Text>
                    </>
                ) : (
                    <Text style={[styles.weatherText, isDaytime ? styles.weatherTextDay : styles.weatherTextNight]}>
                        Weather unavailable
                    </Text>
                )}

                {/* MOOD */}
                <Text style={[styles.moodLabel, { color: isDaytime ? "#022F40" : "#FFFFFF" }]}>
                    Select Your Mood:
                </Text>

                <View style={styles.moodContainer}>
                    {moodOptions.map((mood) => (
                        <AppButton
                            key={mood.id}
                            title={mood.label}
                            style={[
                                styles.moodButton,
                                { backgroundColor: moodBtnBg, width: "48%" },
                                selectedMood === mood.id && { backgroundColor: accent },
                            ]}
                            textStyle={{
                                color: selectedMood === mood.id ? "#FFFFFF" : moodBtnText,
                            }}
                            onPress={() => setSelectedMood(mood.id)}
                        />
                    ))}
                </View>

                {selectedMood && (
                    <Text style={[styles.selectedMoodText, { color: accent }]}>
                        Selected Mood: {moodOptions.find(m => m.id === selectedMood)?.label}
                    </Text>
                )}

                <AppButton
                    title="🎶 Generate Playlist"
                    onPress={() =>
                        nav.navigate("Playlist", {
                            weatherCondition: weather?.main,
                            temperature: weather?.temp,
                            mood: selectedMood || "auto",
                        })
                    }
                    style={[styles.generateBtn, { backgroundColor: accent }]}
                />
            </View>

            {/* NAV */}
            <View style={[shared.navRow, isDaytime ? shared.navRowDay : shared.navRowNight]}>
                <AppButton
                    title={formatNav("🎵", "Playlist")}
                    style={shared.navBtnBase}
                    textStyle={shared.navTextInactive}
                    onPress={() => nav.navigate("Playlist")}
                />
                <AppButton
                    title={formatNav("🏠", "Home")}
                    style={shared.navBtnBase}
                    textStyle={shared.navTextActive}
                    onPress={() => nav.navigate("Home")}
                />
                <AppButton
                    title={formatNav("⚙️", "Profile")}
                    style={shared.navBtnBase}
                    textStyle={shared.navTextInactive}
                    onPress={() => nav.navigate("Profile")}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 20,
    },

    temp: {
        fontSize: 42,
        fontWeight: "bold",
        textAlign: "center",
    },

    weatherText: {
        fontSize: 20,
        textAlign: "center",
        marginBottom: 30,
    },

    weatherTextDay: { color: "#0B4660" },
    weatherTextNight: { color: "#DCDFF8" },

    moodLabel: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 10,
    },

    moodContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    moodButton: {
        marginBottom: 10,
        paddingVertical: 12,
        borderRadius: 12,
    },

    selectedMoodText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 15,
        fontWeight: "bold",
    },

    generateBtn: {
        marginTop: 10,
        paddingVertical: 14,
        borderRadius: 12,
    },
});