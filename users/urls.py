from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView,
    DriverProfileView, DriverLocationUpdateView, NearbyDriversView
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    
    # Profile
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('driver/profile/', DriverProfileView.as_view(), name='driver-profile'),
    
    # Driver location
    path('driver/location/', DriverLocationUpdateView.as_view(), name='driver-location'),
    path('drivers/nearby/', NearbyDriversView.as_view(), name='nearby-drivers'),
]