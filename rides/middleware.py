from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_string):
    """Decode JWT token and get user"""
    try:
        # Use rest_framework_simplejwt to decode
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        
        user = User.objects.get(id=user_id)
        print(f"✅ JWT Auth success: {user.username}")
        return user
        
    except Exception as e:
        print(f"❌ JWT Auth failed: {e}")
        return AnonymousUser()


class JWTAuthMiddleware:
    """JWT authentication middleware for WebSocket"""
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await get_user_from_jwt(token)
        else:
            scope['user'] = AnonymousUser()
            print("⚠️ No token in WebSocket connection")
        
        return await self.app(scope, receive, send)