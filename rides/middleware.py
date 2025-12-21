from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import jwt
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user_from_jwt(token_string):
    """Decode JWT token and get user"""
    try:
        # Decode the token
        payload = jwt.decode(
            token_string,
            settings.SECRET_KEY,
            algorithms=['HS256']
        )
        
        # Get user from payload
        user_id = payload.get('user_id')
        if not user_id:
            print("❌ No user_id in token")
            return AnonymousUser()
        
        user = User.objects.get(id=user_id)
        print(f"✅ JWT Auth success: {user.username}")
        return user
        
    except jwt.ExpiredSignatureError:
        print("❌ JWT token expired")
        return AnonymousUser()
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid JWT token: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        print("❌ User not found")
        return AnonymousUser()
    except Exception as e:
        print(f"❌ JWT Auth error: {e}")
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    JWT authentication middleware for WebSocket connections
    """
    
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