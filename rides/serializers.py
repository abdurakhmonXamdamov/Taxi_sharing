from rest_framework import serializers
from .models import Ride, SharedRide
from users.serializers import UserSerializer, DriverSerializer

class RideSerializer(serializers.ModelSerializer):
    """Ride details"""
    passenger = UserSerializer(read_only=True)
    driver = UserSerializer(read_only=True)
    
    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = ['passenger', 'requested_at', 'accepted_at', 'picked_up_at', 'completed_at']

class RideCreateSerializer(serializers.ModelSerializer):
    """Create new ride"""
    class Meta:
        model = Ride
        fields = ['pickup_latitude', 'pickup_longitude', 'pickup_address', 'dropoff_latitude', 'dropoff_longitude', 'dropoff_address','ride_type']
    
    def create(self, validated_data):
        # Calculate distance and fare
        from .utils import calculate_distance, calculate_fare
        
        distance = calculate_distance(
            float(validated_data['pickup_latitude']),
            float(validated_data['pickup_longitude']),
            float(validated_data['dropoff_latitude']),
            float(validated_data['dropoff_longitude'])
        )
        
        fare = calculate_fare(distance, validated_data['ride_type'])
        
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
    review = serializers.CharField(required=False, allow_blank=True)