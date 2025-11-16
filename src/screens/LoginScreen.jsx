import { TextInput, Button, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const nav = useNavigation();

    return (
        <View>
            <TextInput placeholder="User Name" />
            <TextInput placeholder="Password" />
            <TextInput placeholder="confirm Password" />
            <Button title="Create Account" onPress={() => nav.navigate('Home')} />
        </View>
    );
}