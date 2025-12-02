from email.policy import default
from django.db import models
from django.contrib.auth.models import AbstractUser
from PIL import Image

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('passenger', 'Passenger'),
        ('driver', 'Driver'),
        ('admin', 'Admin'),
    )

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone_number = models.CharField(max_length=15, unique=True)
    avatar = models.ImageField(default='default.jpg', upload_to='profile_pics', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"

    def save(self, *args, **kwargs):
      super().save(*args, **kwargs)

      Img = Image.open(self.avatar.path)
      if Img.height > 300 or Img.width > 300:
        output_size = (300, 300)
        Img.thumbnail(output_size)
        Img.save(self.avatar.path)


class Driver(models.Model):
  STATUS_CHOICE = (
    ('available', 'Available'),
    ('on_trip', 'On Trip'),
    ('offline', 'Offline'),
  )

  @property
  def is_profile_complete(self):
    """Check if driver completed their profile"""
    return bool(
        self.license_number and
        self.vehicle_type and
        self.vehicle_model and
        self.vehicle_number and
        self.vehicle_color
    )

  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
  vehicle_type = models.CharField(max_length=50)
  vehicle_model = models.CharField(max_length=50)
  vehicle_number = models.CharField(max_length=30)
  vehicle_color = models.CharField(max_length=30)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
  current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

  status = models.CharField(max_length=20, choices=STATUS_CHOICE, default='offline')
  rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
  total_rides = models.IntegerField(default=0)
  total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
  def __str__(self):
    return f"Driver: {self.user.username}"


class Passanger(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passenger_profile')
  total_rides = models.IntegerField(default=0)
  created_at = models.DateTimeField(auto_now_add=True)
  update_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"Passenger: {self.user.username}"

