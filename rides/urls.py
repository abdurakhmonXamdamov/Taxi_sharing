from django.urls import path
from .views import (
    RideCreateView, RideListView, RideDetailView,
    RideAcceptView, RideStatusUpdateView, RideRatingView,
    ActiveRideView, NearbyRideRequestsView, RideEstimateView,
    RideAnalyticsView
)

urlpatterns = [
    path('', RideListView.as_view(), name='ride-list'),
    path('create/', RideCreateView.as_view(), name='ride-create'),
    path('<int:pk>/', RideDetailView.as_view(), name='ride-detail'),
    path('<int:ride_id>/accept/', RideAcceptView.as_view(), name='ride-accept'),
    path('<int:ride_id>/status/', RideStatusUpdateView.as_view(), name='ride-status'),
    path('<int:ride_id>/rate/', RideRatingView.as_view(), name='ride-rate'),
    path('active/', ActiveRideView.as_view(), name='active-ride'),
    path('nearby-requests/', NearbyRideRequestsView.as_view(), name='nearby-requests'),  # ← NEW!
    path('estimate/', RideEstimateView.as_view(), name='ride-estimate'), # <- NEW!
    path('analytics/', RideAnalyticsView.as_view(), name='ride-analytics'),
]