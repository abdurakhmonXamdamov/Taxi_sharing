import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

export default function EarningsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Earnings</Text>
        <Text style={styles.earningsAmount}>245,000 UZS</Text>
        <Text style={styles.earningsSubtext}>12 rides completed</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={32} color={COLORS.primary} />
          <Text style={styles.statValue}>3,450,000</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet" size={32} color={COLORS.primary} />
          <Text style={styles.statValue}>14,200,000</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.comingSoon}>
        <Ionicons name="construct-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.comingSoonText}>Detailed earnings coming soon!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
  },
  header: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  earningsSubtext: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});