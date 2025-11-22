<p align="center">
  <img src="https://img.icons8.com/ios-filled/50/000000/taxi.png" alt="Taxi Icon"/>
</p>

<h1 align="center">🚕 Taxi Sharing Backend</h1>
<p align="center">A robust, scalable backend for modern taxi-sharing platforms built with Django & PostgreSQL</p>

<p align="center">
  <a href="https://www.djangoproject.com/">
    <img src="https://img.shields.io/badge/Django-092E20?style=flat&logo=django&logoColor=white" alt="Django"/>
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  </a>
  <a href="https://www.python.org/">
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python"/>
  </a>
</p>

---

## 📖 Table of Contents
- [About](#about)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 📝 About
This project delivers a secure, modular, and efficient backend system for taxi-sharing platforms. It allows management of users, rides, drivers, payments, and location-based ride matching, fully prepared for mobile or web frontend integration.

---

## ✨ Key Features

### 🔐 Authentication & User Management
- Secure user registration & login  
- Role-based access: driver / passenger  
- Supports token-based authentication  

### 🚖 Ride Management
- Create, book, and share rides  
- Real-time ride status: requested → accepted → completed  

### 📍 Smart Location Matching (PostGIS)
- Nearest driver lookup  
- Distance calculation  
- Efficient geospatial queries  

### 💳 Payment Structure
- Basic payment flow foundation  
- Easy integration with real payment gateways  

### 👥 Driver & Passenger Handling
- Profile management  
- Driver verification workflow ready for extension  

### 🏗️ Modular Architecture
- Separate Django apps for `users`, `rides`, and `payments`  
- Scalable and maintainable structure  

### 📡 RESTful API Endpoints
- Clean, well-structured API design  
- Fully ready for mobile apps or frontend frameworks (Vue, React, etc.)  

### 🗂️ Environment-Safe Configuration
- `.env` support for secrets and database credentials  
- Follows best practices for deployment  

---

## ⚙️ Setup & Installation

```bash
# Clone the repository
git clone https://github.com/abdurakhmonXamdamov/Taxi-sharing.git
cd taxi-sharing

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
