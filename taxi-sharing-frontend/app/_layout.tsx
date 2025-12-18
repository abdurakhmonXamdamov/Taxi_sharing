import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebSocketProvider } from '../src/context/WebSocketContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
      <WebSocketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(passenger)" />
          <Stack.Screen name="(driver)" />
        </Stack>
        </WebSocketProvider>
      </AuthProvider>

      <Toast />
    </SafeAreaProvider>
  
  );
}