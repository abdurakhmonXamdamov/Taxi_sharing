from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Driver, Passanger

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'phone_number', 'avatar', 'is_verified']
        read_only_fields = ['id', 'is_verified']

class RegisterSerializer(serializers.ModelSerializer):
    """User registration"""
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password (minimum 8 characters)"
        )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirm password"
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type', 'phone_number']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        # Create profile based on user type
        if user.user_type == 'driver':
            Driver.objects.create(user=user)
        elif user.user_type == 'passenger':
            Passanger.objects.create(user=user)
        
        return user

class LoginSerializer(serializers.Serializer):
    """User login"""
    username = serializers.CharField()
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Your password"
    )
    
    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")

class DriverSerializer(serializers.ModelSerializer):
    """Driver profile details"""
    user = UserSerializer(read_only=True)
    is_profile_complete = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['total_rides', 'total_earnings', 'rating']

class PassengerSerializer(serializers.ModelSerializer):
    """Passenger profile details"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Passanger
        fields = '__all__'
        read_only_fields = ['total_rides']

class DriverLocationUpdateSerializer(serializers.Serializer):
    """Update driver location"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    status = serializers.ChoiceField(choices=['available', 'on_trip', 'offline'], required=False)

class NearbyDriversSerializer(serializers.Serializer):
    """Search for nearby drivers"""
    latitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Your current latitude (e.g., 41.299500)"
    )
    longitude = serializers.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Your current longitude (e.g., 69.240100)"
    )
    radius = serializers.IntegerField(
        default=5,
        required=False,
        min_value=1,
        max_value=50,
        help_text="Search radius in kilometers (1-50 km, default: 5km)"
    )