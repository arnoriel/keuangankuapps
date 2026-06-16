# 📱 Keuanganku — Mobile Build Guide (Capacitor)

## 🌐 Struktur Routing: Landing Page vs PWA App

Project ini sekarang punya dua "wajah":

| Path | Isi | Dibungkus WalletProvider/AppShell? |
|------|-----|--------------------------------------|
| `/` | Landing page publik + tombol "Tambahkan ke Layar Utama" | ❌ Tidak |
| `/app` | Dashboard utama (lock screen, transaksi, dst) | ✅ Ya |
| `/app/analytics`, `/app/goals`, `/app/calculator`, `/app/history` | Halaman-halaman dashboard | ✅ Ya |

**Kenapa dipisah begini?**
- `https://keuangankuapps.vercel.app/` → orang baru pertama kali landing di sini, lihat fitur, lalu klik "Tambahkan ke Layar Utama"
- `manifest.json` punya `start_url: "/app"` dan `scope: "/app"` → saat di-install dari tombol itu, ikon yang muncul di homescreen akan langsung membuka `/app` (dashboard), bukan landing page
- Saat dibuka di APK (Capacitor native), `app/page.tsx` otomatis redirect ke `/app` — APK tidak pernah menampilkan landing page sama sekali

### Tombol "Add to Home Screen" otomatis

Landing page (`app/page.tsx`) mendengarkan event browser `beforeinstallprompt`:
- **Android Chrome / Edge** → tombol langsung memicu native install prompt
- **iOS Safari** → `beforeinstallprompt` tidak didukung Apple, jadi tombol menampilkan panduan manual (Share → Add to Home Screen)
- **Firefox / browser lain tanpa support** → fallback ke panduan manual juga

---



| Tool | Versi Min | Download |
|------|-----------|----------|
| Node.js | 18+ | nodejs.org |
| Android Studio | Hedgehog+ | developer.android.com/studio |
| Java JDK | 17+ | adoptium.net |
| Xcode (iOS, Mac only) | 15+ | Mac App Store |

---

## 1. Install Dependencies

```bash
cd keuanganku
npm install
```

---

## 2. Build Next.js → Static Export

```bash
npm run build
```

Output ada di folder `out/`. Pastikan tidak ada error.

---

## 3. Init Capacitor & Sync

```bash
# Init (sekali saja)
npx cap init "Keuanganku" "com.cobamulai.keuanganku" --web-dir out

# Tambah platform Android
npx cap add android

# Tambah platform iOS (Mac only)
npx cap add ios

# Sync web assets ke native project
npx cap sync
```

---

## 4. Build Android APK

### Option A — Via Android Studio (recommended)
```bash
npx cap open android
```
Nanti Android Studio terbuka. Pilih:
**Build → Build Bundle(s) / APK(s) → Build APK(s)**

APK ada di:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B — Via command line (butuh Android SDK)
```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Untuk release (butuh keystore):
./gradlew assembleRelease
```

---

## 5. Build iOS IPA (Mac only)

```bash
npx cap open ios
```
Di Xcode: **Product → Archive** → distribute ke device / TestFlight.

---

## 6. Workflow Update (setiap ada perubahan kode)

```bash
npm run build        # rebuild Next.js
npx cap sync         # sync ke Android/iOS project
# lalu build APK lagi dari Android Studio
```

Atau pakai shortcut:
```bash
npm run build:mobile  # = next build + cap sync
```

---

## 🔐 Fitur PIN & Biometrik

### Cara kerja
- **Pertama kali buka:** Setup PIN 6 digit
- **Berikutnya:** Lock screen muncul dengan opsi PIN atau biometrik
- **Background tapi process masih jalan:** App TIDAK dikunci ulang (pakai `sessionStorage` sebagai penanda)
- **Process di-kill (swipe up kill / force stop):** `sessionStorage` otomatis hapus → harus unlock lagi

### Logic teknis
```
sessionStorage["keuanganku_session_unlocked"] = "true"
  ↑ set saat user berhasil unlock

Kalau app hanya di-background → sessionStorage tetap ada → skip lock screen
Kalau process di-kill → sessionStorage hilang (per-process) → lock screen muncul
```

### Biometrik
Pakai library `@aparajita/capacitor-biometric-auth`:
- Android: Fingerprint, Face Unlock, atau PIN device
- iOS: Face ID atau Touch ID

Di web browser (dev mode), biometrik tidak tersedia — hanya PIN yang aktif.

---

## 🔧 Android: Enable Biometric Permission

Di `android/app/src/main/AndroidManifest.xml`, pastikan ada:

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

Capacitor biasanya menambahkan ini otomatis saat `cap sync`, tapi verifikasi dulu.

---

## 🔧 iOS: Enable Face ID Permission

Di `ios/App/App/Info.plist`, tambahkan:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Digunakan untuk membuka Keuanganku dengan aman</string>
```

---

## Troubleshooting

**Error: `output: 'export'` tidak kompatibel dengan fitur tertentu**
→ Pastikan tidak ada `getServerSideProps` atau API routes di project. Keuanganku sudah full client-side jadi aman.

**Biometrik tidak muncul di Android**
→ Pastikan device sudah setup fingerprint/face di Settings → Security

**`cap sync` error: webDir not found**
→ Jalankan `npm run build` dulu sebelum sync

**APK tidak bisa install (Install blocked)**
→ Di Android Settings → Security → aktifkan "Install from Unknown Sources" untuk file manager yang kamu pakai

---

## Generate Signed APK (Production)

```bash
# 1. Buat keystore (sekali saja)
keytool -genkey -v -keystore keuanganku.keystore \
  -alias keuanganku -keyalg RSA -keysize 2048 -validity 10000

# 2. Di android/app/build.gradle, tambahkan signingConfigs
# 3. Build release:
cd android && ./gradlew assembleRelease
```
