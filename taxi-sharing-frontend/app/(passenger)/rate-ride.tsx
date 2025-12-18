import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

export default function RateRideScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    // TODO: Submit rating to API
    Alert.alert(
      'Thank You! 🌟',
      'Your feedback helps us improve',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(passenger)/home'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Rate Your Ride</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={48}
                color={star <= rating ? COLORS.primary : COLORS.textSecondary}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment */}
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment (optional)"
          placeholderTextColor={COLORS.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitRating}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(passenger)/home')}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
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
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  star: {
    marginHorizontal: 8,
  },
  commentInput: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 24,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});