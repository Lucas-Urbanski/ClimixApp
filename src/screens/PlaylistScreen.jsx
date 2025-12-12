import { useState, useEffect } from 'react';
import { Button, View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getMusicRecommendations, mockPlaylists } from '../utils/weatherToMusic';

export default function PlaylistScreen() {
    const nav = useNavigation();
    const route = useRoute();
    
    const { weatherCondition, temperature } = route.params || {};
    const [playlists, setPlaylists] = useState([]);
    const [recommendation, setRecommendation] = useState(null);

    useEffect(() => {
        if (weatherCondition) {
            // Get music recommendations based on weather
            const rec = getMusicRecommendations(weatherCondition, temperature);
            setRecommendation(rec);
            
            // Get mock playlists (replace with Spotify API call)
            const weatherPlaylists = mockPlaylists[weatherCondition] || mockPlaylists['Clear'];
            setPlaylists(weatherPlaylists);
        }
    }, [weatherCondition, temperature]);

    const renderPlaylistItem = ({ item }) => (
        <View style={styles.playlistItem}>
            <Text style={styles.playlistTitle}>{item.title}</Text>
            <Text>{item.tracks} tracks • {item.duration}</Text>
            <Button title="Play" onPress={() => console.log('Play:', item.title)} />
        </View>
    );

    return (
        <View style={styles.container}>
            {recommendation ? (
                <>
                    <Text style={styles.header}>
                        {recommendation.emoji} {recommendation.mood}
                    </Text>
                    <Text>{recommendation.description}</Text>
                    <Text>Suggested genres: {recommendation.genres.join(', ')}</Text>
                    
                    <Text style={styles.subHeader}>Recommended Playlists:</Text>
                    <FlatList
                        data={playlists}
                        renderItem={renderPlaylistItem}
                        keyExtractor={item => item.id.toString()}
                    />
                </>
            ) : (
                <Text>No weather data available. Go to Home screen first.</Text>
            )}

            {/* Navigation */}
            <View style={styles.navRow}>
                <Button title="🎵 Playlist" onPress={() => nav.navigate('Playlist')} />
                <Button title="🏠 Home" onPress={() => nav.navigate('Home')} />
                <Button title="⚙️ Profile" onPress={() => nav.navigate('Profile')} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    playlistItem: { 
        padding: 15, 
        marginVertical: 5, 
        backgroundColor: '#f0f0f0',
        borderRadius: 8 
    },
    playlistTitle: { fontSize: 16, fontWeight: 'bold' },
    navRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc'
    },
});