#!/bin/bash

# ============================================
# Keuanganku — Auto Mobile Setup Script
# ============================================
# Jalankan: bash setup-mobile.sh
# ============================================

set -e

echo ""
echo "🚀 Keuanganku Mobile Setup"
echo "================================"

# Check node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js tidak ditemukan. Install dulu dari nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node -v)"

# Install deps
echo ""
echo "📦 Installing dependencies..."
npm install

# Build Next.js
echo ""
echo "🔨 Building Next.js static export..."
npm run build

if [ ! -d "out" ]; then
  echo "❌ Folder 'out' tidak ditemukan. Build gagal."
  exit 1
fi

echo "✅ Build sukses! Folder 'out' siap."

# Sync Capacitor
echo ""
echo "⚡ Syncing Capacitor..."

# Cek apakah android sudah ada
if [ ! -d "android" ]; then
  echo "📱 Menambahkan platform Android..."
  npx cap add android
else
  echo "✅ Android project sudah ada"
fi

npx cap sync android

echo ""
echo "================================"
echo "✅ Setup selesai!"
echo ""
echo "Langkah selanjutnya:"
echo "  Buka Android Studio dengan: npx cap open android"
echo "  Lalu Build → Build APK(s)"
echo ""
echo "📖 Lihat SETUP_MOBILE.md untuk panduan lengkap"
echo "================================"
echo ""
