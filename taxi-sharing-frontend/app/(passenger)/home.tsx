// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   ActivityIndicator,
//   Platform,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { COLORS } from '../../src/constants/colors';
// import { useAuth } from '../../src/context/AuthContext';
// import { useWebSocket } from '../../src/context/WebSocketContext';

// export default function PassengerHome() {
//   const { user } = useAuth();
//   const { isConnected } = useWebSocket();
//   const router = useRouter();
//   const mapRef = useRef<MapView>(null); 

//   const [location, setLocation] = useState<Region | null>(null); 
//   const [loading, setLoading] = useState(true);
//   const [pickupAddress, setPickupAddress] = useState('');
//   const [dropoffAddress, setDropoffAddress] = useState('');

//   useEffect(() => {
//     requestLocationPermission();
//   }, []);

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
      
//       // Get address from coordinates
//       const addressResult = await Location.reverseGeocodeAsync({
//         latitude: newLocation.latitude,
//         longitude: newLocation.longitude,
//       });

//       if (addressResult.length > 0) {
//         const addr = addressResult[0];
//         const formattedAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
//         setPickupAddress(formattedAddress);
//       }

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

//       // Animate map to new location
//       if (mapRef.current) {
//         mapRef.current.animateToRegion(newLocation, 1000);
//       }

//       // Update address
//       const addressResult = await Location.reverseGeocodeAsync({
//         latitude: newLocation.latitude,
//         longitude: newLocation.longitude,
//       });

//       if (addressResult.length > 0) {
//         const addr = addressResult[0];
//         const formattedAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
//         setPickupAddress(formattedAddress);
//       }

//       Alert.alert('Success', 'Location updated!');
//     } catch (error) {
//       console.error('Error getting location:', error);
//       Alert.alert('Error', 'Could not get your current location');
//     }
//   };

//   const handleRequestRide = () => {
//     if (!pickupAddress.trim()) {
//       Alert.alert('Error', 'Please enter pickup location');
//       return;
//     }
//     if (!dropoffAddress.trim()) {
//       Alert.alert('Error', 'Please enter dropoff location');
//       return;
//     }

//     // TODO: Send ride request to backend
//     Alert.alert('Success', 'Ride request sent! (Feature coming soon)');
//   };

//   const handleProfilePress = () => {
//     router.push('/(passenger)/profile');
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
//         {/* Marker for pickup location */}
//         <Marker
//           coordinate={{
//             latitude: location.latitude,
//             longitude: location.longitude,
//           }}
//           title="Pickup Location"
//           description={pickupAddress}
//           pinColor={COLORS.primary}
//         />
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

//       {/* Bottom Card with Inputs */}
//       <View style={styles.bottomCard}>
//         <Text style={styles.cardTitle}>Where are you going?</Text>

//         {/* Pickup Location Input */}
//         <View style={styles.inputContainer}>
//           <Ionicons name="location" size={20} color={COLORS.success} style={styles.inputIcon} />
//           <TextInput
//             style={styles.input}
//             placeholder="Pickup location"
//             placeholderTextColor={COLORS.textSecondary}
//             value={pickupAddress}
//             onChangeText={setPickupAddress}
//           />
//           <TouchableOpacity onPress={centerOnMyLocation}>
//             <Ionicons name="navigate" size={20} color={COLORS.primary} />
//           </TouchableOpacity>
//         </View>

//         {/* Dropoff Location Input */}
//         <View style={styles.inputContainer}>
//           <Ionicons name="flag" size={20} color={COLORS.error} style={styles.inputIcon} />
//           <TextInput
//             style={styles.input}
//             placeholder="Where to?"
//             placeholderTextColor={COLORS.textSecondary}
//             value={dropoffAddress}
//             onChangeText={setDropoffAddress}
//           />
//         </View>

//         {/* Request Ride Button */}
//         <TouchableOpacity
//           style={styles.requestButton}
//           onPress={handleRequestRide}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.requestButtonText}>Request Ride</Text>
//           <Ionicons name="arrow-forward" size={20} color="#fff" />
//         </TouchableOpacity>
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
//   cardTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: COLORS.textPrimary,
//     marginBottom: 16,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginBottom: 12,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: COLORS.textPrimary,
//   },
//   requestButton: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.primary,
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginTop: 8,
//   },
//   requestButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginRight: 8,
//   },
// });
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useWebSocket } from '../../src/context/WebSocketContext';
import { SafeMapView, SafeMarker } from '../../src/components/SafeMapView.tsx';

// Type for map region
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function PassengerHome() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const router = useRouter();
  const mapRef = useRef(null);

  const [location, setLocation] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  useEffect(() => {
    requestLocationPermission();
  }, []);

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
      
      // Get address from coordinates
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const formattedAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        setPickupAddress(formattedAddress);
      }

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

      // Update address
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const formattedAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        setPickupAddress(formattedAddress);
      }

      Alert.alert('Success', 'Location updated!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const handleRequestRide = () => {
    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup location');
      return;
    }
    if (!dropoffAddress.trim()) {
      Alert.alert('Error', 'Please enter dropoff location');
      return;
    }

    Alert.alert('Success', 'Ride request sent! (Feature coming soon)');
  };

  const handleProfilePress = () => {
    router.push('/(passenger)/profile');
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
      {/* Safe Map View */}
      <SafeMapView location={location} mapRef={mapRef}>
        <SafeMarker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Pickup Location"
          description={pickupAddress}
          pinColor={COLORS.primary}
        />
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

      {/* Bottom Card with Inputs */}
      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>Where are you going?</Text>

        {/* Pickup Location Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="location" size={20} color={COLORS.success} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Pickup location"
            placeholderTextColor={COLORS.textSecondary}
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />
          <TouchableOpacity onPress={centerOnMyLocation}>
            <Ionicons name="navigate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Dropoff Location Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="flag" size={20} color={COLORS.error} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Where to?"
            placeholderTextColor={COLORS.textSecondary}
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
          />
        </View>

        {/* Request Ride Button */}
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequestRide}
          activeOpacity={0.8}
        >
          <Text style={styles.requestButtonText}>Request Ride</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  requestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});