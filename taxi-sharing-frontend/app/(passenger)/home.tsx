import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWebSocket } from '../../src/context/WebSocketContext';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

// ✅ NO IMPORTS FROM react-native-maps!

type LocationType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null;

export default function PassengerHome() {
  const { user } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const router = useRouter(); 
  const [location, setLocation] = useState<LocationType>(null);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }
    router.push('./(passenger)/request-ride');
    Alert.alert('Coming Soon!', 'Ride request feature will be available soon');
    
  };
  const handleProfilePress = () => {
    router.push('/(passenger)/profile');
  };

  useEffect(() => {
    const unsubscribeRideAccepted = subscribe('ride_accepted', (data: any) => {
      console.log('Ride accepted:', data);
      Alert.alert(
        'Ride Accepted! 🎉',
        `Driver ${data.driver_name} is on the way!`,
        [
          { 
            text: 'OK',
            onPress: () => router.push('/(passenger)/active-ride')
          }
        ]
      );
    });
  
    const unsubscribeDriverLocation = subscribe('location_update', (data: any) => {
      console.log('Driver location update:', data);
      // TODO: Update driver marker on map
    });
  
    return () => {
      unsubscribeRideAccepted();
      unsubscribeDriverLocation();
    };
  }, [subscribe]);

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
      {/* ✅ Show location info instead of map for now */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={64} color={COLORS.primary} />
        <Text style={styles.mapPlaceholderTitle}>Location Ready!</Text>
        <Text style={styles.mapPlaceholderText}>
          Lat: {location.latitude.toFixed(6)}
        </Text>
        <Text style={styles.mapPlaceholderText}>
          Lng: {location.longitude.toFixed(6)}
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          Map will be available on mobile app
        </Text>
      </View>

      {/* Profile Button - Top Left */}
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

 {/* Bottom Card - Simple Search */}
<View style={styles.bottomCard}>
  {/* Current Location Input */}
  <View style={styles.locationInputContainer}>
    <View style={styles.locationIconContainer}>
      <Ionicons name="location" as any size={20} color={COLORS.success} />
    </View>
    <TextInput
      style={styles.locationInput}
      placeholder="Current location"
      placeholderTextColor={COLORS.textSecondary}
      value="Your current location"
      editable={false}
    />
  </View>

  {/* Destination Input */}
  <View style={styles.locationInputContainer}>
    <View style={styles.locationIconContainer}>
      <Ionicons name="search" as any size={20} color={COLORS.error} />
    </View>
    <TextInput
      style={styles.locationInput}
      placeholder="Where to?"
      placeholderTextColor={COLORS.textSecondary}
      value={destination}
      onChangeText={setDestination}
    />
  </View>

  {/* Search Button */}
  <TouchableOpacity 
    style={styles.searchButton}
    onPress={handleRequestRide}
    activeOpacity={0.8}
  >
    <Ionicons name="search" as any size={24} color={COLORS.textPrimary} />
    <Text style={styles.searchButtonText}>Find Drivers</Text>
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
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ✅ Map placeholder instead of actual map
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 24,
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 14,
    paddingRight: 16,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  
});

