import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    # Radius of Earth in kilometers
    R = 6371
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return round(distance, 2)

def find_nearby_drivers(passenger_lat, passenger_lon, radius_km=5):
    """
    Find drivers within specified radius
    """
    from users.models import DriverProfile
    
    available_drivers = DriverProfile.objects.filter(
        status='available',
        current_latitude__isnull=False,
        current_longitude__isnull=False
    )
    
    nearby_drivers = []
    for driver in available_drivers:
        distance = calculate_distance(
            passenger_lat, 
            passenger_lon,
            float(driver.current_latitude),
            float(driver.current_longitude)
        )
        
        if distance <= radius_km:
            nearby_drivers.append({
                'driver': driver,
                'distance': distance
            })
    
    # Sort by distance
    nearby_drivers.sort(key=lambda x: x['distance'])
    return nearby_drivers