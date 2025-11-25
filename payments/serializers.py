from rest_framework import serializers
from .models import Payment, DriverEarnings

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['passenger', 'driver', 'created_at', 'completed_at']

class PaymentCreateSerializer(serializers.Serializer):
    ride_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=['cash', 'card'])

class DriverEarningsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverEarnings
        fields = '__all__'