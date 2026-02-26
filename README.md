# 🚕 Taxi Sharing — Backend Documentation

A production-ready REST API backend for a ride-sharing platform built with **Django 5.2**, **Django REST Framework**, **PostgreSQL**, **WebSockets (Django Channels)**, and deployed via **Docker** on **Railway**.

---

## 📑 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Docker Setup](#docker-setup)
- [Authentication](#authentication)
- [Fare Calculation](#fare-calculation)
- [Admin Panel](#admin-panel)
- [API Documentation](#api-documentation)

---

## 🛠️ Tech Stack

| Package | Version | Purpose |
|---|---|---|
| Django | 5.2.8 | Web framework |
| djangorestframework | 3.16.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT Authentication |
| django-channels | 4.3.1 | WebSocket support |
| channels-redis | 4.3.0 | Redis-backed channel layer |
| daphne | 4.2.1 | ASGI server |
| dj-database-url | 3.0.1 | Database URL parsing |
| psycopg2-binary | 2.9.11 | PostgreSQL adapter |
| Pillow | 12.0.0 | Image processing (avatars) |
| django-jazzmin | 3.0.1 | Custom admin UI |
| drf-spectacular | 0.29.0 | Auto OpenAPI docs |
| django-cors-headers | 4.9.0 | CORS support |
| whitenoise | 6.11.0 | Static file serving |
| python-decouple | 3.8 | Environment variable management |
| gunicorn | 23.0.0 | WSGI server (production) |
| redis | 7.0.1 | Redis client |

---

## 📁 Project Structure

```
Taxi_sharing/
├── taxi_backend/              # Django project core
│   ├── settings.py            # All configuration
│   ├── urls.py                # Root URL routing
│   ├── asgi.py                # ASGI entry point (WebSocket support)
│   └── wsgi.py                # WSGI entry point
│
├── users/                     # User management app
│   ├── models.py              # User, Driver, Passenger models
│   ├── serializers.py         # Serializers for all user types
│   ├── views.py               # Auth, profile, location views
│   ├── urls.py                # User URL routes
│   └── consumers.py           # WebSocket consumer (location updates)
│
├── rides/                     # Ride management app
│   ├── models.py              # Ride, SharedRide models
│   ├── serializers.py         # Ride serializers
│   ├── views.py               # Ride CRUD, accept, status, analytics
│   ├── urls.py                # Ride URL routes
│   ├── consumers.py           # WebSocket consumer (ride notifications)
│   └── utils.py               # Distance & fare calculation helpers
│
├── payments/                  # Payment processing app
│   ├── models.py              # Payment, DriverEarnings models
│   ├── serializers.py         # Payment serializers
│   ├── views.py               # Payment & earnings views
│   └── urls.py                # Payment URL routes
│
├── media/                     # User-uploaded files (avatars)
├── manage.py                  # Django CLI
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker image definition
├── .dockerignore              # Docker ignore rules
└── api.http                   # HTTP request samples for testing
```

---

## 🗄️ Data Models

### `users` App

#### `User` (extends `AbstractUser`)
The central user model used for both drivers and passengers.

| Field | Type | Description |
|---|---|---|
| `username` | CharField | Unique username |
| `email` | EmailField | Email address |
| `user_type` | CharField | `passenger`, `driver`, or `admin` |
| `phone_number` | CharField | Unique phone number |
| `avatar` | ImageField | Profile picture (auto-resized to 300×300) |
| `is_verified` | BooleanField | Account verification status |
| `current_latitude` | DecimalField | Real-time GPS latitude |
| `current_longitude` | DecimalField | Real-time GPS longitude |
| `location_updated_at` | DateTimeField | When location was last updated |
| `location_permission_granted` | BooleanField | Has user granted location access |

#### `Driver`
Extended profile linked one-to-one with a `User` of type `driver`.

| Field | Type | Description |
|---|---|---|
| `user` | OneToOneField | Link to User |
| `license_number` | CharField | Driver's license number |
| `vehicle_type` | CharField | e.g., Sedan, SUV |
| `vehicle_model` | CharField | e.g., Chevrolet Nexia |
| `vehicle_number` | CharField | License plate |
| `vehicle_color` | CharField | Vehicle color |
| `status` | CharField | `available`, `on_trip`, or `offline` |
| `rating` | DecimalField | Average rating (default 5.0) |
| `total_rides` | IntegerField | Lifetime completed rides |
| `total_earnings` | DecimalField | Lifetime earnings in UZS |
| `current_latitude` | DecimalField | Driver's current GPS latitude |
| `current_longitude` | DecimalField | Driver's current GPS longitude |

**Computed properties:** `is_profile_complete`, `missing_fields`

#### `Passenger`
Extended profile linked one-to-one with a `User` of type `passenger`.

| Field | Type | Description |
|---|---|---|
| `user` | OneToOneField | Link to User |
| `total_rides` | IntegerField | Total rides taken |

---

### `rides` App

#### `Ride`

| Field | Type | Description |
|---|---|---|
| `passenger` | ForeignKey(User) | The passenger who booked |
| `driver` | ForeignKey(User) | The assigned driver (nullable) |
| `pickup_latitude/longitude` | DecimalField | Pickup GPS coordinates |
| `pickup_address` | TextField | Human-readable pickup address |
| `dropoff_latitude/longitude` | DecimalField | Dropoff GPS coordinates |
| `dropoff_address` | TextField | Human-readable dropoff address |
| `ride_type` | CharField | `solo` or `shared` |
| `status` | CharField | `pending` → `accepted` → `picked_up` → `completed` / `cancelled` |
| `distance` | DecimalField | Calculated distance in km |
| `fare` | DecimalField | Calculated fare in UZS |
| `requested_at` | DateTimeField | When ride was requested |
| `accepted_at` | DateTimeField | When driver accepted |
| `picked_up_at` | DateTimeField | When passenger was picked up |
| `completed_at` | DateTimeField | When ride completed |
| `driver_rating` | IntegerField | Rating given by passenger (1–5) |
| `passenger_rating` | IntegerField | Rating given by driver (1–5) |

#### `SharedRide`
Additional passengers on a shared ride.

| Field | Type | Description |
|---|---|---|
| `ride` | ForeignKey(Ride) | Parent ride |
| `passenger` | ForeignKey(User) | Additional passenger |
| `pickup/dropoff_latitude/longitude` | DecimalField | Per-passenger coordinates |
| `fare_share` | DecimalField | This passenger's portion of the fare |

---

### `payments` App

#### `Payment`

| Field | Type | Description |
|---|---|---|
| `ride` | OneToOneField(Ride) | The ride being paid for |
| `passenger` | ForeignKey(User) | Who paid |
| `driver` | ForeignKey(User) | Who received |
| `amount` | DecimalField | Amount in UZS |
| `method` | CharField | `cash` or `card` |
| `status` | CharField | `pending`, `completed`, `failed`, `refunded` |
| `transaction_id` | CharField | Gateway transaction reference |
| `created_at` | DateTimeField | Payment timestamp |
| `completed_at` | DateTimeField | Completion timestamp |

#### `DriverEarnings`
Daily earnings summary per driver.

| Field | Type | Description |
|---|---|---|
| `driver` | ForeignKey(User) | The driver |
| `date` | DateField | The date (unique per driver per day) |
| `total_rides` | IntegerField | Rides completed that day |
| `total_earnings` | DecimalField | Earnings that day in UZS |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/`. Authentication uses `Bearer <access_token>` in the `Authorization` header, except for `register` and `login`.

### 🔐 Auth & Users — `/api/users/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register/` | ❌ Public | Register new user (auto-creates Driver or Passenger profile) |
| POST | `/api/users/login/` | ❌ Public | Login and receive JWT tokens |
| GET | `/api/users/profile/` | ✅ | Get current user's profile |
| PUT | `/api/users/profile/` | ✅ | Update current user's profile (partial) |
| POST | `/api/users/update-location/` | ✅ | Update current GPS location (any user type) |
| GET | `/api/users/driver/profile/` | ✅ Driver | Get driver profile + completeness status |
| PUT | `/api/users/driver/profile/` | ✅ Driver | Update driver profile |
| POST | `/api/users/driver/profile/complete/` | ✅ Driver | First-time driver profile setup (vehicle info) |
| POST | `/api/users/driver/location/` | ✅ Driver | Update driver location + status (broadcasts via WebSocket) |
| POST | `/api/users/drivers/nearby/` | ✅ | Find available drivers within radius |
| GET | `/api/users/driver/<id>/location/` | ✅ | Get specific driver's current location |
| GET | `/api/users/passenger/profile/` | ✅ Passenger | Get passenger profile |
| PUT | `/api/users/passenger/profile/` | ✅ Passenger | Update passenger profile |

**Register request body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "passenger",
  "phone_number": "+998901234567"
}
```

**Login response:**
```json
{
  "user": { ... },
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>",
  "message": "Login successful"
}
```

---

### 🚗 Rides — `/api/rides/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/rides/` | ✅ | List rides (passenger sees own bookings, driver sees assigned) |
| POST | `/api/rides/create/` | ✅ Passenger | Create a new ride (auto-calculates fare & distance) |
| GET | `/api/rides/<id>/` | ✅ | Get ride details |
| POST | `/api/rides/<id>/accept/` | ✅ Driver | Accept a pending ride |
| PATCH | `/api/rides/<id>/status/` | ✅ | Update ride status (`picked_up`, `completed`, `cancelled`) |
| POST | `/api/rides/<id>/rate/` | ✅ | Rate a completed ride (1–5 stars) |
| GET | `/api/rides/active/` | ✅ | Get user's current active ride |
| GET | `/api/rides/nearby-requests/` | ✅ Driver | Get pending rides within 5km of driver |
| POST | `/api/rides/estimate/` | ✅ | Estimate fare before booking |
| GET | `/api/rides/analytics/` | ✅ | Get ride stats for last 30 days |

**Create ride request body:**
```json
{
  "pickup_latitude": 41.299500,
  "pickup_longitude": 69.240100,
  "pickup_address": "Orikzor, Tashkent",
  "dropoff_latitude": 41.311151,
  "dropoff_longitude": 69.279737,
  "dropoff_address": "Amir Temur Square, Tashkent",
  "ride_type": "solo"
}
```

**Ride status flow:**
```
pending → accepted → picked_up → completed
                               → cancelled
```

---

### 💳 Payments — `/api/payments/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/` | ✅ Passenger | Process payment for a completed ride |
| GET | `/api/payments/history/` | ✅ | Payment history (passenger: paid; driver: received) |
| GET | `/api/payments/earnings/` | ✅ Driver | Driver's daily earnings (last 30 days) |

**Process payment request body:**
```json
{
  "ride_id": 42,
  "method": "cash"
}
```

---

## 🔌 WebSocket Events

Connect to the WebSocket at:
```
ws://<host>/ws/location/
```

Authentication is required. The server uses JWT token from the connection handshake.

Each authenticated user automatically joins two channel groups:
- `user_<id>` — Personal channel for direct notifications
- `location_updates` — Shared channel for location broadcasts

### Events You Can Send (Client → Server)

**Update location:**
```json
{
  "type": "location_update",
  "latitude": 41.2995,
  "longitude": 69.2401
}
```

**Ping/keepalive:**
```json
{ "type": "ping" }
```

### Events You Receive (Server → Client)

**New ride request** (sent to nearby drivers):
```json
{
  "type": "new_ride",
  "ride_id": 15,
  "passenger_name": "John Doe",
  "passenger_phone": "+998901234567",
  "pickup_address": "Orikzor, Tashkent",
  "dropoff_address": "Amir Temur Square",
  "distance_to_pickup": 1.3,
  "fare": "18000.00",
  "estimated_distance": "4.50",
  "ride_type": "solo"
}
```

**Ride accepted** (sent to passenger):
```json
{
  "type": "ride_accepted",
  "ride_id": 15,
  "driver_name": "Ali Karimov",
  "driver_phone": "+998901112233",
  "vehicle_type": "Sedan",
  "vehicle_model": "Chevrolet Nexia",
  "vehicle_number": "01 A 234 BC",
  "vehicle_color": "White",
  "driver_rating": "4.85"
}
```

**Ride status update:**
```json
{
  "type": "status_update",
  "ride_id": 15,
  "status": "picked_up"
}
```

**Location broadcast** (driver location shared to all in group):
```json
{
  "type": "location_update",
  "driver_id": 7,
  "latitude": 41.2995,
  "longitude": 69.2401
}
```

**Channel layer:** Uses **Redis** in production, falls back to **InMemoryChannelLayer** in development (automatically detected via `REDIS_URL` env variable).

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Allowed hosts (comma-separated)
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgres://user:password@localhost:5432/taxi_sharing

# CORS (comma-separated origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# Redis (optional — if not set, uses InMemory for WebSockets in dev)
REDIS_URL=redis://localhost:6379
```

In **production** (Railway), these are set as environment variables in the dashboard. The app is already configured for `https://taxi-sharing.up.railway.app`.

---

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/abdurakhmonXamdamov/Taxi_sharing.git
cd Taxi_sharing
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials and secret key
```

### 5. Create the PostgreSQL database

```sql
-- In psql
CREATE DATABASE taxi_sharing;
```

### 6. Run migrations

```bash
python manage.py migrate
```

### 7. Create a superuser

```bash
python manage.py createsuperuser
```

### 8. Collect static files

```bash
python manage.py collectstatic --noinput
```

### 9. Start the server

For development (with WebSocket support via Daphne):
```bash
python manage.py runserver
```

For production-like ASGI:
```bash
daphne -b 0.0.0.0 -p 8000 taxi_backend.asgi:application
```

The API will be available at `http://localhost:8000/`

---

## 🐳 Docker Setup

### Build and run

```bash
docker build -t taxi-sharing-backend .
docker run -p 8000:8000 --env-file .env taxi-sharing-backend
```

### With Docker Compose (if available)

```bash
docker-compose up --build
```

---

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** via `djangorestframework-simplejwt`.

**Token lifetimes:**
- Access token: **1 day**
- Refresh token: **7 days**

**Usage:**

Include the access token in every protected request:
```http
Authorization: Bearer <your_access_token>
```

**Get a new access token using your refresh token:**
```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "<your_refresh_token>"
}
```

---

## 💰 Fare Calculation

Fares are calculated automatically in `rides/utils.py` using the **Haversine formula** for distance.

**Distance:** Calculated in kilometers between pickup and dropoff GPS coordinates.

**Fare pricing (UZS):**
- Base fare: applied for all rides
- Per-km rate: varies by `ride_type`
  - `solo` — standard per-km rate
  - `shared` — discounted per-km rate

Fare is calculated at the time of booking via `RideCreateSerializer.create()` and also available before booking via the `/api/rides/estimate/` endpoint.

**Estimated travel time** is computed assuming an average speed of **30 km/h**.

---

## 🛡️ Admin Panel

Access the custom **Jazzmin**-themed admin panel at:

```
http://localhost:8000/admin/
```

**Theme:** Cyborg (dark mode)  
**Brand:** Adyuva Taxi

You can manage:
- **Users** — all passengers, drivers, admins
- **Drivers** — vehicle info, status, ratings, earnings
- **Passengers** — ride history
- **Rides** — full ride lifecycle
- **Payments** — transaction records
- **Driver Earnings** — daily earnings records

---

## 📖 API Documentation

Interactive API docs are auto-generated by **drf-spectacular**:

| URL | Description |
|---|---|
| `/api/schema/` | Download raw OpenAPI schema (YAML) |
| `/api/docs/` | Swagger UI — interactive browser |
| `/api/redoc/` | ReDoc UI — readable reference |

All endpoints include request/response examples directly in the docs.

---

## 🌐 Production Deployment (Railway)

The project is configured for Railway deployment:

- **ASGI server:** Daphne (handles both HTTP and WebSocket)
- **Database:** PostgreSQL via `DATABASE_URL` environment variable
- **Static files:** Served by WhiteNoise (no separate static server needed)
- **WebSockets:** Redis-backed via `REDIS_URL` environment variable
- **Security headers:** Automatically enabled when `DEBUG=False`
- **Trusted origins:** `https://taxi-sharing.up.railway.app`

---

## 🕐 Timezone

The server runs on **Asia/Tashkent (UTC+5)** timezone. All timestamps in the API are returned in this timezone.

---

## 👨‍💻 Author

**Abdurakhmon Xamdamov**  
GitHub: [@abdurakhmonXamdamov](https://github.com/abdurakhmonXamdamov)
