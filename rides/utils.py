import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance using Haversine formula (km)"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_fare(distance, ride_type='solo'):
    """Calculate ride fare"""     
    BASE_FARE = 5000  # 5000 UZS base fare
    PER_KM = 2000     # 2000 UZS per km
    
    fare = BASE_FARE + (distance * PER_KM)
    
    # Discount for shared rides
    if ride_type == 'shared':
        fare = fare * 0.7  # 30% discount
    
    return round(fare, 2)

def find_nearby_drivers(passenger_lat, passenger_lon, radius_km=5):
    """Find available drivers within radius"""
    from users.models import Driver
    
    available_drivers = Driver.objects.filter(
        status='available',
        current_latitude__isnull=False,
        current_longitude__isnull=False
    )
    
    nearby_drivers = []
    for driver in available_drivers:
        distance = calculate_distance(
            passenger_lat, passenger_lon,
            float(driver.current_latitude),
            float(driver.current_longitude)
        )
        
        if distance <= radius_km:
            nearby_drivers.append({
                'driver': driver,
                'distance': distance
            })
    
    nearby_drivers.sort(key=lambda x: x['distance'])
    return nearby_drivers