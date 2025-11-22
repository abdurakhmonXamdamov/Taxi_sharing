from django.db import models
from users.models import User

class Ride(models.Model):
  STATUS_CHOICES = (
      ('pending', 'Pending'),
      ('accepted', 'Accepted'),
      ('picked_up', 'Picked Up'),
      ('completed', 'Completed'),
      ('cancelled', 'Cancelled')
  )

  RIDE_TYPE_CHOCES = (
    ('solo', 'Solo Ride'),
    ('shared', 'Shared Ride')
  )

  passenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passenger_rides')
  driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='driver_rides')

  pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6)
  pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6)
  pickup_address = models.TextField()

  dropoff_latitude = models.DecimalField(max_digits=9, decimal_places=6)
  dropoff_longitude = models.DecimalField(max_digits=9, decimal_places=6)
  dropoff_address = models.TextField()

  ride_type = models.CharField(max_length=10, choices=RIDE_TYPE_CHOCES, default='sole')
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
  distance = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
  duration = models.IntegerField(null=True, blank=True)
  fare = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
  
  requested_at = models.DateTimeField(auto_now_add=True)
  accepted_at = models.DateTimeField(null=True, blank=True)
  picked_up_at = models.DateTimeField(null=True, blank=True)
  completed_at = models.DateTimeField(null=True, blank=True)
  
  # Rating
  passenger_rating = models.IntegerField(null=True, blank=True)
  driver_rating = models.IntegerField(null=True, blank=True)
  passenger_review = models.TextField(blank=True)
  driver_review = models.TextField(blank=True)

  def __str__(self):
      return f"Ride #{self.id} - {self.status}"

class SharedRide(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='shared_passengers')
    passenger = models.ForeignKey(User, on_delete=models.CASCADE)
    pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    dropoff_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    dropoff_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    fare_share = models.DecimalField(max_digits=8, decimal_places=2)
    
    def __str__(self):
        return f"Shared Ride #{self.ride.id} - {self.passenger.username}"
