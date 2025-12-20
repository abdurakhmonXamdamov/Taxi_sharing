from django.urls import path
from .consumers import LocationConsumer

websocket_urlpatterns = [
    path(r'ws/location/', LocationConsumer.as_asgi()),
]
