from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Ride
from .serializers import (
    RideSerializer, RideCreateSerializer, 
    RideStatusUpdateSerializer, RideRatingSerializer
)

class RideCreateView(generics.CreateAPIView):
    """Book a new ride"""
    serializer_class = RideCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        ride = serializer.save()
        # TODO: Trigger notification to nearby drivers
        return ride

class RideListView(generics.ListAPIView):
    """Get user's ride history"""
    serializer_class = RideSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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

class RideAcceptView(APIView):
    """Driver accepts ride"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, ride_id):
        if request.user.user_type != 'driver':
            return Response({'error': 'Only drivers can accept rides'}, status=status.HTTP_403_FORBIDDEN)
        
        ride = get_object_or_404(Ride, id=ride_id, status='pending')
        
        # Check if driver is available
        if request.user.driver_profile.status != 'available':
            return Response({'error': 'Driver not available'}, status=status.HTTP_400_BAD_REQUEST)
        
        ride.driver = request.user
        ride.status = 'accepted'
        ride.accepted_at = timezone.now()
        ride.save()
        
        # Update driver status
        request.user.driver_profile.status = 'on_trip'
        request.user.driver_profile.save()
        
        return Response(RideSerializer(ride).data)

class RideStatusUpdateView(APIView):
    """Update ride status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, ride_id):
        ride = get_object_or_404(Ride, id=ride_id)
        
        # Check permissions
        if request.user != ride.driver and request.user != ride.passenger:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RideStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        ride.status = new_status
        
        # Update timestamps
        if new_status == 'picked_up':
            ride.picked_up_at = timezone.now()
        elif new_status == 'completed':
            ride.completed_at = timezone.now()
            # Update driver status to available
            if ride.driver:
                ride.driver.driver_profile.status = 'available'
                ride.driver.driver_profile.total_rides += 1
                ride.driver.driver_profile.save()
            # Update passenger stats
            ride.passenger.passenger_profile.total_rides += 1
            ride.passenger.passenger_profile.save()
        
        ride.save()
        
        return Response(RideSerializer(ride).data)

class RideRatingView(APIView):
    """Rate a completed ride"""
    permission_classes = [permissions.IsAuthenticated]
    
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
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
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
        return Response({'message': 'No active ride'}, status=status.HTTP_404_NOT_FOUND)