import React from 'react';
import { Platform, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Type definitions
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface SafeMapViewProps {
  location: Region | null;
  mapRef?: any;
  children?: React.ReactNode;
  style?: ViewStyle;
}

interface SafeMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
  children?: React.ReactNode;
}

// Web Placeholder Component
const WebMapPlaceholder: React.FC<{ location: Region | null }> = ({ location }) => (
  <View style={styles.webMapPlaceholder}>
    <Ionicons name="map-outline" size={64} color={COLORS.primary} />
    <Text style={styles.webMapText}>Map View</Text>
    {location && (
      <Text style={styles.webMapSubtext}>
        📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </Text>
    )}
    <Text style={styles.webMapNote}>
      🚀 Maps work on iOS/Android. Scan QR code to test!
    </Text>
  </View>
);

// Safe MapView Component
export const SafeMapView: React.FC<SafeMapViewProps> = ({
  location,
  mapRef,
  children,
  style,
}) => {
  // On web, show placeholder
  if (Platform.OS === 'web') {
    return <WebMapPlaceholder location={location} />;
  }

  // On native, dynamically import and render real map
  try {
    const MapView = require('react-native-maps').default;
    const { PROVIDER_GOOGLE } = require('react-native-maps');

    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={style || styles.map}
        initialRegion={location}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {children}
      </MapView>
    );
  } catch (error) {
    console.log('Map not available:', error);
    return <WebMapPlaceholder location={location} />;
  }
};

// Safe Marker Component
export const SafeMarker: React.FC<SafeMarkerProps> = ({
  coordinate,
  title,
  description,
  pinColor,
  children,
}) => {
  // On web, don't render anything (handled by placeholder)
  if (Platform.OS === 'web') {
    return null;
  }

  // On native, render real marker
  try {
    const { Marker } = require('react-native-maps');
    
    return (
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        pinColor={pinColor}
      >
        {children}
      </Marker>
    );
  } catch (error) {
    console.log('Marker not available:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  webMapSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  webMapNote: {
    fontSize: 14,
    color: COLORS.warning,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 300,
  },
});