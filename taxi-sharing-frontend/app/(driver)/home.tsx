

// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Platform,
//   Switch,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE , Region } from 'react-native-maps';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_URL } from '../../src/constants/config';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { COLORS } from '../../src/constants/colors';
// import { useAuth } from '../../src/context/AuthContext';
// import { useWebSocket } from '../../src/context/WebSocketContext';

// export default function DriverHome() {
//   const { user } = useAuth();
//   const { isConnected, sendMessage } = useWebSocket();
//   const router = useRouter();
//   const mapRef = useRef<MapView>(null);

//   const [location, setLocation] = useState<Region | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(false);
//   const [profileComplete, setProfileComplete] = useState(false); // ✅ Add this

//   useEffect(() => {
//     requestLocationPermission();
//     checkProfileCompletion(); 
//   }, []);

//    // ✅ Add this function
//    const checkProfileCompletion = async () => {
//     try {
//       const token = await AsyncStorage.getItem('accessToken');
//       const response = await fetch(`${API_URL}/api/auth/driver/profile/complete/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       const data = await response.json();
      
//       // Check if all required fields are filled
//       const isComplete = !!(
//         data.license_number &&
//         data.vehicle_type &&
//         data.vehicle_model &&
//         data.vehicle_number &&
//         data.vehicle_color
//       );

//       setProfileComplete(isComplete);
//     } catch (error) {
//       console.error('Error checking profile:', error);
//     }
//   };
//   // Send location updates when online
//   useEffect(() => {
//     if (isOnline && location && isConnected) {
//       const interval = setInterval(() => {
//         sendMessage({
//           type: 'location_update',
//           latitude: location.latitude,
//           longitude: location.longitude,
//         });
//         console.log('📍 Sent location update');
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, [isOnline, location, isConnected]);

//   const requestLocationPermission = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
      
//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission Denied',
//           'Location permission is required to use this app'
//         );
//         setLoading(false);
//         return;
//       }

//       getCurrentLocation();
//     } catch (error) {
//       console.error('Error requesting location permission:', error);
//       setLoading(false);
//     }
//   };

//   const getCurrentLocation = async () => {
//     try {
//       const currentLocation = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });

//       const newLocation = {
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       };

//       setLocation(newLocation);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error getting location:', error);
//       Alert.alert('Error', 'Could not get your current location');
//       setLoading(false);
//     }
//   };

//   const centerOnMyLocation = async () => {
//     try {
//       const currentLocation = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });

//       const newLocation = {
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       };

//       setLocation(newLocation);

//       if (mapRef.current) {
//         mapRef.current.animateToRegion(newLocation, 1000);
//       }

//       Alert.alert('Success', 'Location updated!');
//     } catch (error) {
//       console.error('Error getting location:', error);
//       Alert.alert('Error', 'Could not get your current location');
//     }
//   };

//   // const toggleOnlineStatus = () => {
//   //   setIsOnline(!isOnline);
//   //   Alert.alert(
//   //     isOnline ? 'Going Offline' : 'Going Online',
//   //     isOnline 
//   //       ? 'You will stop receiving ride requests'
//   //       : 'You will start receiving ride requests'
//   //   );
//   // };
//   const toggleOnlineStatus = () => {
//     // Check if profile is complete
//     if (!profileComplete) {
//       Alert.alert(
//         'Complete Your Profile',
//         'Please fill in your vehicle information before going online',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           {
//             text: 'Complete Profile',
//             onPress: () => router.push('/(driver)/complete-profile'),
//           },
//         ]
//       );
//       return;
//     }

//     setIsOnline(!isOnline);
//     Alert.alert(
//       isOnline ? 'Going Offline' : 'Going Online',
//       isOnline 
//         ? 'You will stop receiving ride requests'
//         : 'You will start receiving ride requests'
//     );
//   };


//   const handleProfilePress = () => {
//     router.push('/(driver)/profile');
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text style={styles.loadingText}>Getting your location...</Text>
//       </View>
//     );
//   }

//   if (!location) {
//     return (
//       <View style={styles.errorContainer}>
//         <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
//         <Text style={styles.errorText}>Could not access your location</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Map */}
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         initialRegion={location}
//         showsUserLocation={true}
//         showsMyLocationButton={false}
//         showsCompass={true}
//         zoomEnabled={true}
//         scrollEnabled={true}
//       >
//         {/* Driver's current location marker */}
//         <Marker
//           coordinate={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//           }}
//           title="You are here"
//           description="Your current location"
//         >
//           <View style={styles.driverMarker}>
//             <Ionicons name="car" size={24} color="#fff" />
//           </View>
//         </Marker>
//       </MapView>

//       {/* Profile Button */}
//       <TouchableOpacity
//         style={styles.profileButton}
//         onPress={handleProfilePress}
//         activeOpacity={0.8}
//       >
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>
//             {user?.first_name?.[0]?.toUpperCase() || '?'}
//           </Text>
//         </View>
//       </TouchableOpacity>

//       {/* My Location Button */}
//       <TouchableOpacity
//         style={styles.myLocationButton}
//         onPress={centerOnMyLocation}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="locate" size={24} color={COLORS.primary} />
//       </TouchableOpacity>

//       {/* WebSocket Connection Status */}
//       <View style={[styles.connectionStatus, {
//         backgroundColor: isConnected ? COLORS.success : COLORS.error
//       }]}>
//         <Text style={styles.connectionText}>
//           {isConnected ? '● Connected' : '● Offline'}
//         </Text>
//       </View>

//       {/* Bottom Card */}
//       <View style={styles.bottomCard}>
//         <View style={styles.statusRow}>
//           <View>
//             <Text style={styles.statusTitle}>Driver Status</Text>
//             <Text style={[styles.statusText, {
//               color: isOnline ? COLORS.success : COLORS.textSecondary
//             }]}>
//               {isOnline ? '🟢 Online - Ready for rides' : '⚫ Offline'}
//             </Text>
//           </View>
//           <Switch
//             value={isOnline}
//             onValueChange={toggleOnlineStatus}
//             trackColor={{ false: COLORS.textSecondary, true: COLORS.success }}
//             thumbColor={COLORS.background}
//           />
//         </View>

//         {isOnline && (
//           <View style={styles.infoBox}>
//             <Ionicons name="information-circle" size={20} color={COLORS.primary} />
//             <Text style={styles.infoText}>
//               Your location is being shared. You'll receive ride requests nearby.
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: COLORS.textPrimary,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//     padding: 20,
//   },
//   errorText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: COLORS.textPrimary,
//     textAlign: 'center',
//   },
//   retryButton: {
//     marginTop: 20,
//     paddingHorizontal: 30,
//     paddingVertical: 12,
//     backgroundColor: COLORS.primary,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   map: {
//     flex: 1,
//     width: '100%',
//   },
//   profileButton: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 40,
//     right: 20,
//     zIndex: 10,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   avatarText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   myLocationButton: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 40,
//     left: 20,
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   connectionStatus: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 120 : 100,
//     left: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   connectionText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   bottomCard: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 10,
//   },
//   statusRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   statusTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: COLORS.textPrimary,
//     marginBottom: 4,
//   },
//   statusText: {
//     fontSize: 16,
//   },
//   infoBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 16,
//   },
//   infoText: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 14,
//     color: COLORS.textSecondary,
//   },
//   driverMarker: {
//     backgroundColor: COLORS.primary,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
// });

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { SafeMapView, SafeMarker } from '../../src/components/SafeMapView.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../src/constants/config';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useWebSocket } from '../../src/context/WebSocketContext';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function DriverHome() {
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();
  const router = useRouter();
  const mapRef = useRef(null);

  const [location, setLocation] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    checkProfileCompletion();
  }, []);

  // Re-check profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Driver home focused - checking profile');
      checkProfileCompletion();
    }, [])
  );

  // Check if driver profile is complete
  const checkProfileCompletion = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔍 Checking profile completion...');
      
      const response = await fetch(`${API_URL}/api/auth/driver/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Profile check status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Profile data:', data);
        
        // Check if all required fields are filled
        const isComplete = !!(
          data.license_number &&
          data.vehicle_type &&
          data.vehicle_model &&
          data.vehicle_number &&
          data.vehicle_color
        );

        console.log('✅ Profile complete:', isComplete);
        setProfileComplete(isComplete);
      } else {
        console.error('❌ Failed to check profile');
        setProfileComplete(false);
      }
    } catch (error) {
      console.error('❌ Error checking profile:', error);
      setProfileComplete(false);
    }
  };

  // Send location updates when online
  useEffect(() => {
    if (isOnline && location && isConnected) {
      const interval = setInterval(() => {
        sendMessage({
          type: 'location_update',
          latitude: location.latitude,
          longitude: location.longitude,
        });
        console.log('📍 Sent location update');
      }, 5000); // Send every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isOnline, location, isConnected]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this app'
        );
        setLoading(false);
        return;
      }

      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation(newLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
      setLoading(false);
    }
  };

  const centerOnMyLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setLocation(newLocation);
      Alert.alert('Success', 'Location updated!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const toggleOnlineStatus = () => {
    console.log('🔄 Toggle pressed. Profile complete:', profileComplete);
    
    // Check if profile is complete
    if (!profileComplete) {
      Alert.alert(
        'Complete Your Profile',
        'Please fill in your vehicle information before going online',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete Profile',
            onPress: () => router.push('/(driver)/complete-profile'),
          },
        ]
      );
      return;
    }

    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Going Offline' : 'Going Online',
      isOnline 
        ? 'You will stop receiving ride requests'
        : 'You will start receiving ride requests'
    );
  };

  const handleProfilePress = () => {
    router.push('/(driver)/profile');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Could not access your location</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <SafeMapView location={location} mapRef={mapRef}>
        {/* Driver's current location marker */}
        <SafeMarker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You are here"
          description="Your current location"
        >
          <View style={styles.driverMarker}>
            <Ionicons name="car" size={24} color="#fff" />
          </View>
        </SafeMarker>
      </SafeMapView>

      {/* Profile Button */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={handleProfilePress}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnMyLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* WebSocket Connection Status */}
      <View style={[styles.connectionStatus, {
        backgroundColor: isConnected ? COLORS.success : COLORS.error
      }]}>
        <Text style={styles.connectionText}>
          {isConnected ? '● Connected' : '● Offline'}
        </Text>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Driver Status</Text>
            <Text style={[styles.statusText, {
              color: isOnline ? COLORS.success : COLORS.textSecondary
            }]}>
              {isOnline ? '🟢 Online - Ready for rides' : '⚫ Offline'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: COLORS.textSecondary, true: COLORS.success }}
            thumbColor={COLORS.background}
          />
        </View>

        {isOnline && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Your location is being shared. You'll receive ride requests nearby.
            </Text>
          </View>
        )}

        {/* Show profile incomplete warning */}
        {!profileComplete && (
          <TouchableOpacity 
            style={styles.warningBox}
            onPress={() => router.push('/(driver)/complete-profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={20} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Complete your profile to go online
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.warning} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  connectionStatus: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '600',
  },
  driverMarker: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});