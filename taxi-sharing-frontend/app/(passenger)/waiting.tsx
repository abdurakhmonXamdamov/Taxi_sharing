import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useWebSocket } from '../../src/context/WebSocketContext';

export default function WaitingScreen() {
  const router = useRouter();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Listen for driver acceptance
    const unsubscribe = subscribe('ride_accepted', (data: any) => {
      console.log('Driver accepted:', data);
      
      Alert.alert(
        'Driver Found! 🎉',
        `${data.driver_name} is on the way!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('./(passenger)/active-ride'),
          },
        ]
      );
    });

    return () => unsubscribe();
  }, [subscribe]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to cancel ride
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animation */}
        <View style={styles.animationContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseMiddle}>
              <View style={styles.pulseInner}>
                <Ionicons name="car" size={48} color={COLORS.primary} />
              </View>
            </View>
          </View>
        </View>

        {/* Status */}
        <Text style={styles.title}>Finding a driver...</Text>
        <Text style={styles.subtitle}>
          Please wait while we match you with a nearby driver
        </Text>

        {/* Loading */}
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Average wait time: 2-5 minutes</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Searching within 5 km radius</Text>
          </View>
        </View>
      </View>

      {/* Cancel Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  animationContainer: {
    marginBottom: 40,
  },
  pulseOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseMiddle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginVertical: 32,
  },
  infoBox: {
    width: '100%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bottomContainer: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.error,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
});