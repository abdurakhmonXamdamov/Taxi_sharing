import api from './api';
import { ENDPOINTS } from '../constants/config';

// Get all rides
export const getRides = async () => {
  try {
    const response = await api.get(ENDPOINTS.RIDES);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get rides error:', error.response?.data);
    return { success: false, error: 'Failed to fetch rides' };
  }
};

// Create ride
export const createRide = async (rideData) => {
  try {
    const response = await api.post(ENDPOINTS.CREATE_RIDE, rideData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Create ride error:', error.response?.data);
    return { success: false, error: 'Failed to create ride' };
  }
};

// Get ride detail
export const getRideDetail = async (rideId) => {
  try {
    const response = await api.get(ENDPOINTS.RIDE_DETAIL(rideId));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get ride detail error:', error.response?.data);
    return { success: false, error: 'Failed to fetch ride details' };
  }
};

// Cancel ride
export const cancelRide = async (rideId) => {
  try {
    const response = await api.post(ENDPOINTS.CANCEL_RIDE(rideId));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Cancel ride error:', error.response?.data);
    return { success: false, error: 'Failed to cancel ride' };
  }
};

// Driver: Accept ride
export const acceptRide = async (rideId) => {
  try {
    const response = await api.post(ENDPOINTS.ACCEPT_RIDE(rideId));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Accept ride error:', error.response?.data);
    return { success: false, error: 'Failed to accept ride' };
  }
};