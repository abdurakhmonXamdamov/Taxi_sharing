import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taxi_backend.settings')

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# Import routing after Django setup
from rides.routing import websocket_urlpatterns
from rides.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": 
        JWTAuthMiddleware(
            URLRouter(
                websocket_urlpatterns
            )
        ),
})