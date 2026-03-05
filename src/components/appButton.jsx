import { Pressable, Text, StyleSheet } from 'react-native';

export default function AppButton({ title, onPress, style, textStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 5,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
