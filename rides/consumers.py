import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class LocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        
        await self.accept()
        
        if self.user.is_authenticated:
            print(f"✅ WebSocket connected: {self.user.username}")
            
            # Join personal room for notifications
            self.personal_room = f'user_{self.user.id}'
            await self.channel_layer.group_add(
                self.personal_room,
                self.channel_name
            )
            
            # Join general location updates room
            self.location_room = 'location_updates'
            await self.channel_layer.group_add(
                self.location_room,
                self.channel_name
            )
        else:
            print(f"⚠️ WebSocket connected: Anonymous user")
    
    async def disconnect(self, close_code):
        if self.user.is_authenticated:
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
            
            # Check authentication for sensitive operations
            if not self.user.is_authenticated:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Authentication required'
                }))
                return
            
            if message_type == 'location_update':
                await self.handle_location_update(data)
            
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        
        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
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
    
    async def location_broadcast(self, event):
        """Send location update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'driver_id': event['driver_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
        }))