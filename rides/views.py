from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, render
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from drf_spectacular.utils import extend_schema, OpenApiExample #* for api 
from .models import Ride
from .serializers import (
    RideSerializer, RideCreateSerializer, 
    RideStatusUpdateSerializer, RideRatingSerializer, RideEstimateSerializer  
)

from django.db.models import Count, Sum, Avg, Q
from datetime import timedelta

def home(request):
    return render(request, 'rides/main.html')


class RideCreateView(generics.CreateAPIView):
    """Book a new ride"""
    serializer_class = RideCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=RideCreateSerializer,
        responses={201: RideSerializer},
        description="Create a new ride booking. Returns full ride details including ride ID."
    )
    def create(self, request, *args, **kwargs):
        # Validate input using RideCreateSerializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the ride
        ride = serializer.save()
        
        # ✅ Notify nearby drivers via WebSocket
        # self.notify_nearby_drivers(ride)
        
        # ✅ Return full ride details with ID using RideSerializer
        response_serializer = RideSerializer(ride)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def notify_nearby_drivers(self, ride):
        """Send WebSocket notification to nearby drivers"""
        from users.models import Driver
        from .utils import find_nearby_drivers
        
        try:
            # Find drivers within 5km
            nearby = find_nearby_drivers(
                float(ride.pickup_latitude),
                float(ride.pickup_longitude),
                radius_km=5
            )
            
            if not nearby:
                print(f"⚠️ No drivers found near ride #{ride.id}")
                return
            
            # Get channel layer
            channel_layer = get_channel_layer()
            
            # Send notification to each nearby driver
            notification_count = 0
            for driver_info in nearby:
                driver = driver_info['driver']
                distance = driver_info['distance']
                
                # Only notify available drivers
                if driver.status != 'available':
                    continue
                
                print(f"📢 Notifying driver {driver.user.username} about ride #{ride.id}")
                
                # Send WebSocket message to this specific driver
                async_to_sync(channel_layer.group_send)(
                    f'user_{driver.user.id}',  # Driver's personal channel
                    {
                        'type': 'new_ride_notification',
                        'ride_id': ride.id,
                        'passenger_name': f"{ride.passenger.first_name} {ride.passenger.last_name}",
                        'passenger_phone': ride.passenger.phone_number,
                        'pickup_address': ride.pickup_address,
                        'dropoff_address': ride.dropoff_address,
                        'distance_to_pickup': round(distance, 2),
                        'fare': str(ride.fare),
                        'estimated_distance': str(ride.distance),
                        'ride_type': ride.ride_type,
                    }
                )
                notification_count += 1
            
            print(f"✅ Notified {notification_count} drivers about ride #{ride.id}")
            
        except Exception as e:
            print(f"❌ Error notifying drivers: {e}")

class RideListView(generics.ListAPIView):
    """Get user's ride history"""
    serializer_class = RideSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        description="Get list of rides (passenger sees their bookings, driver sees assigned rides)"
    )
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'driver':
            return Ride.objects.filter(driver=user).order_by('-requested_at')
        else:
            return Ride.objects.filter(passenger=user).order_by('-requested_at')

class RideDetailView(generics.RetrieveAPIView):
    """Get ride details"""
    serializer_class = RideSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Ride.objects.all()

    @extend_schema(
        description="Get details of a specific ride"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

class RideAcceptView(APIView):
    """Driver accepts ride"""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=None, 
        responses={200: RideSerializer},
        description="Driver accepts a pending ride request",
        parameters=[
            OpenApiParameter(
                name='ride_id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Ride ID to accept'
            )
        ]
    )
    def post(self, request, ride_id):
        if request.user.user_type != 'driver':
            return Response(
                {'error': 'Only drivers can accept rides'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        ride = get_object_or_404(Ride, id=ride_id, status='pending')
        
        # Check if driver profile is complete
        driver_profile = request.user.driver_profile
        if not driver_profile.is_profile_complete:
            return Response(
                {'error': 'Please complete your driver profile before accepting rides'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if driver is available
        if driver_profile.status != 'available':
            return Response(
                {'error': 'Driver not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accept the ride
        ride.driver = request.user
        ride.status = 'accepted'
        ride.accepted_at = timezone.now()
        ride.save()
        
        # Update driver status
        driver_profile.status = 'on_trip'
        driver_profile.save()
        
        # ✅ Notify passenger via WebSocket
        self.notify_passenger(ride)
        
        return Response(RideSerializer(ride).data)
    
    def notify_passenger(self, ride):
        """Notify passenger that driver accepted"""
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                f'user_{ride.passenger.id}',
                {
                    'type': 'ride_accepted_notification',
                    'ride_id': ride.id,
                    'driver_name': f"{ride.driver.first_name} {ride.driver.last_name}",
                    'driver_phone': ride.driver.phone_number,
                    'vehicle_type': ride.driver.driver_profile.vehicle_type,
                    'vehicle_model': ride.driver.driver_profile.vehicle_model,
                    'vehicle_number': ride.driver.driver_profile.vehicle_number,
                    'vehicle_color': ride.driver.driver_profile.vehicle_color,
                    'driver_rating': str(ride.driver.driver_profile.rating),
                }
            )
            
            print(f"✅ Notified passenger {ride.passenger.username} - ride accepted")
            
        except Exception as e:
            print(f"❌ Error notifying passenger: {e}")

class RideStatusUpdateView(APIView):
    """Update ride status"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=RideStatusUpdateSerializer,
        responses={200: RideSerializer},
        description="Update ride status (picked_up, completed, cancelled)",
        parameters=[
            OpenApiParameter(
                name='ride_id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Ride ID to update'
            )
        ]
    )
    def patch(self, request, ride_id):
        ride = get_object_or_404(Ride, id=ride_id)
        
        # Check permissions
        if request.user != ride.driver and request.user != ride.passenger:
            return Response(
                {'error': 'Not authorized'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RideStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        ride.status = new_status
        
        # Update timestamps based on status
        if new_status == 'picked_up':
            ride.picked_up_at = timezone.now()
            
        elif new_status == 'completed':
            ride.completed_at = timezone.now()
            
            # Update driver stats
            if ride.driver:
                ride.driver.driver_profile.status = 'available'
                ride.driver.driver_profile.total_rides += 1
                ride.driver.driver_profile.save()
            
            # Update passenger stats
            if hasattr(ride.passenger, 'passenger_profile'):
                ride.passenger.passenger_profile.total_rides += 1
                ride.passenger.passenger_profile.save()
        
        elif new_status == 'cancelled':
            # Make driver available again
            if ride.driver:
                ride.driver.driver_profile.status = 'available'
                ride.driver.driver_profile.save()
        
        ride.save()
        
        # ✅ Notify other party about status change
        self.notify_status_change(ride, new_status)
        
        return Response(RideSerializer(ride).data)
    
    def notify_status_change(self, ride, new_status):
        """Notify passenger or driver about status change"""
        try:
            channel_layer = get_channel_layer()
            
            # Determine who to notify
            if ride.driver:
                # Notify passenger about status change
                async_to_sync(channel_layer.group_send)(
                    f'user_{ride.passenger.id}',
                    {
                        'type': 'ride_status_update',
                        'ride_id': ride.id,
                        'status': new_status,
                    }
                )
            
            print(f"✅ Notified about status change: {new_status}")
            
        except Exception as e:
            print(f"❌ Error notifying status change: {e}")

class RideRatingView(APIView):
    """Rate a completed ride"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=RideRatingSerializer,
        responses={200: RideSerializer},
        description="Rate a completed ride (1-5 stars)",
        parameters=[
            OpenApiParameter(
                name='ride_id',
                type=int,
                location=OpenApiParameter.PATH,
                description='Ride ID to rate'
            )
        ]
    )
    def post(self, request, ride_id):
        ride = get_object_or_404(Ride, id=ride_id, status='completed')
        
        serializer = RideRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if request.user == ride.passenger:
            ride.driver_rating = serializer.validated_data['rating']
            ride.driver_review = serializer.validated_data.get('review', '')
        elif request.user == ride.driver:
            ride.passenger_rating = serializer.validated_data['rating']
            ride.passenger_review = serializer.validated_data.get('review', '')
        else:
            return Response(
                {'error': 'Not authorized'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        ride.save()
        
        # Update driver's average rating
        if request.user == ride.passenger and ride.driver:
            self._update_driver_rating(ride.driver)
        
        return Response(RideSerializer(ride).data)
    
    def _update_driver_rating(self, driver):
        """Calculate and update driver's average rating"""
        from django.db.models import Avg
        avg_rating = Ride.objects.filter(
            driver=driver, 
            driver_rating__isnull=False
        ).aggregate(Avg('driver_rating'))['driver_rating__avg']
        
        if avg_rating:
            driver.driver_profile.rating = round(avg_rating, 2)
            driver.driver_profile.save()

class ActiveRideView(APIView):
    """Get user's current active ride"""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: RideSerializer},
        description="Get currently active ride for user"
    )
    def get(self, request):
        user = request.user
        
        if user.user_type == 'driver':
            ride = Ride.objects.filter(
                driver=user, 
                status__in=['accepted', 'picked_up']
            ).first()
        else:
            ride = Ride.objects.filter(
                passenger=user, 
                status__in=['pending', 'accepted', 'picked_up']
            ).first()
        
        if ride:
            return Response(RideSerializer(ride).data)
        return Response(
            {'message': 'No active ride'}, 
            status=status.HTTP_404_NOT_FOUND
        )

class RideEstimateView(APIView):
    """Estimate ride fare and distance before booking"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=RideEstimateSerializer,  # ← Use serializer!
        responses={200: {
            'type': 'object',
            'properties': {
                'distance': {'type': 'string', 'description': 'Distance in kilometers'},
                'fare': {'type': 'string', 'description': 'Estimated fare in UZS'},
                'estimated_time': {'type': 'integer', 'description': 'Estimated time in minutes'},
                'currency': {'type': 'string', 'description': 'Currency code'},
                'ride_type': {'type': 'string', 'description': 'Type of ride requested'},
            }
        }},
        description="Get fare estimate before creating ride. Calculate distance and price based on pickup/dropoff locations.",
        examples=[
            OpenApiExample(
                'Estimate Ride from Orikzor to Amir Temur',
                value={
                    "pickup_latitude": 41.299500,
                    "pickup_longitude": 69.240100,
                    "dropoff_latitude": 41.311151,
                    "dropoff_longitude": 69.279737,
                    "ride_type": "solo"
                },
                request_only=True,
            )
        ]
    )
    def post(self, request):
        from .utils import calculate_distance, calculate_fare
        
        # Validate input
        serializer = RideEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get validated data
        pickup_lat = serializer.validated_data['pickup_latitude']
        pickup_lng = serializer.validated_data['pickup_longitude']
        dropoff_lat = serializer.validated_data['dropoff_latitude']
        dropoff_lng = serializer.validated_data['dropoff_longitude']
        ride_type = serializer.validated_data.get('ride_type', 'solo')
        
        try:
            # Calculate distance
            distance = calculate_distance(
                float(pickup_lat),
                float(pickup_lng),
                float(dropoff_lat),
                float(dropoff_lng)
            )
            
            # Calculate fare
            fare = calculate_fare(distance, ride_type)
            
            # Estimate time (assume 30 km/h average speed)
            estimated_time = int((distance / 30) * 60)  # in minutes
            
            return Response({
                'distance': f"{distance:.2f}",
                'fare': f"{fare:.2f}",
                'estimated_time': estimated_time,
                'currency': 'UZS',
                'ride_type': ride_type
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
class NearbyRideRequestsView(APIView):
    """Get pending rides near driver's location (polling fallback)"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: {
            'type': 'array',
            'items': {'type': 'object'}
        }},
        description="Get pending ride requests within 5km of driver's current location"
    )
    def get(self, request):
        if request.user.user_type != 'driver':
            return Response(
                {'error': 'Only drivers can view nearby requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        driver = request.user.driver_profile
        
        # Check if driver has location set
        if not driver.current_latitude or not driver.current_longitude:
            return Response([])
        
        from .utils import calculate_distance
        
        # Find pending rides within 5km
        pending_rides = Ride.objects.filter(status='pending')
        
        nearby_rides = []
        for ride in pending_rides:
            distance = calculate_distance(
                float(driver.current_latitude),
                float(driver.current_longitude),
                float(ride.pickup_latitude),
                float(ride.pickup_longitude)
            )
            
            if distance <= 5:
                nearby_rides.append({
                    'ride': RideSerializer(ride).data,
                    'distance_to_pickup': round(distance, 2)
                })
        
        return Response(nearby_rides)

class RideAnalyticsView(APIView):
    """Get ride statistics and analytics"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: {
            'type': 'object',
            'properties': {
                'total_rides': {'type': 'integer'},
                'total_revenue': {'type': 'string'},
                'average_rating': {'type': 'number'},
                'rides_by_status': {'type': 'object'},
                'rides_per_day': {'type': 'array'},
            }
        }},
        description="Get comprehensive ride analytics (last 30 days)"
    )
    def get(self, request):
        # Date range: last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Filter based on user type
        if request.user.user_type == 'driver':
            rides_filter = Q(driver=request.user, requested_at__gte=thirty_days_ago)
        else:
            rides_filter = Q(passenger=request.user, requested_at__gte=thirty_days_ago)
        
        # Total rides
        total_rides = Ride.objects.filter(rides_filter).count()
        
        # Rides by status
        rides_by_status = Ride.objects.filter(rides_filter).values('status').annotate(
            count=Count('id')
        )
        
        status_breakdown = {item['status']: item['count'] for item in rides_by_status}
        
        # Total revenue (completed rides only)
        total_revenue = Ride.objects.filter(
            rides_filter,
            status='completed'
        ).aggregate(total=Sum('fare'))['total'] or 0
        
        # Average rating
        if request.user.user_type == 'driver':
            avg_rating = Ride.objects.filter(
                driver=request.user,
                driver_rating__isnull=False
            ).aggregate(avg=Avg('driver_rating'))['avg'] or 0
        else:
            avg_rating = Ride.objects.filter(
                passenger=request.user,
                passenger_rating__isnull=False
            ).aggregate(avg=Avg('passenger_rating'))['avg'] or 0
        
        # Rides per day (last 7 days)
        rides_per_day = []
        for i in range(6, -1, -1):  # 7 days ago to today
            day = timezone.now() - timedelta(days=i)
            day_filter = rides_filter & Q(requested_at__date=day.date())
            count = Ride.objects.filter(day_filter).count()
            
            rides_per_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%A'),
                'count': count
            })
        
        # Peak hours (completed rides)
        peak_hours = Ride.objects.filter(
            rides_filter,
            status='completed'
        ).extra(
            select={'hour': 'EXTRACT(hour FROM requested_at)'}
        ).values('hour').annotate(count=Count('id')).order_by('-count')[:3]
        
        return Response({
            'total_rides': total_rides,
            'total_revenue': f"{total_revenue:.2f}",
            'average_rating': round(avg_rating, 2) if avg_rating else 0,
            'rides_by_status': status_breakdown,
            'rides_per_day': rides_per_day,
            'peak_hours': list(peak_hours),
            'currency': 'UZS',
            'period': '30 days'
        })

    