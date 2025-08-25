#!/bin/bash

echo "🌱 Starting database seed process..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until docker exec supportkb-mongo mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  sleep 2
done

echo "✅ MongoDB is ready!"

# Run the seed script
echo "📝 Seeding sample data..."
docker exec supportkb-api npm run seed

if [ $? -eq 0 ]; then
  echo "✨ Seed process completed successfully!"
else
  echo "❌ Seed process failed. Please check the logs."
  exit 1
fi