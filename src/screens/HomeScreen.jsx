import React, { useEffect, useState } from "react";
import { Button, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
    const nav = useNavigation();

    const lat = 50.9269393;
    const lon = -114.0239669;
    const key = "cd074d1d61f925210d6b697e73298d83";

    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWeather();
    }, []);

    function getTodayISO() {
        return new Date().toISOString().slice(0, 10);
    }

    async function loadWeather() {
        try {
            const today = getTodayISO();
            const saved = await AsyncStorage.getItem("weatherData");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.date === today && parsed.data) {
                    setWeather(parsed.data);
                    setLoading(false);
                    return;
                }
            }
            // otherwise fetch fresh data
            await fetchWeather(today);
        } catch (err) {
            console.log("loadWeather error:", err);
            setLoading(false);
        }
    }

    async function fetchWeather(today) {
        setLoading(true);

        const oneCallUrl =
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${key}`;
        const fallbackUrl =
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

        try {
            let res = await fetch(oneCallUrl);

            if (!res.ok) {
                console.log("One Call failed:", res.status);
                res = await fetch(fallbackUrl);
            }

            if (!res.ok) {
                console.log("Weather fetch failed:", res.status);
                setLoading(false);
                return;
            }

            const json = await res.json();
            let data = null;

            if (json.current && json.current.weather) {
                data = {
                    temp: json.current.temp,
                    feels_like: json.current.feels_like,
                    main: json.current.weather[0].main,
                    description: json.current.weather[0].description,
                };
            } else if (json.main && json.weather) {
                data = {
                    temp: json.main.temp,
                    feels_like: json.main.feels_like,
                    main: json.weather[0].main,
                    description: json.weather[0].description,
                };
            } else {
                console.log("Unexpected weather response:", json);
                setLoading(false);
                return;
            }

            // Save to storage with today's date
            await AsyncStorage.setItem(
                "weatherData",
                JSON.stringify({ date: today, data })
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
        <View>

            {/* WEATHER */}
            {loading ? (
                <Text>Loading weather...</Text>
            ) : weather ? (
                <>
                    <Text>{Math.round(weather.temp)}°C</Text>
                    <Text>
                        {weather.main} {weatherEmoji(weather.main)}
                    </Text>
                    <Text>{weather.description}</Text>
                </>
            ) : (
                <Text>Weather unavailable</Text>
            )}
            {/* MOOD BUTTONS */}
            <Button title="😊 Happy" style={"moodBtn"} />
            <Button title="😌 Calm" style={"moodBtn"} />
            <Button title="⚡ Energetic" style={"moodBtn"} />
            <Button title="🌧️ Melancholy" style={"moodBtn"} />
            <Button title="💘 Romantic" style={"moodBtn"} />
            <Button title="Generat Playlist" onPress={() => nav.navigate('Playlist')} />

            {/* NAV */}
            <Text>🎵</Text>
            <Button title="Playlist" onPress={() => nav.navigate('Playlist')} />
            <Text>🏠</Text>
            <Button title="Home" onPress={() => nav.navigate('Home')} />
            <Text>⚙️</Text>
            <Button title="Profile" onPress={() => nav.navigate('Profile')} />
        </View>
    );
}