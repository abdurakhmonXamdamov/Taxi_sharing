import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function DriverProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.[0]?.toUpperCase() || 'D'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color={COLORS.primary} />
          <Text style={styles.ratingText}>4.8 (127 rides)</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="car-outline" size={24} color={COLORS.textPrimary} />
          <Text style={styles.menuText}>Vehicle Information</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="card-outline" size={24} color={COLORS.textPrimary} />
          <Text style={styles.menuText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.textPrimary} />
          <Text style={styles.menuText}>Documents</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
     
        <TouchableOpacity style={styles.menuItem}>
      <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
      <Text style={styles.menuText}>Settings</Text>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
      <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
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
alignItems: 'center',
paddingVertical: 40,
backgroundColor: COLORS.backgroundLight,
},
avatar: {
width: 100,
height: 100,
borderRadius: 50,
backgroundColor: COLORS.primary,
justifyContent: 'center',
alignItems: 'center',
marginBottom: 16,
},
avatarText: {
fontSize: 40,
fontWeight: 'bold',
color: COLORS.textPrimary,
},
name: {
fontSize: 24,
fontWeight: 'bold',
color: COLORS.textPrimary,
marginBottom: 4,
},
email: {
fontSize: 16,
color: COLORS.textSecondary,
marginBottom: 12,
},
ratingContainer: {
flexDirection: 'row',
alignItems: 'center',
},
ratingText: {
fontSize: 16,
color: COLORS.textPrimary,
marginLeft: 8,
fontWeight: '600',
},
menu: {
padding: 20,
},
menuItem: {
flexDirection: 'row',
alignItems: 'center',
paddingVertical: 16,
borderBottomWidth: 1,
borderBottomColor: COLORS.border,
},
menuText: {
flex: 1,
fontSize: 16,
color: COLORS.textPrimary,
marginLeft: 16,
},
});