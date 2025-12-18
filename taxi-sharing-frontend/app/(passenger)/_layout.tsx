import { Stack } from 'expo-router';

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="request-ride" />
      <Stack.Screen name="waiting" />
      <Stack.Screen name="active-ride" />
      <Stack.Screen name="rate-ride" />
      <Stack.Screen name="rides" />
    </Stack>
  );
}