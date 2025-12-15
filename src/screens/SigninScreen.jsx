import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppButton from "../components/appButton.jsx";
import SHA256 from "crypto-js/sha256";
import encHex from "crypto-js/enc-hex";
import createDayNightStyles from "../assets/styles/dayNightStyles.js";
import useDayNight from "../components/useDayNight.jsx";


function hashPassword(password) {
    return SHA256(password).toString(encHex);
}

export default function SigninScreen() {
    const nav = useNavigation();

    const { isDaytime } = useDayNight();
    const shared = createDayNightStyles(isDaytime);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function signIn() {
        setError("");

        if (!username.trim() || !password) {
            setError("Please enter both username and password.");
            return;
        }

        setLoading(true);

        try {
            const raw = await AsyncStorage.getItem("users");
            const users = raw ? JSON.parse(raw) : {};

            const user = users[username];
            if (!user) {
                setError("Invalid username or password.");
                setLoading(false);
                return;
            }

            const hashedInput = hashPassword(password);

            if (hashedInput !== user.hash) {
                setError("Invalid username or password.");
                setLoading(false);
                return;
            }

            await AsyncStorage.setItem(
                "currentUser",
                JSON.stringify({ username })
            );

            nav.reset({
                index: 0,
                routes: [{ name: "Home" }],
            });
        } catch (err) {
            console.log("signIn error:", err);
            setError("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    const ErrorMessage = () =>
        error ? <Text style={[pageStyles.errorText, isDaytime ? pageStyles.errorDay : pageStyles.errorNight]}>{error}</Text> : null;


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[shared.fullContainer, isDaytime ? shared.dayBackground : shared.nightBackground]}>
                <View style={[shared.contentContainer, pageStyles.container]}>
                    <Text style={[pageStyles.title, isDaytime ? pageStyles.textDay : pageStyles.nightText]}>
                        Sign In
                    </Text>
                    <TextInput
                        style={[pageStyles.input, isDaytime ? pageStyles.inputDay : pageStyles.inputNight]}
                        placeholder="User Name"
                        placeholderTextColor={isDaytime ? "#6b7990" : "#aab8d9"}
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                        returnKeyType="next"
                        accessible
                        accessibilityLabel="User Name"
                    />
                    <TextInput
                        style={[pageStyles.input, isDaytime ? pageStyles.inputDay : pageStyles.inputNight]}
                        placeholder="Password"
                        placeholderTextColor={isDaytime ? "#6b7990" : "#aab8d9"}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="done"
                        accessible
                        accessibilityLabel="Password"
                    />
                    <ErrorMessage />
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={isDaytime ? pageStyles.textDay.color : pageStyles.nightText.color}
                            style={{ marginVertical: 10 }}
                        />
                    ) : (
                        <AppButton
                            title="Sign In"
                            onPress={signIn}
                            style={pageStyles.primaryBtn}
                        />
                    )}
                    <View style={pageStyles.row}>
                        <Text style={[pageStyles.smallText, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]}>
                            Don't have an account?
                        </Text>
                        <AppButton
                            title="Create Account"
                            onPress={() => nav.navigate("Login")}
                            style={pageStyles.smallBtn}
                            textStyle={pageStyles.smallBtnText}
                        />
                    </View>
                    <Text style={[pageStyles.securityNote, isDaytime ? pageStyles.subTextDay : pageStyles.subTextNight]}>
                        Note: This demo stores credentials locally for testing only. For production use secure storage and server-side authentication.
                    </Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const pageStyles = StyleSheet.create({
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
    primaryBtn: {
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

    securityNote: {
        marginTop: 18,
        fontSize: 12,
        opacity: 0.8,
        textAlign: 'center',
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
    nightText: {
        color: "#FFFFFF",
    },

    subTextDay: {
        color: "#0B4660",
    },
    subTextNight: {
        color: "#DCDFF8",
    },
});