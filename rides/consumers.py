import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

class LocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            print("❌ WS rejected: anonymous")
            await self.close()
            return

        print(f"✅ WebSocket connected: {self.user.username}")

        # Personal room for direct messages
        self.personal_room = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.personal_room,
            self.channel_name
        )

        # Location updates room
        self.location_room = 'location_updates'
        await self.channel_layer.group_add(
            self.location_room,
            self.channel_name
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.channel_layer.group_discard(
                self.personal_room,
                self.channel_name
            )
            await self.channel_layer.group_discard(
                self.location_room,
                self.channel_name
            )
            print(f"❌ WebSocket disconnected: {self.user.username}")
        else:
            print(f"❌ WebSocket disconnected: Anonymous user")
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Check authentication
            if not self.user.is_authenticated:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required'
                }))
                return
            
            # Handle different message types
            if message_type == 'location_update':
                await self.handle_location_update(data)
            
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
            else:
                print(f"⚠️ Unknown message type: {message_type}")
        
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            print(f"❌ Error in receive: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_location_update(self, data):
        """Handle location update from client"""
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is None or longitude is None:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Latitude and longitude are required'
            }))
            return

        # Save to database
        try:
            await self.save_user_location(latitude, longitude)
            print(f"📍 WS: Location updated for {self.user.username}: {latitude}, {longitude}")
            
            # ✅ FIX: Send confirmation to client
            await self.send(text_data=json.dumps({
                'type': 'location_update_success',
                'message': 'Location updated successfully',
                'latitude': latitude,
                'longitude': longitude
            }))

            # ✅ FIX: Use consistent field names
            await self.channel_layer.group_send(
                self.location_room,
                {
                    'type': 'location_broadcast',
                    'user_id': self.user.id,  # ✅ Consistent
                    'username': self.user.username,
                    'user_type': self.user.user_type,
                    'latitude': latitude,
                    'longitude': longitude,
                }
            )
        except Exception as e:
            print(f"❌ Error saving location: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to save location: {str(e)}'
            }))

    @database_sync_to_async
    def save_user_location(self, latitude, longitude):
        """Save user location to database"""
        user = self.user
        user.current_latitude = latitude
        user.current_longitude = longitude
        user.location_updated_at = timezone.now()
        user.location_permission_granted = True
        user.save(update_fields=[
            'current_latitude',
            'current_longitude',
            'location_updated_at',
            'location_permission_granted'
        ])
        
        # If driver, also update driver profile
        if user.user_type == 'driver':
            try:
                driver_profile = user.driver_profile
                driver_profile.current_latitude = latitude
                driver_profile.current_longitude = longitude
                driver_profile.save(update_fields=[
                    'current_latitude',
                    'current_longitude'
                ])
            except Exception as e:
                print(f"⚠️ Could not update driver profile: {e}")
    
    # ✅ FIX: Use consistent field names
    async def location_broadcast(self, event):
        """Broadcast location update to connected clients"""
        # Don't send user's own location back to them
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'location_update',
                'user_id': event['user_id'],
                'username': event['username'],
                'user_type': event['user_type'],
                'latitude': event['latitude'],
                'longitude': event['longitude'],
            }))

    # Handle new ride notifications (sent to drivers)
    async def new_ride_notification(self, event):
        """Send new ride notification to driver"""
        await self.send(text_data=json.dumps({
            'type': 'new_ride',
            'ride_id': event['ride_id'],
            'passenger_name': event['passenger_name'],
            'passenger_phone': event['passenger_phone'],
            'pickup_address': event['pickup_address'],
            'dropoff_address': event['dropoff_address'],
            'distance_to_pickup': event['distance_to_pickup'],
            'fare': event['fare'],
            'estimated_distance': event['estimated_distance'],
            'ride_type': event['ride_type'],
        }))
    
    # Handle ride accepted notifications (sent to passengers)
    async def ride_accepted_notification(self, event):
        """Send ride accepted notification to passenger"""
        await self.send(text_data=json.dumps({
            'type': 'ride_accepted',
            'ride_id': event['ride_id'],
            'driver_name': event['driver_name'],
            'driver_phone': event['driver_phone'],
            'vehicle_type': event['vehicle_type'],
            'vehicle_model': event['vehicle_model'],
            'vehicle_number': event['vehicle_number'],
            'vehicle_color': event['vehicle_color'],
            'driver_rating': event['driver_rating'],
        }))
    
    # Handle ride status updates
    async def ride_status_update(self, event):
        """Send ride status update"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'ride_id': event['ride_id'],
            'status': event['status'],
        }))