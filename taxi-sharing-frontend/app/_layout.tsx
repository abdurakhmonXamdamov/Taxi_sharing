// import { Stack } from 'expo-router';
// import { AuthProvider } from '../src/context/AuthContext';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Toast from 'react-native-toast-message';
// import { WebSocketProvider } from '../src/context/WebSocketContext';

// export default function RootLayout() {
//   return (
//     <SafeAreaProvider>
//       <AuthProvider>
//       <WebSocketProvider>
//         <Stack screenOptions={{ headerShown: false }}>
//           <Stack.Screen name="index" />
//           <Stack.Screen name="login" />
//           <Stack.Screen name="register" />
//           <Stack.Screen name="(passenger)" />
//           <Stack.Screen name="(driver)" />
//         </Stack>
//         </WebSocketProvider>
//       </AuthProvider>

//       <Toast />
//     </SafeAreaProvider>
  
//   );
// }

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { WebSocketProvider } from '../src/context/WebSocketContext';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/constants/config';
import { Alert } from 'react-native';

export default function RootLayout() {
  
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        await AsyncStorage.setItem('locationPermission', 'granted');
        startLocationTracking();
      } else {
        Alert.alert(
          'Location Required',
          'This app needs location access to work',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Allow', 
              onPress: () => requestLocationPermission() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await updateLocationOnBackend(
        location.coords.latitude,
        location.coords.longitude
      );

      // Track location changes
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 50,
          timeInterval: 30000,
        },
        (newLocation) => {
          updateLocationOnBackend(
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
        }
      );
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  const updateLocationOnBackend = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/users/update-location/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json();
      console.log('📍 Location updated:', data);
    } catch (error) {
      console.error('Location update error:', error);
    }
  };

  return (
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
  );
}