import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Linking,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppButton from "../components/appButton";
import createDayNightStyles from "../assets/styles/dayNightStyles";
import useDayNight from "../components/useDayNight";
import { generatePlaylist } from "../assets/data/spotifyApi";
import { loginWithSpotify } from "../assets/data/auth";

const LAST_PLAYLIST_KEY = "lastPlaylist";

export default function PlaylistScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    // Accept optional input when navigated from Home
    const { weatherCondition, temperature, mood } = route.params || {};

    // UI / app state
    const [hydrated, setHydrated] = useState(false);
    const [recommendation, setRecommendation] = useState(null);

    // Spotify creation state
    const [creating, setCreating] = useState(false);
    const [createdPlaylist, setCreatedPlaylist] = useState(null);
    const [createdTracks, setCreatedTracks] = useState([]);

    // MOCK GENERATOR (Fallback)
    function getMockPlaylist(weather = "Clear", moodName = "happy") {
        const moodToPrefix = {
            happy: "Sunny",
            calm: "Calm",
            energetic: "Energetic",
            melancholy: "Rainy",
            romantic: "Romantic",
        };
        const prefix = moodToPrefix[moodName] || "Mixed";
        const timestamp = Date.now();

        const playlist = {
            id: `mock-${timestamp}`,
            name: `Mock: ${prefix} ${weather} Mix`,
            external_urls: { spotify: "https://open.spotify.com" },
            uri: `spotify:user:mock:playlist:${timestamp}`,
            owner: { id: "mock_user", display_name: "Climix (Offline Mode)" },
            description: `This is a mock playlist for ${weather} / ${moodName} because Spotify was unreachable.`,
        };

        const artistPool = [
            "Aurora Lane", "The Liminals", "Neon Harbor", "Quiet Echo",
            "Paper Boats", "Midnighter", "Moon Atlas", "Harbor Lights",
            "Tide Theory", "Soft Static"
        ];

        const tracks = new Array(10).fill(0).map((_, i) => {
            const artist = artistPool[i % artistPool.length];
            const title = `${prefix} Track ${i + 1}`;
            const id = `mock-track-${i}-${timestamp}`;
            return {
                id,
                name: title,
                artists: [{ id: `artist-${i}`, name: artist }],
                uri: `spotify:track:${id}`,
                external_urls: { spotify: "https://open.spotify.com" },
                duration_ms: 180000 + i * 5000,
            };
        });

        return { playlist, tracks };
    }

    // RESTORE DATA ON LOAD
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(LAST_PLAYLIST_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data.recommendation) setRecommendation(data.recommendation);
                    if (data.playlist) setCreatedPlaylist(data.playlist);
                    if (Array.isArray(data.tracks)) setCreatedTracks(data.tracks);
                }
            } catch (err) {
                console.log("Failed to restore last playlist:", err);
            } finally {
                if (weatherCondition) {
                    const rec = getLocalRecommendationPreview(weatherCondition, temperature, mood);
                    setRecommendation(rec);
                }
                setHydrated(true);
            }
        })();
    }, []);

    function getLocalRecommendationPreview(weather, temp, mood) {
        const mapping = {
            Clear: { emoji: "☀️", mood: "Sunny vibes", description: "Upbeat, bright tracks" },
            Clouds: { emoji: "☁️", mood: "Chill clouds", description: "Laidback and mellow" },
            Rain: { emoji: "🌧️", mood: "Rainy day", description: "Acoustic, reflective songs" },
            Snow: { emoji: "❄️", mood: "Snowy calm", description: "Ambient & calm pieces" },
        };
        return mapping[weather] || { emoji: "🎶", mood: mood || "Mixed", description: "Curated to fit your mood" };
    }

    const openUrl = async (url) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback for mock URLs or unhandled schemes
                Alert.alert("Link Unavailable", "This is a mock playlist item.");
            }
        } catch (err) {
            console.log("openUrl error", err);
        }
    };

    async function ensureTokenInteractive() {
        let token = await AsyncStorage.getItem("spotifyToken");
        if (token) return token;

        const proceed = await new Promise((res) =>
            Alert.alert(
                "Connect Spotify",
                "To create a real playlist, you need to sign in. Cancel to use offline mode.",
                [
                    { text: "Use Offline Mode", onPress: () => res(false), style: "cancel" },
                    { text: "Connect", onPress: () => res(true) },
                ]
            )
        );

        if (!proceed) return null;

        try {
            const newToken = await loginWithSpotify();
            if (newToken) {
                await AsyncStorage.setItem("spotifyToken", newToken);
                return newToken;
            }
        } catch (err) {
            console.log("Auth error:", err);
            return null;
        }
        return null;
    }

    async function persistLastPlaylist(payload) {
        try {
            await AsyncStorage.setItem(LAST_PLAYLIST_KEY, JSON.stringify(payload));
        } catch (err) {
            console.log("Failed to persist:", err);
        }
    }

    async function clearSavedPlaylist() {
        try {
            await AsyncStorage.removeItem(LAST_PLAYLIST_KEY);
            setCreatedPlaylist(null);
            setCreatedTracks([]);
            Alert.alert("Cleared", "Playlist removed.");
        } catch (err) {
            console.log("Failed to clear", err);
        }
    }

    // MAIN CREATE FUNCTION
    async function handleCreateSpotifyPlaylist() {
        setCreating(true);
        setCreatedPlaylist(null);
        setCreatedTracks([]);

        try {
            // Get Token
            let token = await AsyncStorage.getItem("spotifyToken");
            if (!token) {
                token = await ensureTokenInteractive();
            }

            // Prepare Name
            const name = `Climix — ${weatherCondition || "Weather"} / ${mood || "Mix"}`;

            // If no token, use mock immediately
            if (!token) {
                throw new Error("No Spotify token provided. Using Mock.");
            }

            //  Try Real Spotify API
            const { playlist, tracks } = await generatePlaylist(token, weatherCondition || "Clear", mood || "happy", name);

            // Success!
            setCreatedPlaylist(playlist);
            setCreatedTracks(tracks || []);
            Alert.alert("Success", `"${playlist.name}" added to Spotify!`);

            await persistLastPlaylist({
                weatherCondition,
                mood,
                recommendation,
                playlist,
                tracks,
                createdAt: Date.now(),
            });

        } catch (err) {
            // ERROR HANDLER -> FALLBACK TO MOCK
            console.log("Spotify API failed or cancelled, using Mock:", err.message);

            const mock = getMockPlaylist(weatherCondition || "Clear", mood || "happy");
            setCreatedPlaylist(mock.playlist);
            setCreatedTracks(mock.tracks);

            if (err.message !== "User cancelled") {
                Alert.alert("Offline Mode", "Could not reach Spotify. Generated a simulation playlist for you.");
            }

            await persistLastPlaylist({
                weatherCondition,
                mood,
                recommendation,
                playlist: mock.playlist,
                tracks: mock.tracks,
                createdAt: Date.now(),
                mock: true,
            });

        } finally {
            setCreating(false);
        }
    }

    const formatNav = (emoji, label) => `${emoji}\n${label}`;

    if (!hydrated) {
        return (
            <View style={[shared.fullContainer, { justifyContent: "center" }]}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}>

            <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 }]}>
                {/* Header Section */}
                {recommendation ? (
                    <View style={styles.headerWrapper}>
                        <Text style={[styles.emojiHeader, isDaytime ? styles.textDay : styles.textNight]}>
                            {recommendation.emoji}
                        </Text>
                        <Text style={[styles.header, isDaytime ? styles.textDay : styles.textNight]}>
                            {recommendation.mood}
                        </Text>
                        <Text style={[styles.description, isDaytime ? styles.subTextDay : styles.subTextNight]}>
                            {recommendation.description}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.headerWrapper}>
                        <Text style={[styles.header, isDaytime ? styles.textDay : styles.textNight]}>
                            🎵 Playlist
                        </Text>
                        <Text style={[styles.description, isDaytime ? styles.subTextDay : styles.subTextNight]}>
                            Generate a playlist based on the weather.
                        </Text>
                    </View>
                )}

                {/* Action Button Section */}
                <View style={{ marginTop: 20, marginBottom: 20 }}>
                    {creating ? (
                        <ActivityIndicator size="large" color="#8A2BE2" />
                    ) : (
                        <AppButton
                            style={[styles.genBtn]}
                            title={createdPlaylist ? "Regenerate Playlist" : "Create Playlist"}
                            onPress={handleCreateSpotifyPlaylist}
                        />
                    )}
                </View>

                {/* Playlist */}
                {createdPlaylist && (
                    <View style={[styles.resultContainer, isDaytime ? styles.playlistItemDay : styles.playlistItemNight]}>
                        <Text style={[styles.smallNote, isDaytime ? styles.subTextDay : styles.subTextNight]}>
                            {createdPlaylist.name}
                        </Text>

                        <TouchableOpacity
                            style={styles.spotifyBtn}
                            onPress={() => openUrl(createdPlaylist.external_urls?.spotify || createdPlaylist.uri)}
                        >
                            <Text style={styles.spotifyBtnText}>Open in Spotify</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {createdTracks.map((item, index) => (
                            <View key={item.id || index} style={[styles.trackRow, isDaytime ? styles.trackRowDay : styles.trackRowNight]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.trackTitle, isDaytime ? styles.textDay : styles.textNight]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.trackArtist, isDaytime ? styles.subTextDay : styles.subTextNight]} numberOfLines={1}>
                                        {item.artists?.map(a => a.name).join(", ")}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => openUrl(item.external_urls?.spotify || item.uri)}
                                    style={styles.playIconBtn}
                                >
                                    <Text style={{ fontSize: 18 }}>▶️</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity onPress={clearSavedPlaylist} style={{ marginTop: 20, alignSelf: 'center' }}>
                            <Text style={{ color: '#FF6B6B', fontWeight: 'bold' }}>Clear Playlist</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Nav */}
            <View style={[shared.navRow, isDaytime ? shared.navRowDay : shared.navRowNight]}>
                <AppButton
                    title={formatNav("🎵", "Playlist")}
                    style={[shared.navBtnBase, shared.navBtnActive]}
                    textStyle={shared.navTextActive}
                />
                <AppButton
                    title={formatNav("🏠", "Home")}
                    style={shared.navBtnBase}
                    textStyle={shared.navTextInactive}
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
    contentContainer: { padding: 20 },
    headerWrapper: { alignItems: 'center', marginVertical: 10 },
    emojiHeader: { fontSize: 50, marginBottom: 10 },
    header: { fontSize: 26, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    description: { fontSize: 16, marginBottom: 6, textAlign: "center", fontStyle: 'italic' },

    resultContainer: {
        marginTop: 10,
        padding: 15,
        borderRadius: 16,
        width: '100%',
    },
    playlistItemDay: { backgroundColor: "#fff", elevation: 2 },
    playlistItemNight: { backgroundColor: "#262645", elevation: 2 },

    genBtn: {
        backgroundColor: "#8A2BE2"
    },

    spotifyBtn: {
        backgroundColor: '#1DB954',
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        marginVertical: 15,
    },
    spotifyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    textDay: { color: "#022F40" },
    textNight: { color: "#FFFFFF" },
    subTextDay: { color: "#555" },
    subTextNight: { color: "#A9A9A9" },

    smallNote: { fontSize: 14, textAlign: "center", fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(128,128,128,0.2)', marginBottom: 15 },

    trackRow: {
        padding: 10,
        marginBottom: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    trackRowDay: { backgroundColor: "#F7FBFF" },
    trackRowNight: { backgroundColor: "#1C1C36" },
    trackTitle: { fontSize: 14, fontWeight: "600" },
    trackArtist: { fontSize: 12, marginTop: 4 },

    playIconBtn: {
        padding: 8,
        marginLeft: 8,
    },
});