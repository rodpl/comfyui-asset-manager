#!/bin/bash
set -e

# Setup for Python backend
echo "Setting up Python backend..."
uv venv
uv pip install -e .

# Setup for React frontend
echo "Setting up React frontend..."
cd ui
npm install
cd ..

echo "Setup complete!"
