from django.contrib import admin
from .models import Payment, DriverEarnings

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'ride_id', 'passenger', 'amount', 'method', 'status', 'created_at']
    list_filter = ['status', 'method', 'created_at']
    search_fields = ['ride__id', 'passenger__username', 'transaction_id']
    
    def ride_id(self, obj):
        return obj.ride.id
    ride_id.short_description = 'Ride ID'

@admin.register(DriverEarnings)
class DriverEarningsAdmin(admin.ModelAdmin):
    list_display = ['driver', 'date', 'total_rides', 'total_earnings']
    list_filter = ['date']
    search_fields = ['driver__username']
    date_hierarchy = 'date'