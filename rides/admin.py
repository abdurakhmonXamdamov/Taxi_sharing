from django.contrib import admin
from .models import Ride, SharedRide

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ['id', 'passenger', 'driver', 'status', 'ride_type', 'fare', 'distance', 'requested_at']
    list_filter = ['status', 'ride_type', 'requested_at']
    search_fields = ['passenger__username', 'driver__username']
    readonly_fields = ['requested_at', 'accepted_at', 'picked_up_at', 'completed_at']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('passenger', 'driver')  # Performance optimization

@admin.register(SharedRide)
class SharedRideAdmin(admin.ModelAdmin):
    list_display = ['ride', 'passenger', 'fare_share']
    search_fields = ['ride__id', 'passenger__username']