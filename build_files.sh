#!/usr/bin/env bash
echo "Installing dependencies..."
python -m pip install -r requirements.txt

echo "Collecting static assets with WhiteNoise..."
python backend/manage.py collectstatic --noinput --clear

echo "Build process completed successfully."
