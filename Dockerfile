# Use official Python 3.13 image
FROM python:3.13-slim

# Prevent Python from buffering stdout/stderr (see logs immediately)
ENV PYTHONUNBUFFERED=1
# Don't create .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Set working directory inside container
WORKDIR /app

# Install system dependencies needed for PostgreSQL and building Python packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first (Docker layer caching optimization)
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy entire Django project
COPY . .

# Expose port 8000 (Railway will override with $PORT)
EXPOSE 8000

# Run migrations, collect static, then start server
CMD python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput && \
    daphne -b 0.0.0.0 -p ${PORT:-8000} taxi_backend.asgi:application