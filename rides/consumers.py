# rides/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import Driver

class LocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """When driver/passenger connects to WebSocket"""
        self.room_group_name = 'location_updates'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        """When driver/passenger disconnects"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        """Receive message from WebSocket (driver sends location)"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'location_update':
                # Driver sends their location
                driver_id = data.get('driver_id')
                latitude = data.get('latitude')
                longitude = data.get('longitude')
                
                # Update in database
                await self.update_driver_location(driver_id, latitude, longitude)
                
                # Broadcast to all connected clients
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'location_broadcast',
                        'driver_id': driver_id,
                        'latitude': latitude,
                        'longitude': longitude,
                    }
                )
            
            elif message_type == 'ride_status_update':
                # Ride status changed (accepted, picked_up, etc.)
                ride_id = data.get('ride_id')
                status = data.get('status')
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'ride_status_broadcast',
                        'ride_id': ride_id,
                        'status': status,
                    }
                )
        
        except Exception as e:
            print(f"Error in receive: {e}")

    async def location_broadcast(self, event):
        """Send location update to WebSocket client"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'driver_id': event['driver_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
        }))

    async def ride_status_broadcast(self, event):
        """Send ride status update to WebSocket client"""
        await self.send(text_data=json.dumps({
            'type': 'ride_status_update',
            'ride_id': event['ride_id'],
            'status': event['status'],
        }))

    @database_sync_to_async
    def update_driver_location(self, driver_id, latitude, longitude):
        """Update driver location in database"""
        try:
            driver = Driver.objects.get(user_id=driver_id)
            driver.current_latitude = latitude
            driver.current_longitude = longitude
            driver.save(update_fields=['current_latitude', 'current_longitude', 'updated_at'])
        except Driver.DoesNotExist:
            print(f"Driver {driver_id} not found")

    async def new_ride_notification(self, event):
      """Send new ride notification to driver"""
      await self.send(text_data=json.dumps({
          'type': 'new_ride',
          'ride_id': event['ride_id'],
          'driver_id': event['driver_id'],
          'distance': event['distance'],
          'pickup_address': event['pickup_address'],
          'dropoff_address': event['dropoff_address'],
          'fare': event['fare'],
      }))