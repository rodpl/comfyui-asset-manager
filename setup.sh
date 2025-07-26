#!/bin/bash
set -e

# Setup for Python backend
echo "Setting up Python backend..."
poetry install --no-root

# Setup for React frontend
echo "Setting up React frontend..."
cd ui
pnpm install
cd ..

echo "Setup complete!"
