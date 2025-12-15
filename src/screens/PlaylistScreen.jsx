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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppButton from "../components/appButton";
import createDayNightStyles from "../assets/styles/dayNightStyles";
import useDayNight from "../components/useDayNight";
import { generatePlaylist } from "../assets/data/spotifyApi"; // your helper
import { loginWithSpotify } from "../assets/data/auth"; // adjust path to your auth.js

export default function PlaylistScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    const { weatherCondition, temperature, mood } = route.params || {};
    const [playlists, setPlaylists] = useState([]); // optional local display
    const [recommendation, setRecommendation] = useState(null);

    // Spotify creation state
    const [creating, setCreating] = useState(false);
    const [createdPlaylist, setCreatedPlaylist] = useState(null);
    const [createdTracks, setCreatedTracks] = useState([]);

    useEffect(() => {
        if (weatherCondition) {
            const rec = getLocalRecommendationPreview(weatherCondition, temperature, mood);
            setRecommendation(rec);
        }
    }, [weatherCondition, temperature, mood]);

    function getLocalRecommendationPreview(weatherCondition, temperature, mood) {
        const mapping = {
            Clear: { emoji: "☀️", mood: "Sunny vibes", description: "Upbeat, bright tracks" },
            Clouds: { emoji: "☁️", mood: "Chill clouds", description: "Laidback and mellow" },
            Rain: { emoji: "🌧️", mood: "Rainy day", description: "Acoustic, reflective songs" },
            Snow: { emoji: "❄️", mood: "Snowy calm", description: "Ambient & calm pieces" },
        };
        return mapping[weatherCondition] || { emoji: "🎶", mood: mood || "Mixed", description: "Curated to fit your mood" };
    }

    // Open a URL in Spotify (playlist or track)
    const openUrl = async (url) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Cannot open link", url);
            }
        } catch (err) {
            console.log("openUrl error", err);
            Alert.alert("Error", "Unable to open link.");
        }
    };

    // Try to get token from storage; if missing, run loginWithSpotify
    async function ensureTokenInteractive() {
        let token = await AsyncStorage.getItem("spotifyToken");
        if (token) return token;

        // Prompt user to connect
        const proceed = await new Promise((res) =>
            Alert.alert(
                "Spotify not connected",
                "To create a playlist on Spotify you must sign in. Connect now?",
                [
                    { text: "Cancel", onPress: () => res(false), style: "cancel" },
                    { text: "Connect", onPress: () => res(true) },
                ]
            )
        );

        if (!proceed) return null;

        try {
            // Run auth flow (loginWithSpotify should persist tokens)
            const newToken = await loginWithSpotify();
            if (newToken) {
                // loginWithSpotify in auth.js should have persisted tokens into AsyncStorage,
                // but set again just in case
                await AsyncStorage.setItem("spotifyToken", newToken);
                return newToken;
            }
        } catch (err) {
            console.log("Auth error:", err);
            Alert.alert("Auth failed", "Could not connect to Spotify.");
            return null;
        }
        return null;
    }

    // Main create flow. Retries once on 401 by re-authenticating
    async function handleCreateSpotifyPlaylist() {
        setCreating(true);
        setCreatedPlaylist(null);
        setCreatedTracks([]);

        try {
            let token = await AsyncStorage.getItem("spotifyToken");
            if (!token) {
                token = await ensureTokenInteractive();
                if (!token) {
                    setCreating(false);
                    return;
                }
            }

            const name = `Climix — ${weatherCondition || "Any"} / ${mood || "auto"}`;

            // Try once
            try {
                const { playlist, tracks } = await generatePlaylist(token, weatherCondition || "Clear", mood || "happy", name);
                setCreatedPlaylist(playlist);
                setCreatedTracks(tracks || []);
                Alert.alert("Playlist created", `"${playlist.name}" added to your Spotify account.`);
                setCreating(false);
                return;
            } catch (err) {
                // If unauthorized, try re-auth once
                const message = (err && err.message) || "";
                if (message.includes("401") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("invalid")) {
                    console.log("Token appears invalid - re-authenticating");
                    // attempt interactive re-login
                    const newToken = await loginWithSpotify();
                    if (!newToken) throw err;
                    await AsyncStorage.setItem("spotifyToken", newToken);
                    // retry with new token
                    const { playlist, tracks } = await generatePlaylist(newToken, weatherCondition || "Clear", mood || "happy", name);
                    setCreatedPlaylist(playlist);
                    setCreatedTracks(tracks || []);
                    Alert.alert("Playlist created", `"${playlist.name}" added to your Spotify account.`);
                    setCreating(false);
                    return;
                }
                // other error
                throw err;
            }
        } catch (err) {
            console.log("Playlist creation failed:", err);
            Alert.alert("Error", err.message || "Could not create playlist. Try again.");
        } finally {
            setCreating(false);
        }
    }

    const formatNav = (emoji, label) => `${emoji}\n${label}`;

    return (
        <View style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}>
            <View style={[shared.contentContainer, pageStyles.contentContainer, { paddingBottom: 110 }]}>
                {recommendation ? (
                    <>
                        <Text style={[pageStyles.header, isDaytime ? pageStyles.textDay : pageStyles.textNight]}>
                            {recommendation.emoji} {recommendation.mood}
                        </Text>

                        <Text style={[pageStyles.description, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]}>
                            {recommendation.description}
                        </Text>

                        <Text style={[pageStyles.subHeader, isDaytime ? pageStyles.textDay : pageStyles.textNight]}>
                            Recommended Playlists:
                        </Text>

                        <FlatList
                            data={playlists}
                            renderItem={({ item }) => (
                                <View style={[pageStyles.playlistItem, isDaytime ? pageStyles.playlistItemDay : pageStyles.playlistItemNight]}>
                                    <Text style={[pageStyles.playlistTitle, isDaytime ? pageStyles.textDay : pageStyles.textNight]}>{item.title}</Text>
                                    <Text style={[pageStyles.playlistMeta, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]}>{item.tracks} tracks • {item.duration}</Text>
                                </View>
                            )}
                            keyExtractor={(i, idx) => (i?.id || idx).toString()}
                            ListFooterComponent={() => <View style={{ height: 12 }} />}
                        />

                        <View style={{ marginTop: 14 }}>
                            {creating ? (
                                <ActivityIndicator size="large" />
                            ) : (
                                <AppButton title="Create Spotify Playlist" onPress={handleCreateSpotifyPlaylist} />
                            )}

                            {createdPlaylist && (
                                <>
                                    <View style={{ height: 14 }} />

                                    <AppButton title="Open Playlist in Spotify" onPress={() => openUrl(createdPlaylist.external_urls?.spotify || createdPlaylist.uri)} />

                                    <Text style={[pageStyles.smallNote, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]}>
                                        {createdTracks.length} tracks added · {createdPlaylist.name}
                                    </Text>

                                    {/* Show track list */}
                                    <FlatList
                                        data={createdTracks}
                                        keyExtractor={(t, i) => (t?.id || i).toString()}
                                        renderItem={({ item }) => (
                                            <View style={[pageStyles.trackRow, isDaytime ? pageStyles.trackRowDay : pageStyles.trackRowNight]}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[pageStyles.trackTitle, isDaytime ? pageStyles.textDay : pageStyles.textNight]} numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={[pageStyles.trackArtist, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]} numberOfLines={1}>
                                                        {item.artists?.map(a => a.name).join(", ")}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity onPress={() => openUrl(item.external_urls?.spotify || item.uri)} style={pageStyles.openBtn}>
                                                    <Text style={pageStyles.openBtnText}>Open</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        ListFooterComponent={() => <View style={{ height: 12 }} />}
                                        style={{ marginTop: 12 }}
                                    />
                                </>
                            )}
                        </View>
                    </>
                ) : (
                    <Text style={[isDaytime ? pageStyles.textDay : pageStyles.textNight]}>No weather data available. Go to Home screen first.</Text>
                )}
            </View>

            {/* NAV BAR */}
            <View style={[shared.navRow, isDaytime ? shared.navRowDay : shared.navRowNight]}>
                <AppButton
                    title={formatNav("🎵", "Playlist")}
                    style={shared.navBtnBase}
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

const pageStyles = StyleSheet.create({
    contentContainer: { flex: 1, padding: 20 },
    header: { fontSize: 26, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    description: { fontSize: 16, marginBottom: 6, textAlign: "center" },
    subHeader: { fontSize: 20, fontWeight: "700", marginVertical: 12 },

    playlistItem: { padding: 16, marginBottom: 10, borderRadius: 14 },
    playlistItemDay: { backgroundColor: "#F0F6FF" },
    playlistItemNight: { backgroundColor: "#1f324a" },

    playlistTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
    playlistMeta: { fontSize: 14, marginBottom: 8 },

    playBtn: { backgroundColor: "#8A2BE2", borderRadius: 10, paddingVertical: 10 },

    textDay: { color: "#022F40" },
    textNight: { color: "#FFFFFF" },

    subTextDay: { color: "#0B4660" },
    subTextNight: { color: "#DCDFF8" },

    smallNote: { marginTop: 8, fontSize: 13, textAlign: "center" },

    /* track list */
    trackRow: {
        padding: 12,
        marginBottom: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    trackRowDay: { backgroundColor: "#F7FBFF" },
    trackRowNight: { backgroundColor: "#202d3b" },
    trackTitle: { fontSize: 14, fontWeight: "600" },
    trackArtist: { fontSize: 12, marginTop: 4 },
    openBtn: {
        backgroundColor: "#0b3b8c",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 12,
    },
    openBtnText: { color: "#fff", fontWeight: "700" },
});