from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiExample #* for api 
from django.contrib.auth import get_user_model
from .models import Driver
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    DriverSerializer,
    DriverLocationUpdateSerializer,
    NearbyDriversSerializer
)

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
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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
            return Response(serializer.data)
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
                    "vehicle_model": "Chevrolet Nexia",
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
            return Response(serializer.data)
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

        #? cheks if driver fill in information or not about his car
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
        
        return Response(DriverSerializer(driver_profile).data)
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