from django.db import models
from users.models import User
from rides.models import Ride

class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('card', 'Card'),
    )
    
    ride = models.OneToOneField(Ride, on_delete=models.CASCADE, related_name='payment')
    passenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earnings', null=True)
    
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    transaction_id = models.CharField(max_length=100, blank=True)  # From payment gateway
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Payment #{self.id} - {self.status}"

class DriverEarnings(models.Model):
    """Track driver's daily/weekly earnings"""
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earning_records')
    date = models.DateField(auto_now_add=True)
    total_rides = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ('driver', 'date')
    
    def __str__(self):
        return f"{self.driver.username} - {self.date}"