from django.urls import path
from .views import PaymentCreateView, PaymentListView, DriverEarningsView

urlpatterns = [
    path('', PaymentListView.as_view(), name='payment-list'),
    path('create/', PaymentCreateView.as_view(), name='payment-create'),
    path('earnings/', DriverEarningsView.as_view(), name='driver-earnings'),
]