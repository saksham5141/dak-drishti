# Use official lightweight Python base image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY . .

# Expose web port
EXPOSE 8080

# Run production server
CMD ["python", "server.py"]
