from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Payment, DriverEarnings
from rides.models import Ride
from .serializers import PaymentSerializer, PaymentCreateSerializer, DriverEarningsSerializer

class PaymentCreateView(APIView):
    """Process payment for a ride"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ride = get_object_or_404(Ride, id=serializer.validated_data['ride_id'], status='completed')
        
        # Create payment
        payment = Payment.objects.create(
            ride=ride,
            passenger=ride.passenger,
            driver=ride.driver,
            amount=ride.fare,
            method=serializer.validated_data['method'],
            status='completed',  # Mock payment (instant success)
            completed_at=timezone.now()
        )
        
        # Update driver earnings
        if ride.driver:
            earnings, created = DriverEarnings.objects.get_or_create(
                driver=ride.driver,
                date=timezone.now().date()
            )
            earnings.total_rides += 1
            earnings.total_earnings += ride.fare
            earnings.save()
            
            # Update driver profile
            ride.driver.driver_profile.total_earnings += ride.fare
            ride.driver.driver_profile.save()
        
        return Response(PaymentSerializer(payment).data)

class PaymentListView(generics.ListAPIView):
    """Get user's payment history"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'driver':
            return Payment.objects.filter(driver=user).order_by('-created_at')
        return Payment.objects.filter(passenger=user).order_by('-created_at')

class DriverEarningsView(APIView):
    """Get driver's earnings"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 'driver':
            return Response({'error': 'Only drivers can view earnings'}, status=403)
        
        earnings = DriverEarnings.objects.filter(driver=request.user).order_by('-date')[:30]
        return Response(DriverEarningsSerializer(earnings, many=True).data)