#!/bin/bash
set -e

# Esperar a que PostgreSQL esté listo
until PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d postgres -c '\q'; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - creating database"

# Crear base de datos si no existe
PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DB;"

echo "Database created/verified - checking schema"

# Check if schema already loaded (check for 'users' table) to ensure idempotency
# We use a simple check for the 'users' table to avoid re-running the schema and failing
TABLE_EXISTS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB -tc "SELECT 1 FROM information_schema.tables WHERE table_name = 'users';" | grep -q 1 && echo "yes" || echo "no")

if [ "$TABLE_EXISTS" = "no" ]; then
  echo "Running schema..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB < /docker-entrypoint-initdb.d/001_initial_schema.sql
else
  echo "Schema already loaded - skipping"
fi

echo "Database initialized successfully"
