from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_string):
    """Decode JWT token and get user"""
    print(f"🔑 Attempting to decode token: {token_string[:50]}...")  # ✅ Log token (first 50 chars)
    
    try:
        # Use rest_framework_simplejwt to decode
        access_token = AccessToken(token_string)
        print(f"✅ Token decoded successfully")  # ✅ Log success
        
        user_id = access_token['user_id']
        print(f"📝 User ID from token: {user_id}")  # ✅ Log user ID
        
        user = User.objects.get(id=user_id)
        print(f"✅ JWT Auth success: {user.username} (ID: {user.id})")  # ✅ Log full success
        return user
        
    except Exception as e:
        print(f"❌ JWT Auth failed: {type(e).__name__}: {str(e)}")  # ✅ Log error type and message
        return AnonymousUser()


class JWTAuthMiddleware:
    """JWT authentication middleware for WebSocket"""
    
    def __init__(self, app):
        self.app = app
        print("🚀 JWTAuthMiddleware initialized")  # ✅ Log initialization

    async def __call__(self, scope, receive, send):
        print("=" * 60)  # ✅ Visual separator
        print(f"📡 WebSocket connection attempt!")  # ✅ Log connection attempt
        print(f"📝 Scope type: {scope.get('type')}")  # ✅ Log connection type
        print(f"📝 Path: {scope.get('path')}")  # ✅ Log path
        
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        print(f"📝 Raw query string: {query_string}")  # ✅ Log full query string
        
        query_params = parse_qs(query_string)
        print(f"📝 Parsed query params: {list(query_params.keys())}")  # ✅ Log param keys
        
        token = query_params.get('token', [None])[0]
        
        if token:
            print(f"🔑 Token found in query string")  # ✅ Log token found
            scope['user'] = await get_user_from_jwt(token)
        else:
            print("❌ No token in WebSocket connection query string")  # ✅ Log no token
            scope['user'] = AnonymousUser()
        
        print(f"👤 Final user in scope: {scope['user']}")  # ✅ Log final user
        print(f"👤 User is authenticated: {scope['user'].is_authenticated}")  # ✅ Log auth status
        print("=" * 60)  # ✅ Visual separator
        
        return await self.app(scope, receive, send)