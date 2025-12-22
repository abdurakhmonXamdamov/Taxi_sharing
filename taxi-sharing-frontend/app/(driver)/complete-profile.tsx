
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../src/constants/colors';
import { API_URL } from '../../src/constants/config';

export default function CompleteDriverProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    license_number: '',
    vehicle_type: '',
    vehicle_model: '',
    vehicle_number: '',
    vehicle_color: '',
  });

  const [errors, setErrors] = useState({
    license_number: '',
    vehicle_type: '',
    vehicle_model: '',
    vehicle_number: '',
    vehicle_color: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      license_number: '',
      vehicle_type: '',
      vehicle_model: '',
      vehicle_number: '',
      vehicle_color: '',
    };

    if (!formData.license_number.trim()) {
      newErrors.license_number = 'License number is required';
      isValid = false;
    }

    if (!formData.vehicle_type.trim()) {
      newErrors.vehicle_type = 'Vehicle type is required';
      isValid = false;
    }

    if (!formData.vehicle_model.trim()) {
      newErrors.vehicle_model = 'Vehicle model is required';
      isValid = false;
    }

    if (!formData.vehicle_number.trim()) {
      newErrors.vehicle_number = 'Vehicle number is required';
      isValid = false;
    }

    if (!formData.vehicle_color.trim()) {
      newErrors.vehicle_color = 'Vehicle color is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/api/auth/driver/profile/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!',
          'Your driver profile is complete. You can now go online!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(driver)/home'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Please provide your vehicle information to start accepting rides
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* License Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              License Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.license_number && styles.inputError]}>
              <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., AA1234567"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.license_number}
                onChangeText={(text) => updateField('license_number', text)}
                autoCapitalize="characters"
              />
            </View>
            {errors.license_number ? (
              <Text style={styles.errorText}>{errors.license_number}</Text>
            ) : null}
          </View>

          {/* Vehicle Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vehicle Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.vehicle_type && styles.inputError]}>
              <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Sedan, SUV, Hatchback"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.vehicle_type}
                onChangeText={(text) => updateField('vehicle_type', text)}
              />
            </View>
            {errors.vehicle_type ? (
              <Text style={styles.errorText}>{errors.vehicle_type}</Text>
            ) : null}
          </View>

          {/* Vehicle Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vehicle Model <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.vehicle_model && styles.inputError]}>
              <Ionicons name="construct-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Chevrolet Nexia"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.vehicle_model}
                onChangeText={(text) => updateField('vehicle_model', text)}
              />
            </View>
            {errors.vehicle_model ? (
              <Text style={styles.errorText}>{errors.vehicle_model}</Text>
            ) : null}
          </View>

          {/* Vehicle Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vehicle Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.vehicle_number && styles.inputError]}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 01 A 234 BC"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.vehicle_number}
                onChangeText={(text) => updateField('vehicle_number', text)}
                autoCapitalize="characters"
              />
            </View>
            {errors.vehicle_number ? (
              <Text style={styles.errorText}>{errors.vehicle_number}</Text>
            ) : null}
          </View>

          {/* Vehicle Color */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vehicle Color <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.vehicle_color && styles.inputError]}>
              <Ionicons name="color-palette-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., White, Black, Silver"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.vehicle_color}
                onChangeText={(text) => updateField('vehicle_color', text)}
              />
            </View>
            {errors.vehicle_color ? (
              <Text style={styles.errorText}>{errors.vehicle_color}</Text>
            ) : null}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save & Continue</Text>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});


// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { COLORS } from '../../src/constants/colors';
// import { API_URL } from '../../src/constants/config';

// export default function CompleteDriverProfile() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);

//   const [formData, setFormData] = useState({
//     license_number: '',
//     vehicle_type: '',
//     vehicle_model: '',
//     vehicle_number: '',
//     vehicle_color: '',
//   });

//   const [errors, setErrors] = useState({
//     license_number: '',
//     vehicle_type: '',
//     vehicle_model: '',
//     vehicle_number: '',
//     vehicle_color: '',
//   });

//   // ✅ Load existing data if editing
//   useEffect(() => {
//     loadExistingProfile();
//   }, []);

//   const loadExistingProfile = async () => {
//     try {
//       const token = await AsyncStorage.getItem('accessToken');
//       const response = await fetch(`${API_URL}/api/auth/driver/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         console.log('📥 Existing profile:', data);
        
//         // Pre-fill form with existing data
//         if (data.license_number) {
//           setFormData({
//             license_number: data.license_number || '',
//             vehicle_type: data.vehicle_type || '',
//             vehicle_model: data.vehicle_model || '',
//             vehicle_number: data.vehicle_number || '',
//             vehicle_color: data.vehicle_color || '',
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Error loading profile:', error);
//     } finally {
//       setInitialLoading(false);
//     }
//   };

//   const validateForm = () => {
//     let isValid = true;
//     const newErrors = {
//       license_number: '',
//       vehicle_type: '',
//       vehicle_model: '',
//       vehicle_number: '',
//       vehicle_color: '',
//     };

//     if (!formData.license_number.trim()) {
//       newErrors.license_number = 'License number is required';
//       isValid = false;
//     }

//     if (!formData.vehicle_type.trim()) {
//       newErrors.vehicle_type = 'Vehicle type is required';
//       isValid = false;
//     }

//     if (!formData.vehicle_model.trim()) {
//       newErrors.vehicle_model = 'Vehicle model is required';
//       isValid = false;
//     }

//     if (!formData.vehicle_number.trim()) {
//       newErrors.vehicle_number = 'Vehicle number is required';
//       isValid = false;
//     }

//     if (!formData.vehicle_color.trim()) {
//       newErrors.vehicle_color = 'Vehicle color is required';
//       isValid = false;
//     }

//     setErrors(newErrors);
//     return isValid;
//   };

//   const handleSave = async () => {
//     if (!validateForm()) {
//       Alert.alert('Error', 'Please fill in all required fields');
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = await AsyncStorage.getItem('accessToken');

//       console.log('📤 Sending to:', `${API_URL}/api/auth/driver/profile/complete/`);
//       console.log('📤 Data:', formData);

//       // ✅ CORRECT URL: /complete-profile/ (with hyphen)
//       const response = await fetch(`${API_URL}/api/auth/driver/profile/complete/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       console.log('📥 Response status:', response.status);

//       // Check if response is JSON
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         const text = await response.text();
//         console.error('❌ Not JSON response:', text.substring(0, 500));
//         Alert.alert('Error', 'Server returned invalid response. Please try again.');
//         setLoading(false);
//         return;
//       }

//       const data = await response.json();
//       console.log('📥 Response data:', data);

//       if (response.ok) {
//         Alert.alert(
//           'Success!',
//           data.message || 'Your driver profile is complete. You can now go online!',
//           [
//             {
//               text: 'OK',
//               onPress: () => {
//                 // Go back to home - it will auto-refresh
//                 router.back();
//               },
//             },
//           ]
//         );
//       } else {
//         Alert.alert('Error', data.error || data.message || 'Failed to save profile');
//       }
//     } catch (error: any) {
//       console.error('❌ Error:', error);
//       Alert.alert('Error', 'Failed to connect to server. Please check your connection.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateField = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error when user starts typing
//     if (errors[field as keyof typeof errors]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   if (initialLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => router.back()}
//             style={styles.backButton}
//           >
//             <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Vehicle Information</Text>
//           <View style={{ width: 24 }} />
//         </View>

//         {/* Info Box */}
//         <View style={styles.infoBox}>
//           <Ionicons name="information-circle" size={24} color={COLORS.primary} />
//           <Text style={styles.infoText}>
//             Please provide your vehicle information to start accepting rides
//           </Text>
//         </View>

//         {/* Form */}
//         <View style={styles.form}>
//           {/* License Number */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               License Number <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={[styles.inputContainer, errors.license_number && styles.inputError]}>
//               <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., AA1234567"
//                 placeholderTextColor={COLORS.textSecondary}
//                 value={formData.license_number}
//                 onChangeText={(text) => updateField('license_number', text)}
//                 autoCapitalize="characters"
//               />
//             </View>
//             {errors.license_number ? (
//               <Text style={styles.errorText}>{errors.license_number}</Text>
//             ) : null}
//           </View>

//           {/* Vehicle Type */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               Vehicle Type <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={[styles.inputContainer, errors.vehicle_type && styles.inputError]}>
//               <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., Sedan, SUV, Hatchback"
//                 placeholderTextColor={COLORS.textSecondary}
//                 value={formData.vehicle_type}
//                 onChangeText={(text) => updateField('vehicle_type', text)}
//               />
//             </View>
//             {errors.vehicle_type ? (
//               <Text style={styles.errorText}>{errors.vehicle_type}</Text>
//             ) : null}
//           </View>

//           {/* Vehicle Model */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               Vehicle Model <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={[styles.inputContainer, errors.vehicle_model && styles.inputError]}>
//               <Ionicons name="construct-outline" size={20} color={COLORS.textSecondary} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., Chevrolet Nexia"
//                 placeholderTextColor={COLORS.textSecondary}
//                 value={formData.vehicle_model}
//                 onChangeText={(text) => updateField('vehicle_model', text)}
//               />
//             </View>
//             {errors.vehicle_model ? (
//               <Text style={styles.errorText}>{errors.vehicle_model}</Text>
//             ) : null}
//           </View>

//           {/* Vehicle Number */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               Vehicle Number (Plate) <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={[styles.inputContainer, errors.vehicle_number && styles.inputError]}>
//               <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., 01 A 234 BC"
//                 placeholderTextColor={COLORS.textSecondary}
//                 value={formData.vehicle_number}
//                 onChangeText={(text) => updateField('vehicle_number', text)}
//                 autoCapitalize="characters"
//               />
//             </View>
//             {errors.vehicle_number ? (
//               <Text style={styles.errorText}>{errors.vehicle_number}</Text>
//             ) : null}
//           </View>

//           {/* Vehicle Color */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               Vehicle Color <Text style={styles.required}>*</Text>
//             </Text>
//             <View style={[styles.inputContainer, errors.vehicle_color && styles.inputError]}>
//               <Ionicons name="color-palette-outline" size={20} color={COLORS.textSecondary} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., White, Black, Silver"
//                 placeholderTextColor={COLORS.textSecondary}
//                 value={formData.vehicle_color}
//                 onChangeText={(text) => updateField('vehicle_color', text)}
//               />
//             </View>
//             {errors.vehicle_color ? (
//               <Text style={styles.errorText}>{errors.vehicle_color}</Text>
//             ) : null}
//           </View>

//           {/* Save Button */}
//           <TouchableOpacity
//             style={[styles.saveButton, loading && styles.saveButtonDisabled]}
//             onPress={handleSave}
//             disabled={loading}
//             activeOpacity={0.8}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.saveButtonText}>Save Vehicle Information</Text>
//                 <Ionicons name="checkmark-circle" size={24} color="#fff" />
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
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
//     marginTop: 12,
//     fontSize: 16,
//     color: COLORS.textSecondary,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//     marginTop: Platform.OS === 'ios' ? 40 : 20,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: COLORS.textPrimary,
//   },
//   infoBox: {
//     flexDirection: 'row',
//     backgroundColor: COLORS.primaryLight + '20',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 24,
//   },
//   infoText: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 14,
//     color: COLORS.textPrimary,
//     lineHeight: 20,
//   },
//   form: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: COLORS.textPrimary,
//     marginBottom: 8,
//   },
//   required: {
//     color: COLORS.error,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   inputError: {
//     borderColor: COLORS.error,
//   },
//   input: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 16,
//     color: COLORS.textPrimary,
//   },
//   errorText: {
//     color: COLORS.error,
//     fontSize: 12,
//     marginTop: 4,
//     marginLeft: 4,
//   },
//   saveButton: {
//     flexDirection: 'row',
//     backgroundColor: COLORS.primary,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 10,
//   },
//   saveButtonDisabled: {
//     opacity: 0.6,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginRight: 8,
//   },
// });
