from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiExample
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Driver, Passanger
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    DriverSerializer,
    DriverLocationUpdateSerializer,
    NearbyDriversSerializer,
    DriverProfileCompleteSerializer, PassengerSerializer
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
            
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
            
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: UserSerializer}
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })


class UserProfileView(APIView):
    """Get/Update user profile"""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: UserSerializer},
        description="Get current user profile"
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        request=UserSerializer, 
        responses={200: UserSerializer},
        description="Update current user profile (partial update allowed)",
        examples=[
            OpenApiExample(
                'Update Profile Example',
                value={
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "newemail@example.com"
                },
                request_only=True,
            )
        ]
    )
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UpdateLocationView(APIView):
    """Update user's current location (for both passengers and drivers)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request={
            'type': 'object',
            'properties': {
                'latitude': {'type': 'number', 'format': 'float'},
                'longitude': {'type': 'number', 'format': 'float'},
            },
            'required': ['latitude', 'longitude']
        },
        responses={200: {
            'type': 'object',
            'properties': {
                'status': {'type': 'string'},
                'message': {'type': 'string'},
                'latitude': {'type': 'number'},
                'longitude': {'type': 'number'},
                'updated_at': {'type': 'string'},
            }
        }},
        description="Update current user location (works for both passengers and drivers)",
        examples=[
            OpenApiExample(
                'Update Location Example',
                value={
                    "latitude": 41.2995,
                    "longitude": 69.2401
                },
                request_only=True,
            )
        ]
    )
    def post(self, request):
        user = request.user
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response({
                'status': 'error',
                'message': 'Latitude and longitude are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Update user's location
            user.current_latitude = latitude
            user.current_longitude = longitude
            user.location_updated_at = timezone.now()
            user.location_permission_granted = True
            user.save()
            
            # If driver, also update driver profile location
            if user.user_type == 'driver':
                try:
                    driver_profile = user.driver_profile
                    driver_profile.current_latitude = latitude
                    driver_profile.current_longitude = longitude
                    driver_profile.save()
                    
                    # Broadcast driver location via WebSocket
                    self.broadcast_driver_location(driver_profile)
                except Driver.DoesNotExist:
                    pass
            
            return Response({
                'status': 'success',
                'message': 'Location updated successfully',
                'latitude': float(user.current_latitude),
                'longitude': float(user.current_longitude),
                'updated_at': user.location_updated_at.isoformat()
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Failed to update location: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def broadcast_driver_location(self, driver_profile):
        """Broadcast driver location via WebSocket"""
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                'location_updates',
                {
                    'type': 'location_broadcast',
                    'driver_id': driver_profile.user.id,
                    'latitude': str(driver_profile.current_latitude),
                    'longitude': str(driver_profile.current_longitude),
                    'status': driver_profile.status,
                }
            )
            
            print(f"📍 Broadcasted location for driver {driver_profile.user.username}")
            
        except Exception as e:
            print(f"❌ Error broadcasting location: {e}")


class CompleteDriverProfileView(APIView):
    """Complete driver profile - first time setup"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=DriverProfileCompleteSerializer,
        responses={200: DriverSerializer},
        description="Complete driver profile with all required vehicle information",
    )
    def post(self, request):
        print(f"🔵 CompleteDriverProfile called by user: {request.user.username}")
        print(f"🔵 User type: {request.user.user_type}")
        
        if request.user.user_type != 'driver':
            print("❌ User is not a driver")
            return Response(
                {'error': 'Only drivers can complete profile'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # ✅ Get or create driver profile (FIX: might not exist!)
            from .models import Driver
            driver, created = Driver.objects.get_or_create(user=request.user)
            
            if created:
                print(f"✅ Created new driver profile for {request.user.username}")
            else:
                print(f"✅ Found existing driver profile for {request.user.username}")
            
            # Check if already complete
            if driver.is_profile_complete and not created:
                print("⚠️ Profile already complete")
                return Response(
                    {
                        'message': 'Profile already complete',
                        'profile': DriverSerializer(driver).data
                    },
                    status=status.HTTP_200_OK
                )
            
            # Validate input
            print(f"📝 Validating data: {request.data}")
            serializer = DriverProfileCompleteSerializer(data=request.data)
            
            if not serializer.is_valid():
                print(f"❌ Validation failed: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update driver profile
            driver.license_number = serializer.validated_data['license_number']
            driver.vehicle_type = serializer.validated_data['vehicle_type']
            driver.vehicle_model = serializer.validated_data['vehicle_model']
            driver.vehicle_number = serializer.validated_data['vehicle_number']
            driver.vehicle_color = serializer.validated_data['vehicle_color']
            driver.save()
            
            print(f"✅ Profile saved successfully for {request.user.username}")
            
            return Response({
                'status': 'success',
                'message': 'Profile completed successfully! You can now go online.',
                'profile': DriverSerializer(driver).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DriverProfileView(APIView):
    """Get/Update driver profile"""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: DriverSerializer},
        description="Get driver profile"
    )
    def get(self, request):
        try:
            profile = request.user.driver_profile
            serializer = DriverSerializer(profile)

            data = serializer.data
            data['is_complete'] = profile.is_profile_complete
            data['missing_fields'] = profile.missing_fields
            return Response(data)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        request=DriverSerializer,
        responses={200: DriverSerializer},
        description="Update driver profile",
        examples=[
            OpenApiExample(
                'Update Driver Profile Example',
                value={
                    "license_number": "AA1234567",
                    "vehicle_type": "Sedan",
                    "vehicle_model": "Chevrolet Tracker",
                    "vehicle_number": "01 A 234 BC",
                    "vehicle_color": "White"
                },
                request_only=True,
            )
        ]
    )
    def put(self, request):
        try:
            profile = request.user.driver_profile
            serializer = DriverSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            data = serializer.data
            data['is_complete'] = profile.is_profile_complete
            data['missing_fields'] = profile.missing_fields

            return Response(data)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND)


class DriverLocationUpdateView(APIView):
    """Update driver's current location"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=DriverLocationUpdateSerializer,
        responses={200: DriverSerializer},
        description="Update driver location and status"
    )
    def post(self, request):
        if request.user.user_type != 'driver':
            return Response({'error': 'Only drivers can update location'}, 
                        status=status.HTTP_403_FORBIDDEN)
        
        serializer = DriverLocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        driver_profile = request.user.driver_profile

        # Check if driver filled in information or not about his car
        if not driver_profile.is_profile_complete:
            return Response({
                'error': 'Please complete your profile before going online',
                'profile_complete': False
            }, status=status.HTTP_400_BAD_REQUEST)

        driver_profile.current_latitude = serializer.validated_data['latitude']
        driver_profile.current_longitude = serializer.validated_data['longitude']
        
        if 'status' in serializer.validated_data:
            driver_profile.status = serializer.validated_data['status']
            
        driver_profile.save()
        
        # Broadcast location to all passengers
        self.broadcast_location(driver_profile)

        return Response(DriverSerializer(driver_profile).data)

    def broadcast_location(self, driver_profile):
        """Broadcast driver location via WebSocket"""
        try:
            channel_layer = get_channel_layer()
            
            # Send to all users in location_updates room
            async_to_sync(channel_layer.group_send)(
                'location_updates',  # All passengers subscribed to this
                {
                    'type': 'location_broadcast',
                    'driver_id': driver_profile.user.id,
                    'latitude': str(driver_profile.current_latitude),
                    'longitude': str(driver_profile.current_longitude),
                    'status': driver_profile.status,
                    'vehicle_type': driver_profile.vehicle_type,
                    'vehicle_model': driver_profile.vehicle_model,
                }
            )
            
            print(f"Broadcasted location for driver {driver_profile.user.username}")
            
        except Exception as e:
            print(f"❌ Error broadcasting location: {e}")


class NearbyDriversView(APIView):
    """Find nearby available drivers"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=NearbyDriversSerializer,
        responses={
            200: {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'driver':  {'type': 'object'},
                        'distance': {'type': 'number', 'format': 'float'}
                    }
                }
            }
        },
        description="Find available drivers within specified radius (km)",
        examples=[
            OpenApiExample(
                'Search Nearby Drivers',
                value={
                    "latitude": 41.299500,
                    "longitude": 69.240100,
                    "radius": 5
                },
                request_only=True,
            )
        ]
    )
    def post(self, request):
        from rides.utils import find_nearby_drivers
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        radius = request.data.get('radius', 5)  # Default 5km
        
        if not latitude or not longitude:
            return Response({'error': 'Latitude and longitude required'}, 
                        status=status.HTTP_400_BAD_REQUEST)
        
        nearby = find_nearby_drivers(float(latitude), float(longitude), radius)
        
        result = [{
            'driver': DriverSerializer(item['driver']).data,
            'distance': item['distance']
        } for item in nearby]
        
        return Response(result)


class PassengerProfileView(APIView):
    """Get/Update passenger profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: PassengerSerializer},
        description="Get passenger profile with ride statistics"
    )
    def get(self, request):
        if request.user.user_type != 'passenger':
            return Response(
                {'error': 'Only passengers can access this'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = request.user.passenger_profile
            serializer = PassengerSerializer(profile)
            return Response(serializer.data)
        except:
            return Response(
                {'error': 'Passenger profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        request=PassengerSerializer,
        responses={200: PassengerSerializer},
        description="Update passenger profile (partial updates allowed)",
        examples=[
            OpenApiExample(
                'Update Passenger Preferences',
                value={
                    "username": "Cho'm bola",
                    "user_type": "passenger, driver",
                    "phone_number": "+998901234567"
                },
                request_only=True,
            )
        ]
    )
    def put(self, request):
        if request.user.user_type != 'passenger':
            return Response(
                {'error': 'Only passengers can access this'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = request.user.passenger_profile
            serializer = PassengerSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except:
            return Response(
                {'error': 'Passenger profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DriverCurrentLocationView(APIView):
    """Get driver's current location (for passengers tracking their driver)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: {
            'type': 'object',
            'properties': {
                'driver_id': {'type': 'integer'},
                'latitude': {'type': 'string'},
                'longitude': {'type': 'string'},
                'updated_at': {'type': 'string'},
            }
        }},
        description="Get current location of a specific driver"
    )
    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(user_id=driver_id)
            
            if not driver.current_latitude or not driver.current_longitude:
                return Response(
                    {'error': 'Driver location not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'driver_id': driver.user.id,
                'latitude': str(driver.current_latitude),
                'longitude': str(driver.current_longitude),
                'status': driver.status,
                'updated_at': driver.updated_at.isoformat(),
            })
            
        except Driver.DoesNotExist:
            return Response(
                {'error': 'Driver not found'},
                status=status.HTTP_404_NOT_FOUND
            )