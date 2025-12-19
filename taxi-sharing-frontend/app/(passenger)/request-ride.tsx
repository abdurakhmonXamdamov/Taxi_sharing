import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { createRide } from '../../src/services/rideService';

type RideType = 'solo' | 'shared';

export default function RequestRideScreen() {
  const router = useRouter();
  
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [rideType, setRideType] = useState<RideType>('solo');
  const [loading, setLoading] = useState(false);

  // Mock pricing calculation
  const calculatePrice = () => {
    const basePrice = 15000;
    const perKmPrice = 2000;
    const distance = 5.2; // Mock distance
    
    let totalPrice = basePrice + (distance * perKmPrice);
    
    if (rideType === 'shared') {
      totalPrice = totalPrice * 0.7; // 30% discount for shared
    }
    
    return Math.round(totalPrice);
  };

  const handleRequestRide = async () => {
    // Validation
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      Alert.alert('Error', 'Please enter both pickup and destination locations');
      return;
    }

    setLoading(true);

    try {
      const rideData = {
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        ride_type: rideType,
        estimated_price: calculatePrice(),
      };

      const result = await createRide(rideData);

      if (result.success) {
        Alert.alert(
          'Success! 🎉',
          'Your ride request has been sent. Waiting for a driver...',
          [
            {
              text: 'OK',
              onPress: () => router.push('./(passenger)/waiting'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to request ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedPrice = calculatePrice();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where are you going?</Text>

          {/* Pickup Location */}
          <View style={styles.locationContainer}>
          <View style={[styles.locationDot, styles.pickupDot]} />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Pickup Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup location"
                placeholderTextColor={COLORS.textSecondary}
                value={pickupLocation}
                onChangeText={setPickupLocation}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.locationLine} />

          {/* Dropoff Location */}
          <View style={styles.locationContainer}>
            <View style={[styles.locationDot, styles.dropoffDot]} />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Destination</Text>
              <TextInput
                style={styles.input}
                placeholder="Where to?"
                placeholderTextColor={COLORS.textSecondary}
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Ride Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose ride type</Text>

          <View style={styles.rideTypeContainer}>
            {/* Solo Ride */}
            <TouchableOpacity
              style={[
                styles.rideTypeCard,
                rideType === 'solo' && styles.rideTypeCardActive,
              ]}
              onPress={() => setRideType('solo')}
              disabled={loading}
            >
              <View style={styles.rideTypeIcon}>
                <Ionicons
                  name="car-sport"
                  size={32}
                  color={rideType === 'solo' ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text style={[
                styles.rideTypeName,
                rideType === 'solo' && styles.rideTypeNameActive,
              ]}>
                Solo Ride
              </Text>
              <Text style={styles.rideTypeDescription}>
                Ride alone, faster arrival
              </Text>
              {rideType === 'solo' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>

            {/* Shared Ride */}
            <TouchableOpacity
              style={[
                styles.rideTypeCard,
                rideType === 'shared' && styles.rideTypeCardActive,
              ]}
              onPress={() => setRideType('shared')}
              disabled={loading}
            >
              <View style={styles.rideTypeIcon}>
                <Ionicons
                  name="people"
                  size={32}
                  color={rideType === 'shared' ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text style={[
                styles.rideTypeName,
                rideType === 'shared' && styles.rideTypeNameActive,
              ]}>
                Shared Ride
              </Text>
              <Text style={styles.rideTypeDescription}>
                Save 30%, share with others
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-30%</Text>
              </View>
              {rideType === 'shared' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Estimate */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Estimated Fare</Text>
            <Text style={styles.priceAmount}>
              {estimatedPrice.toLocaleString()} UZS
            </Text>
          </View>
          <Text style={styles.priceNote}>
            Final price may vary based on actual distance
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.requestButton, loading && styles.requestButtonDisabled]}
          onPress={handleRequestRide}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.requestButtonText}>Requesting...</Text>
          ) : (
            <>
              <Ionicons name="car" size={24} color={COLORS.textPrimary} />
              <Text style={styles.requestButtonText}>Request Ride</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 32,
    marginRight: 16,
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
    marginLeft: 7,
    marginVertical: 4,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  rideTypeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  rideTypeCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  rideTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  rideTypeIcon: {
    marginBottom: 12,
  },
  rideTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  rideTypeNameActive: {
    color: COLORS.textPrimary,
  },
  rideTypeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  priceSection: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  requestButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});