import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppButton from "../components/appButton.jsx";
import createDayNightStyles from "../assets/styles/dayNightStyles";
import useDayNight from "../components/useDayNight";
import SHA256 from "crypto-js/sha256";
import encHex from "crypto-js/enc-hex";

function hashPassword(password) {
    return SHA256(password).toString(encHex);
}

export default function ProfileScreen() {
    const nav = useNavigation();

    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");

    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const currentRaw = await AsyncStorage.getItem("currentUser");
            if (!currentRaw) {
                nav.reset({ index: 0, routes: [{ name: "Signin" }] });
                return;
            }

            const { username } = JSON.parse(currentRaw);
            setUsername(username);
            setNewUsername(username);

            const usersRaw = await AsyncStorage.getItem("users");
            const users = usersRaw ? JSON.parse(usersRaw) : {};
            const user = users[username];

            if (user) {
                setBio(user.bio || "");
                setAvatarUrl(user.avatar || null);
            }
        } catch (e) {
            console.log("Profile load error", e);
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile() {
        try {
            const usersRaw = await AsyncStorage.getItem("users");
            const users = usersRaw ? JSON.parse(usersRaw) : {};

            if (!users[username]) return;

            // Username change 
            if (newUsername !== username) {
                if (users[newUsername]) {
                    Alert.alert("Error", "That username already exists.");
                    return;
                }

                users[newUsername] = { ...users[username] };
                delete users[username];

                await AsyncStorage.setItem(
                    "currentUser",
                    JSON.stringify({ username: newUsername })
                );

                setUsername(newUsername);
            }

            // Password change 
            if (newPassword) {
                if (newPassword.length < 6) {
                    Alert.alert("Error", "Password must be at least 6 characters.");
                    return;
                }
                if (newPassword !== confirmPassword) {
                    Alert.alert("Error", "Passwords do not match.");
                    return;
                }

                users[newUsername].hash = hashPassword(newPassword);
            }

            // Save profile fields
            users[newUsername].bio = bio;
            users[newUsername].avatar = avatarUrl;

            await AsyncStorage.setItem("users", JSON.stringify(users));

            setNewPassword("");
            setConfirmPassword("");

            Alert.alert("Success", "Profile updated.");
        } catch (e) {
            console.log(e);
            Alert.alert("Error", "Could not save profile.");
        }
    }

    async function logout() {
        await AsyncStorage.removeItem("currentUser");
        nav.reset({ index: 0, routes: [{ name: "Signin" }] });
    }

    function changeProfilePic() {
        Alert.alert(
            "Change Photo",
            "This would open the image picker in a real app.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Use Placeholder",
                    onPress: () => setAvatarUrl("https://i.pravatar.cc/300"),
                },
            ]
        );
    }

    if (loading) {
        return (
            <View style={styles.fullContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    const formatNav = (emoji, label) => `${emoji}\n${label}`;

    return (
        <View style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                {/* Avatar */}
                <View style={styles.headerSection}>
                    <TouchableOpacity onPress={changeProfilePic}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>
                                    {username.slice(0, 2).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.usernameTitle}>{username}</Text>
                </View>

                {/* Profile */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, isDaytime ? styles.labelDay : styles.labelNight]}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                    />

                    <Text style={[styles.label, isDaytime ? styles.labelDay : styles.labelNight]}>Bio</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        value={bio}
                        onChangeText={setBio}
                        multiline
                    />

                    <Text style={[styles.label, isDaytime ? styles.labelDay : styles.labelNight]}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />

                    <Text style={[styles.label, isDaytime ? styles.labelDay : styles.labelNight]}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <AppButton title="Save Changes" onPress={saveProfile} />

                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
                {/* NAV */}
                <View style={[styles.navRow, isDaytime ? shared.navRowDay : shared.navRowNight]}>
                    <AppButton
                        title={formatNav("🎵", "Playlist")}
                        style={shared.navBtnBase}
                        textStyle={shared.navTextInactive}
                        onPress={() => nav.navigate("Playlist")}
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
                        textStyle={shared.navTextActive}
                        onPress={() => nav.navigate("Profile")}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 80,
    },

    headerSection: {
        alignItems: 'center',
        paddingVertical: 25,
        backgroundColor: '#262645',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#8A2BE2',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4A4A6A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#8A2BE2',
    },
    avatarInitials: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1C1C36',
    },
    usernameTitle: {
        fontFamily: 'cursive',
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    formSection: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        marginLeft: 4,
        fontWeight: '600',
    },
    labelDay: { color: "#2C2C4A" },
    labelNight: { color: "#FFFFFF" },
    input: {
        backgroundColor: "#2C2C4A",
        color: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        fontSize: 16,
    },
    readOnlyInput: {
        opacity: 0.6,
        backgroundColor: "#25253E",
    },
    saveBtn: {
        backgroundColor: '#8A2BE2',
    },
    logoutBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 16,
    },

    navRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 81,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        zIndex: 50,
        elevation: 10,
    }
});