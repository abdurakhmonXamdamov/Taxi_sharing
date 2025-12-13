// API Configuration
export const API_URL = 'https://taxisharing.up.railway.app';
export const WS_URL = 'wss://taxisharing.up.railway.app';

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  TOKEN_REFRESH: '/api/token/refresh/',
  
  // User
  PROFILE: '/api/users/profile/',
  UPDATE_PROFILE: '/api/users/profile/update/',
  
  // Rides
  RIDES: '/api/rides/',
  CREATE_RIDE: '/api/rides/create/',
  RIDE_DETAIL: (id) => `/api/rides/${id}/`,
  CANCEL_RIDE: (id) => `/api/rides/${id}/cancel/`,
  
  // Driver
  DRIVER_RIDES: '/api/rides/driver/',
  ACCEPT_RIDE: (id) => `/api/rides/${id}/accept/`,
  
  // Passenger
  PASSENGER_RIDES: '/api/rides/passenger/',
  REQUEST_RIDE: '/api/rides/request/',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Taxi Sharing',
  DEFAULT_REGION: {
    latitude: 41.2995, // Tashkent
    longitude: 69.2401,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};