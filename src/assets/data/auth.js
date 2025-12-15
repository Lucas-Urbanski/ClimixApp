import { authorize } from "react-native-app-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const spotifyConfig = {
    clientId: "20f2dc127b0741219ee9daede5c691b1",
    redirectUrl: "climix://callback",
    scopes: [
        'user-read-email',
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
    ],
    serviceConfiguration: {
        authorizationEndpoint: "https://accounts.spotify.com/authorize",
        tokenEndpoint: "https://accounts.spotify.com/api/token",
    },
};

export const loginWithSpotify = async () => {
    try {
        console.log("Starting Spotify auth...");
        const result = await authorize(spotifyConfig);

        // Persist tokens
        await AsyncStorage.multiSet([
            ["spotifyToken", result.accessToken],
            ["spotifyRefreshToken", result.refreshToken],
            ["spotifyTokenExpiry", result.accessTokenExpirationDate],
        ]);

        console.log("Spotify auth result:", result);
        return result.accessToken;
    } catch (error) {
        console.error("FULL Spotify auth error:", JSON.stringify(error, null, 2));
        throw error;
    }
};