import api from './api';
import { ENDPOINTS } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login
export const login = async (username, password) => {
  try {
    const response = await api.post(ENDPOINTS.LOGIN, {
      username,
      password,
    });

    const { access, refresh, user } = response.data;

    // Save tokens and user data
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    await AsyncStorage.setItem('userData', JSON.stringify(user));

    return { success: true, data: response.data };
  } catch (error) {
    // console.error('Login error:', error.response?.data);

    // Better error handling
    let errorMessage = 'Login failed';
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle different error formats
      if (errorData.non_field_errors) {
        errorMessage = errorData.non_field_errors[0];
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.username) {
        errorMessage = `Username: ${errorData.username[0]}`;
      } else if (errorData.password) {
        errorMessage = `Password: ${errorData.password[0]}`;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }

    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// Register
export const register = async (userData) => {
  try {
    const response = await api.post(ENDPOINTS.REGISTER, userData);

    const { access, refresh, user } = response.data;

    // Save tokens and user data
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    await AsyncStorage.setItem('userData', JSON.stringify(user));

    return { success: true, data: response.data };
  } catch (error) {
    // console.error('Register error:', error.response?.data);

    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle field-specific errors
      if (errorData.username) {
        errorMessage = `Username: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`;
      } else if (errorData.email) {
        errorMessage = `Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`;
      } else if (errorData.password) {
        errorMessage = `Password: ${Array.isArray(errorData.password) ? errorData.password[0] : errorData.password}`;
      } else if (errorData.phone_number) {
        errorMessage = `Phone: ${Array.isArray(errorData.phone_number) ? errorData.phone_number[0] : errorData.phone_number}`;
      } else if (errorData.non_field_errors) {
        errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    }

    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Logout
export const logout = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    // console.error('Get user error:', error);
    return null;
  }
};

// Check if user is logged in
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    return false;
  }
};