import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/colors';

export default function DriverRidesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Rides History</Text>
      <Text style={styles.subtext}>Coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});