import { Button, ScrollView, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const nav = useNavigation();

    return (
        <View>
            <Text>15°C</Text>
            <Text>Sunny☀️</Text>
            <Button title="😊 Happy" class="moodBtn"/>
            <Button title="😌 Calm" class="moodBtn"/>
            <Button title="⚡ Energetic" class="moodBtn"/>
            <Button title="🌧️ Melancholy" class="moodBtn"/>
            <Button title="💘 Romantic" class="moodBtn"/>
            <Text>🎵</Text>
            <Button title="Playlist" onPress={() => nav.navigate('Playlist')} />
            <Text>🏠</Text>
            <Button title="Home" onPress={() => nav.navigate('Home')} />
            <Text>⚙️</Text>
            <Button title="Profile" onPress={() => nav.navigate('Profile')} />
            
        </View>
    );
}