**Climix - Technical Deep Dive**

Climix is a React Native mobile application that generates music playlists based on real-time weather conditions. By analyzing weather data and mapping it to musical attributes, the app creates playlists that match the user’s environment and mood.

**Security & Data Persistence**

Sensitive user credentials are secured using SHA-256 hashing via the CryptoJS library.
User data is converted into hex-encoded hashes, ensuring that plain-text credentials are never stored on the device.

Local Data Storage

This enables the app to:
- Store login sessions
- Save user preferences
- Maintain state across app restarts

All data is stored locally on the device, allowing the application to function without requiring a continuous backend connection.

**Dynamic Frontend**

The interface dynamically adjusts its appearance based on the user's local time of day.
- Daytime: Light theme
- Nighttime: Dark theme

This conditional rendering creates a more immersive and comfortable user experience while demonstrating adaptive UI design.

Navigation Architecture

Screen navigation is managed using React Navigation, enabling a structured navigation stack between key screens such as:
- Weather discovery
- Playlist generation
- User profile

The result is a smooth, bottom navigation feeling and experience.

**Backend & API Logic**

Climix retrieves real-time weather data through asynchronous API requests using JavaScript async/await patterns. This allows the app to fetch and process live weather conditions without blocking the user interface.

Mood Mapping Algorithm

A custom algorithm analyzes weather variables such as:
- Temperature
- Precipitation
- Wind speed

These values are mapped to musical attributes and playlist moods, enabling the app to generate music selections that match the current environment.

For example:
- Rainy |	Chill Lo-Fi
- Sunny |	Upbeat Pop
- Windy	| Indie Alternative

**Tech Stack**

Frontend
- React Native
- React Navigation

APIs
- Weather API
- Spotify API

Security
- CryptoJS (SHA-256 hashing)

Storage
- AsyncStorage
