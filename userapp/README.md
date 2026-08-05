# GreenGrocc — Flutter mobile app

B2B wholesale mobile accessories app. Uses the same backend as the React web frontend (`../backend`).

## Prerequisites

- Flutter SDK 3.x
- Android Studio / Xcode (for device builds)
- Backend running on port **5001** (`cd ../backend && npm run dev`)

## Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Set `API_URL` in `.env` (default is production):
   - **Production:** `https://api.greengrocc.in`
   - **Physical phone (local backend):** your PC LAN IP, e.g. `http://192.168.1.35:5001`
   - **Android emulator:** `http://10.0.2.2:5001`
   - **iOS simulator:** `http://localhost:5001`

3. Ensure the backend listens on all interfaces (`0.0.0.0`) so the phone can reach it.

4. Install dependencies:

   ```bash
   flutter pub get
   ```

## Run on device

```bash
flutter devices
flutter run -d <device-id>
```

After changing `.env`, do a full restart (not hot reload).

## App icon & splash

Branding assets live in `assets/images/app_logo.png`. Regenerate native icons and splash after updating the logo:

```bash
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Release APK (Android)

**Package ID:** `com.greengrocc.app`

### Quick debug-signed release (testing)

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Play Store signing

1. Create a keystore:

   ```bash
   keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

2. Copy `android/key.properties.example` to `android/key.properties` and fill in passwords/paths.

3. Build:

   ```bash
   flutter build appbundle --release
   ```

Release builds enable R8 minification with ProGuard rules for Razorpay (`android/app/proguard-rules.pro`).

## Permissions (Android)

- `INTERNET` / `ACCESS_NETWORK_STATE` — API calls
- `POST_NOTIFICATIONS` — order / promo push (Android 13+)
- `CAMERA` — optional camera capture for UPI payment proof / support attachments
- `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion=29`) — save product image on legacy Android only
- Gallery picks use the **Android Photo Picker** via `image_picker` — **no** `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`
- Cleartext HTTP enabled for local/LAN backend testing

## Payments

- **Razorpay:** backend must have `RAZORPAY_KEY_ID` configured
- **UPI QR:** set `MERCHANT_UPI_ID` and `MERCHANT_UPI_NAME` in `.env`

## Tests

```bash
flutter test
flutter analyze
```

CI runs automatically on pull requests that touch `mobile app/` (see `.github/workflows/mobile-app-ci.yml`).

## Deep links

Shared product links open directly in the app when it is installed:

- `https://www.greengrocc.in/product/<id>` (App Links / Universal Links)
- `greengrocc://product/<id>` (custom scheme fallback)

### Android App Links

1. Host `frontend/public/.well-known/assetlinks.json` on `www.greengrocc.in` (deploy the frontend).
2. Add your **Play Console → App integrity → App signing** SHA-256 fingerprint to `sha256_cert_fingerprints` (debug builds already include the local debug cert).
3. Reinstall the app after manifest changes (`android:autoVerify="true"`).
4. Verify: `adb shell pm get-app-links com.greengrocc.app`

### iOS Universal Links

1. Replace `TEAM_ID` in `frontend/public/.well-known/apple-app-site-association` with your Apple Developer Team ID.
2. Deploy the frontend so both `/.well-known/apple-app-site-association` and `/apple-app-site-association` are served as JSON.
3. `Runner.entitlements` includes associated domains for `.in` and `.com` hosts.

## iOS release

**Bundle ID:** `com.greengrocc.app` (matches Android)

```bash
flutter build ipa --release
```

Requires Xcode signing setup on a Mac.

## Migration complete

The Flutter app mirrors the React web frontend: auth, catalog, cart, checkout (Razorpay + UPI), orders, profile, support, and static pages — all using the same backend API.
