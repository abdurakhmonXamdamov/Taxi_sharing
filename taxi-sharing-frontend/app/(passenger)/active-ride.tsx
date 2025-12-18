import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useWebSocket } from '../../src/context/WebSocketContext';

type RideStatus = 'pending' | 'driver_arriving' | 'in_progress' | 'completed';

type DriverInfo = {
  name: string;
  phone: string;
  rating: number;
  vehicle_model: string;
  vehicle_plate: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

export default function ActiveRideScreen() {
  const router = useRouter();
  const { subscribe } = useWebSocket();

  const [rideStatus, setRideStatus] = useState<RideStatus>('driver_arriving');
  const [driver, setDriver] = useState<DriverInfo>({
    name: 'John Doe',
    phone: '+998901234567',
    rating: 4.8,
    vehicle_model: 'Toyota Camry',
    vehicle_plate: '01 A 123 BC',
    location: {
      latitude: 41.2995,
      longitude: 69.2401,
    },
  });
  const [estimatedTime, setEstimatedTime] = useState(5); // minutes

  useEffect(() => {
    // Subscribe to driver location updates
    const unsubscribeLocation = subscribe('driver_location', (data: any) => {
      console.log('Driver location update:', data);
      setDriver(prev => ({
        ...prev,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      }));
    });

    // Subscribe to ride status updates
    const unsubscribeStatus = subscribe('ride_status', (data: any) => {
      console.log('Ride status update:', data);
      setRideStatus(data.status);

      if (data.status === 'completed') {
        Alert.alert(
          'Ride Completed! 🎉',
          'Thank you for riding with us!',
          [
            {
              text: 'Rate Driver',
              onPress: () => router.replace('./(passenger)/rate-ride'),
            },
          ]
        );
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStatus();
    };
  }, [subscribe]);

  const handleCallDriver = () => {
    const phoneUrl = `tel:${driver.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Cannot make phone calls on this device');
        }
      })
      .catch((err) => console.error('Error opening phone:', err));
  };

  const handleMessageDriver = () => {
    Alert.alert('Coming Soon', 'Chat feature will be available soon!');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride? You may be charged a cancellation fee.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to cancel ride
            Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
            router.replace('/(passenger)/home');
          },
        },
      ]
    );
  };

  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'driver_arriving':
        return {
          title: 'Driver is on the way',
          subtitle: `Arriving in ${estimatedTime} minutes`,
          icon: 'car-outline' as const,
          color: COLORS.primary,
        };
      case 'in_progress':
        return {
          title: 'Trip in progress',
          subtitle: 'Enjoy your ride!',
          icon: 'navigate' as const,
          color: COLORS.success,
        };
      case 'completed':
        return {
          title: 'Ride completed',
          subtitle: 'Thank you for riding!',
          icon: 'checkmark-circle' as const,
          color: COLORS.success,
        };
      default:
        return {
          title: 'Waiting...',
          subtitle: 'Please wait',
          icon: 'time-outline' as const,
          color: COLORS.textSecondary,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.primary} />
          <Text style={styles.mapText}>Live Tracking Map</Text>
          <Text style={styles.mapSubtext}>
            Driver Location: {driver.location.latitude.toFixed(4)}, {driver.location.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={styles.bottomCard}>
        {/* Driver Header */}
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driver.name[0]}</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.ratingText}>{driver.rating}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleCallDriver}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMessageDriver}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleRow}>
            <Ionicons name="car-sport" size={20} color={COLORS.textSecondary} />
            <Text style={styles.vehicleText}>{driver.vehicle_model}</Text>
          </View>
          <View style={styles.vehicleRow}>
            <Ionicons name="document-text" size={20} color={COLORS.textSecondary} />
            <Text style={styles.vehicleText}>{driver.vehicle_plate}</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <View style={styles.tripRow}>
          <View style={[styles.locationDot, styles.pickupDot]} />
            <Text style={styles.locationText} numberOfLines={1}>
              Amir Temur Square
            </Text>
          </View>
          <View style={styles.locationLine} />
          <View style={styles.tripRow}>
            <View style={[styles.locationDot, styles.dropoffDot]} />
            <Text style={styles.locationText} numberOfLines={1}>
              Tashkent City
            </Text>
          </View>
        </View>

        {/* Fare */}
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>25,000 UZS</Text>
        </View>

        {/* Cancel Button */}
        {rideStatus !== 'completed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRide}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 24,
  },
  mapText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  mapSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomCard: {
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
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 6,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tripInfo: {
    marginBottom: 20,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pickupDot: {
    backgroundColor: COLORS.success,
  },
  dropoffDot: {
    backgroundColor: COLORS.error,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.error,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
  },
});