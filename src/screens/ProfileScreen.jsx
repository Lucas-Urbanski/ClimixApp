import { Button, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
    const nav = useNavigation();

    return (
        <View>
            <Text>🎵</Text>
            <Button title="Playlist" onPress={() => nav.navigate('Playlist')} />
            <Text>🏠</Text>
            <Button title="Home" onPress={() => nav.navigate('Home')} />
            <Text>⚙️</Text>
            <Button title="Profile" onPress={() => nav.navigate('Profile')} />
        </View>
    );

}