
import { useWebSocket } from '../../src/context/WebSocketContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

type LocationType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null;

type RideRequest = {
  id: number;
  passenger_name: string;
  pickup_location: string;
  dropoff_location: string;
  distance: string;
  estimated_price: number;
  created_at: string;
};

type WebSocketRideData = {
  ride_id: number;
  passenger_name: string;
  pickup_location: string;
  dropoff_location: string;
  distance: string;
  estimated_price: number;
  type: string;
};

export default function DriverHome() {
  const { user } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [location, setLocation] = useState<LocationType>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);

  useEffect(() => {
    getCurrentLocation();
    // TODO: Fetch ride requests from API
    loadMockRideRequests();
  }, []);
   
  useEffect(() => {
    // Subscribe to ride request events
    const unsubscribeRideRequest = subscribe('ride_request', (data: any) => {
      console.log('New ride request:', data);
      
      const newRequest: RideRequest = {
        id: data.ride_id || Date.now(),
        passenger_name: data.passenger_name || 'Unknown',
        pickup_location: data.pickup_address || 'Unknown location',  // ✅ Changed from pickup_location
        dropoff_location: data.dropoff_address || 'Unknown destination',  // ✅ Changed from dropoff_location
        distance: data.estimated_distance || 'N/A',
        estimated_price: data.fare || 0,  // ✅ Changed from estimated_price
        created_at: 'Just now',
      };
      
      setRideRequests(prev => [newRequest, ...prev]);
      
      Alert.alert(
        'New Ride Request! 🚗',
        `${newRequest.passenger_name} needs a ride`,
        [{ text: 'OK' }]
      );
    });
  
    // Subscribe to ride cancellation
    const unsubscribeRideCancel = subscribe('ride_cancelled', (data: any) => {
      console.log('Ride cancelled:', data);
      setRideRequests(prev => prev.filter(r => r.id !== data.ride_id));
    });
  
    return () => {
      unsubscribeRideRequest();
      unsubscribeRideCancel();
    };
  }, [subscribe]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
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
  

  const loadMockRideRequests = () => {
    // Mock data - replace with API call later
    const mockRequests: RideRequest[] = [
      {
        id: 1,
        passenger_name: 'John Doe',
        pickup_location: 'Amir Temur Square',
        dropoff_location: 'Tashkent City',
        distance: '5.2 km',
        estimated_price: 25000,
        created_at: '2 mins ago',
      },
      {
        id: 2,
        passenger_name: 'Sarah Smith',
        pickup_location: 'Minor Mosque',
        dropoff_location: 'Chorsu Bazaar',
        distance: '3.8 km',
        estimated_price: 18000,
        created_at: '5 mins ago',
      },
    ];
    setRideRequests(mockRequests);
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Going Offline' : 'Going Online',
      isOnline 
        ? 'You will stop receiving ride requests' 
        : 'You will start receiving ride requests'
    );
  };

  const handleAcceptRide = (rideId: number) => {
    Alert.alert(
      'Accept Ride',
      'Do you want to accept this ride request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            // TODO: Call API to accept ride
            setRideRequests(prev => prev.filter(r => r.id !== rideId));
            Alert.alert('Success', 'Ride accepted! Navigate to pickup location.');
          },
        },
      ]
    );
  };

  const handleDeclineRide = (rideId: number) => {
    setRideRequests(prev => prev.filter(r => r.id !== rideId));
  };

  const simulateRideRequest = () => {
    const mockRequest: RideRequest = {
      id: Date.now(),
      passenger_name: 'Test Passenger',
      pickup_location: 'Test Pickup Location',
      dropoff_location: 'Test Destination',
      distance: '4.5 km',
      estimated_price: 20000,
      created_at: 'Just now',
    };

    setRideRequests(prev => [mockRequest, ...prev]);
    Alert.alert('Test', 'Simulated ride request added!');
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
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="car-sport" size={64} color={COLORS.primary} />
        <Text style={styles.mapPlaceholderTitle}>Driver Mode Active</Text>
        <Text style={styles.mapPlaceholderText}>
          Lat: {location.latitude.toFixed(6)}
        </Text>
        <Text style={styles.mapPlaceholderText}>
          Lng: {location.longitude.toFixed(6)}
        </Text>
      </View>

      {/* Top Card - Driver Status */}
      <View style={styles.topCard}>
        <View style={styles.statusHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.first_name?.[0]?.toUpperCase() || 'D'}
              </Text>
            </View>
            <View>
              <Text style={styles.driverName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.ratingText}>4.8 (127 rides)</Text>
              </View>
            </View>
          </View>

          {/* Online/Offline Toggle */}
          <TouchableOpacity
            style={[styles.statusButton, isOnline && styles.statusButtonOnline]}
            onPress={toggleOnlineStatus}
            activeOpacity={0.8}
          >
            <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
            <Text style={[styles.statusButtonText, isOnline && styles.statusButtonTextOnline]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {isConnected && (
            <View style={styles.wsIndicator}>
              <View style={styles.wsDot} />
              <Text style={styles.wsText}>Live</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Card - Ride Requests */}
      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>

          <Text style={styles.cardTitle}>
            {isOnline ? 'Ride Requests' : 'Go online to receive requests'}
          </Text>
          {rideRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideRequests.length}</Text>
            </View>
          )}
        </View>
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={simulateRideRequest}
          >
            <Text style={styles.testButtonText}>🧪 Test Ride Request</Text>
          </TouchableOpacity>
        )}
        {!isOnline ? (
          <View style={styles.offlineContainer}>
            <Ionicons name="moon-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.offlineText}>
              You're currently offline
            </Text>
            <Text style={styles.offlineSubtext}>
              Turn on to start receiving ride requests
            </Text>
          </View>
        ) : rideRequests.length === 0 ? (
          <View style={styles.noRequestsContainer}>
            <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.noRequestsText}>
              Waiting for ride requests...
            </Text>
            <Text style={styles.noRequestsSubtext}>
              You'll be notified when passengers request rides nearby
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.requestsList}
            showsVerticalScrollIndicator={false}
          >
            {rideRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                {/* Request Header */}
                <View style={styles.requestHeader}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                      <Text style={styles.passengerAvatarText}>
                        {request.passenger_name[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.passengerName}>
                        {request.passenger_name}
                      </Text>
                      <Text style={styles.requestTime}>{request.created_at}</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Fare</Text>
                    <Text style={styles.price}>
                      {request.estimated_price.toLocaleString()} UZS
                    </Text>
                  </View>
                </View>

                {/* Route Info */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={styles.pickupDot} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {request.pickup_location}
                    </Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.dropoffDot} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {request.dropoff_location}
                    </Text>
                  </View>
                </View>

                {/* Distance */}
                <View style={styles.distanceContainer}>
                  <Ionicons name="navigate" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.distanceText}>{request.distance}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRide(request.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={24} color={COLORS.error} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRide(request.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={24} color={COLORS.textPrimary} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
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
  topCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statusButtonOnline: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textSecondary,
    marginRight: 8,
  },
  statusDotOnline: {
    backgroundColor: COLORS.success,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  statusButtonTextOnline: {
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
    paddingTop: 24,
    paddingHorizontal: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
    maxHeight: '50%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  offlineContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  offlineText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  offlineSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRequestsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  noRequestsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  requestsList: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  routeContainer: {
    marginVertical: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginRight: 12,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 6,
    marginVertical: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginLeft: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  wsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  wsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.background,
    marginRight: 6,
  },
  wsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  testButton: {
    backgroundColor: COLORS.info,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
