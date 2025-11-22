from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Driver, Passanger

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'user_type', 'phone_number', 'is_verified']
    list_filter = ['user_type', 'is_verified']
    search_fields = ['username', 'email', 'phone_number']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('user_type', 'phone_number', 'avatar', 'is_verified')
        }),
    )

@admin.register(Driver)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_number', 'status', 'rating', 'total_rides']
    list_filter = ['status', 'vehicle_type']
    search_fields = ['user__username', 'vehicle_number']

@admin.register(Passanger)
class PassengerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_rides']
    search_fields = ['user__username']