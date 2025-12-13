import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Platform,
    PermissionsAndroid,
    StyleSheet,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "react-native-geolocation-service";
import AppButton from "../components/appButton.jsx";

export default function HomeScreen() {
    const nav = useNavigation();

    const key = "cd074d1d61f925210d6b697e73298d83";

    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMood, setSelectedMood] = useState(null);

    // Mood options with values
    const moodOptions = [
        { id: "happy", label: "😊 Happy" },
        { id: "calm", label: "😌 Calm" },
        { id: "energetic", label: "⚡ Energetic" },
        { id: "melancholy", label: "🌧️ Melancholy" },
        { id: "romantic", label: "💘 Romantic" },
    ];

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
        if (!hasPermission) {
            console.log("GPS permission denied.");
            return null;
        }

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    const coords = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    };
                    console.log("GPS location:", coords);
                    resolve(coords);
                },
                (err) => {
                    console.log("GPS error:", err);
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }

    function getTodayISO() {
        return new Date().toISOString().slice(0, 10);
    }

    const cacheKeyFor = (lat, lon, date) =>
        `weather_${date}_${lat.toFixed(3)}_${lon.toFixed(3)}`;


    useEffect(() => {
        loadWeather();
    }, []);


    async function loadWeather() {
        try {
            setLoading(true);

            const today = getTodayISO();

            const loc = await getLocation();
            if (!loc) {
                console.log("No GPS available.");
                setLoading(false);
                return;
            }

            const { lat, lon } = loc;

            const cacheKey = cacheKeyFor(lat, lon, today);
            const saved = await AsyncStorage.getItem(cacheKey);

            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.date === today) {
                    console.log("Loaded from cache:", parsed.data);
                    setWeather(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            await fetchWeather({ lat, lon, today });
        } catch (err) {
            console.log("loadWeather error:", err);
            setLoading(false);
        }
    }



    async function fetchWeather({ lat, lon, today }) {
        setLoading(true);

        const cacheKey = cacheKeyFor(lat, lon, today);

        try {
            console.log("Fetching weather for:", lat, lon);

            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

            const res = await fetch(url);
            if (!res.ok) {
                console.log("Weather API error:", res.status);
                return;
            }

            const json = await res.json();

            const data = {
                temp: json.main?.temp ?? null,
                feels_like: json.main?.feels_like ?? null,
                main: json.weather?.[0]?.main ?? null,
            };

            await AsyncStorage.setItem(
                cacheKey,
                JSON.stringify({
                    date: today,
                    data,
                })
            );

            setWeather(data);
        } catch (err) {
            console.log("fetchWeather error:", err);
        } finally {
            setLoading(false);
        }
    }

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

    return (
        <View style={styles.container}>
            {/* WEATHER */}
            {loading ? (
                <Text style={styles.weatherText}>Loading weather...</Text>
            ) : weather ? (
                <>
                    <Text style={styles.temp}>{Math.round(weather.temp)}°C</Text>
                    <Text style={styles.weatherText}>
                        {weather.main} {weatherEmoji(weather.main)}
                    </Text>
                </>
            ) : (
                <Text style={styles.weatherText}>Weather unavailable</Text>
            )}

            {/* MOOD SELECTION */}
            <Text style={styles.moodLabel}>Select Your Mood:</Text>
            <View style={styles.moodContainer}>
                {moodOptions.map((mood) => (
                    <AppButton
                        key={mood.id}
                        title={mood.label}
                        style={[
                            styles.moodButton,
                            selectedMood === mood.id && styles.selectedMoodButton
                        ]}
                        onPress={() => setSelectedMood(mood.id)}
                    />
                ))}
            </View>

            {/* Display selected mood */}
            {selectedMood && (
                <Text style={styles.selectedMoodText}>
                    Selected Mood: {moodOptions.find(m => m.id === selectedMood)?.label}
                </Text>
            )}

            <AppButton
                title="🎶 Generate Playlist"
                onPress={() => nav.navigate("Playlist", { 
                    weatherCondition: weather?.main,
                    temperature: weather?.temp,
                    mood: selectedMood || "auto"
                })}
                style={styles.generateBtn}
            />

            {/* Nav */}
            <View style={styles.navRow}>
                <AppButton
                    title="🎵 Playlist"
                    style={styles.navBtn}
                    onPress={() => nav.navigate("Playlist")}
                />
                <AppButton
                    title="🏠 Home"
                    style={styles.navBtn}
                    onPress={() => nav.navigate("Home")}
                />
                <AppButton
                    title="⚙️ Profile"
                    style={styles.navBtn}
                    onPress={() => nav.navigate("Profile")}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    temp: {
        fontSize: 42,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    weatherText: {
        fontSize: 20,
        textAlign: "center",
        marginBottom: 30,
    },
    moodLabel: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
    },
    moodContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    moodButton: {
        backgroundColor: "#f0f0f0",
        marginBottom: 10,
        width: "48%",
    },
    selectedMoodButton: {
        backgroundColor: "#8A2BE2",
    },
    selectedMoodText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 15,
        color: "#8A2BE2",
        fontWeight: "bold",
    },
    generateBtn: {
        backgroundColor: "#8A2BE2",
        marginTop: 10,
    },
    navRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 40,
    },
    navBtn: {
        paddingVertical: 20,
    },
});