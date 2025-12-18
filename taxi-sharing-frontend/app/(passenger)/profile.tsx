import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
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
//     <View style={styles.container}>

// <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Profile</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <View style={styles.header}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>
//             {user?.first_name?.[0]?.toUpperCase() || '?'}
//           </Text>
//         </View>
//         <Text style={styles.name}>
//           {user?.first_name} {user?.last_name}
//         </Text>
//         <Text style={styles.email}>{user?.email}</Text>
//       </View>

//       <View style={styles.menu}>
//         <TouchableOpacity style={styles.menuItem}>
//           <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
//           <Text style={styles.menuText}>Edit Profile</Text>
//           <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.menuItem}>
//           <Ionicons name="card-outline" size={24} color={COLORS.textPrimary} />
//           <Text style={styles.menuText}>Payment Methods</Text>
//           <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.menuItem}>
//           <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
//           <Text style={styles.menuText}>Settings</Text>
//           <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
//           <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
<View style={styles.container}>
{/* ✅ ADD BACK BUTTON */}
<View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => router.back()}
  >
    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Profile</Text>
  <View style={{ width: 40 }} />
</View>

{/* Profile Content */}
<View style={styles.profileHeader}>
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>
      {user?.first_name?.[0]?.toUpperCase() || '?'}
    </Text>
  </View>
  <Text style={styles.name}>
    {user?.first_name} {user?.last_name}
  </Text>
  <Text style={styles.email}>{user?.email}</Text>
</View>

<View style={styles.menu}>
  <TouchableOpacity style={styles.menuItem}>
    <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
    <Text style={styles.menuText}>Edit Profile</Text>
    <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem}>
    <Ionicons name="card-outline" size={24} color={COLORS.textPrimary} />
    <Text style={styles.menuText}>Payment Methods</Text>
    <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem}>
    <Ionicons name="time-outline" size={24} color={COLORS.textPrimary} />
    <Text style={styles.menuText}>Ride History</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  profileHeader: {
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