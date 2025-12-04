from rest_framework import serializers
from .models import Ride, SharedRide
from users.serializers import UserSerializer, DriverSerializer

class RideSerializer(serializers.ModelSerializer):
    """Full ride details - includes everything"""
    passenger = UserSerializer(read_only=True)
    driver = UserSerializer(read_only=True)
    
    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = [
            'passenger', 
            'driver',
            'distance',
            'fare',
            'requested_at', 
            'accepted_at', 
            'picked_up_at', 
            'completed_at'
        ]


class RideCreateSerializer(serializers.ModelSerializer):
    """Create new ride - minimal fields required"""
    class Meta:
        model = Ride
        fields = [
            'pickup_latitude', 
            'pickup_longitude', 
            'pickup_address', 
            'dropoff_latitude', 
            'dropoff_longitude', 
            'dropoff_address',
            'ride_type'
        ]
    
    def create(self, validated_data):
        """Calculate distance and fare automatically"""
        from .utils import calculate_distance, calculate_fare
        
        # Calculate distance between pickup and dropoff
        distance = calculate_distance(
            float(validated_data['pickup_latitude']),
            float(validated_data['pickup_longitude']),
            float(validated_data['dropoff_latitude']),
            float(validated_data['dropoff_longitude'])
        )
        
        # Calculate fare based on distance and ride type
        fare = calculate_fare(distance, validated_data['ride_type'])
        
        # Add calculated fields
        validated_data['distance'] = distance
        validated_data['fare'] = fare
        validated_data['passenger'] = self.context['request'].user
        
        return super().create(validated_data)

class RideStatusUpdateSerializer(serializers.Serializer):
    """Update ride status"""
    status = serializers.ChoiceField(
        choices=['pending', 'accepted', 'picked_up', 'completed', 'cancelled']
    )

class RideRatingSerializer(serializers.Serializer):
    """Rate a ride"""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(required=False, allow_blank=True, max_length=500)

class RideEstimateSerializer(serializers.Serializer):
    """Estimate ride fare before booking"""
    pickup_latitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Pickup location latitude (e.g., 41.299500)"
    )
    pickup_longitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Pickup location longitude (e.g., 69.240100)"
    )
    dropoff_latitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Dropoff location latitude (e.g., 41.311151)"
    )
    dropoff_longitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Dropoff location longitude (e.g., 69.279737)"
    )
    ride_type = serializers.ChoiceField(
        choices=['solo', 'shared'],
        default='solo',
        help_text="Type of ride: 'solo' or 'shared'"
    )