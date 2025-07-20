#!/usr/bin/env bash
# Force npm and Node instead of Bun
echo "Using custom build script..."
 
cd backend
export NODE_ENV=production
npm install
npm run build