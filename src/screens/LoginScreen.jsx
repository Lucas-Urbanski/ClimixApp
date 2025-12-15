import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import SHA256 from "crypto-js/sha256";
import encHex from "crypto-js/enc-hex";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import AppButton from "../components/appButton.jsx";
import createDayNightStyles from "../assets/styles/dayNightStyles.js";
import useDayNight from "../components/useDayNight.jsx";


function hashPassword(password) {
    return SHA256(password).toString(encHex);
}

export default function LoginScreen() {
    const nav = useNavigation();
    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function createAccount() {
        setError("");

        if (!username.trim()) {
            setError("Please enter a user name.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            const raw = await AsyncStorage.getItem("users");
            const users = raw ? JSON.parse(raw) : {};

            if (users[username]) {
                setError("That username already exists.");
                setLoading(false);
                return;
            }

            const hashed = hashPassword(password);

            users[username] = {
                hash: hashed,
                createdAt: new Date().toISOString(),
            };

            await AsyncStorage.setItem("users", JSON.stringify(users));
            await AsyncStorage.setItem("currentUser", JSON.stringify({ username }));

            nav.reset({
                index: 0,
                routes: [{ name: "Home" }],
            });
        } catch (err) {
            console.log("createAccount error:", err);
            setError("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    const ErrorMessage = () =>
        error ? <Text style={[styles.errorText, isDaytime ? styles.errorDay : styles.errorNight]}>{error}</Text> : null;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={[shared.contentContainer, styles.container]}>
                    <Text style={[styles.title, isDaytime ? styles.textDay : styles.textNight]}>
                        Create Account
                    </Text>

                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="User Name"
                        placeholderTextColor={isDaytime ? "#6b7990" : "#aab8d9"}
                        style={[styles.input, isDaytime ? styles.inputDay : styles.inputNight]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        accessible
                        accessibilityLabel="User Name"
                    />

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={isDaytime ? "#6b7990" : "#aab8d9"}
                        secureTextEntry
                        style={[styles.input, isDaytime ? styles.inputDay : styles.inputNight]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        accessible
                        accessibilityLabel="Password"
                    />

                    <TextInput
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Confirm Password"
                        placeholderTextColor={isDaytime ? "#6b7990" : "#aab8d9"}
                        secureTextEntry
                        style={[styles.input, isDaytime ? styles.inputDay : styles.inputNight]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        accessible
                        accessibilityLabel="Confirm Password"
                    />

                    <ErrorMessage />

                    <AppButton
                        title={loading ? "Creating…" : "Create Account"}
                        onPress={createAccount}
                        style={[styles.createBtn]}
                        disabled={loading}
                    />

                    <View style={styles.row}>
                        <Text style={[styles.smallText, isDaytime ? styles.subTextDay : styles.subTextNight]}>
                            Already have an account?
                        </Text>
                        <AppButton
                            title="Sign In"
                            onPress={() => nav.navigate("Signin")}
                            style={[styles.smallBtn]}
                            textStyle={styles.smallBtnText}
                        />
                    </View>

                    <Text style={[styles.securityNote, isDaytime ? styles.subTextDay : styles.subTextNight]}>
                        Note: This demo stores credentials locally for testing only. For production use secure storage and server-side authentication.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 18,
        textAlign: "center",
    },

    input: {
        width: "100%",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 16,
    },

    inputDay: {
        backgroundColor: "#FFFFFF",
        color: "#022F40",
    },

    inputNight: {
        backgroundColor: "#142533",
        color: "#FFFFFF",
    },

    createBtn: {
        marginTop: 6,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#8A2BE2",
    },

    row: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    smallText: {
        fontSize: 14,
    },

    smallBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "transparent",
    },

    smallBtnText: {
        color: "#8A2BE2",
        fontWeight: "700",
    },

    playlistMeta: {
        fontSize: 12,
    },

    securityNote: {
        marginTop: 18,
        fontSize: 12,
        opacity: 0.8,
    },

    errorText: {
        marginTop: 6,
        marginBottom: 6,
        fontSize: 14,
        fontWeight: "600",
    },

    errorDay: {
        color: "#8B0000",
    },

    errorNight: {
        color: "#FF7B7B",
    },

    textDay: {
        color: "#022F40",
    },
    textNight: {
        color: "#FFFFFF",
    },

    subTextDay: {
        color: "#0B4660",
    },
    subTextNight: {
        color: "#DCDFF8",
    },
});