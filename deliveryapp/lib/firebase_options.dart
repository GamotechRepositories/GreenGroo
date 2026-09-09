import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Firebase client options loaded from `.env` (gitignored).
///
/// NOTE: These are *client* config values (same class as `google-services.json`),
/// not Admin SDK secrets. Real secrets (service account private key) stay on the
/// backend only — never put them in this Flutter app.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static String _req(String key) {
    final v = dotenv.env[key]?.trim() ?? '';
    if (v.isEmpty) {
      throw StateError(
        'Missing $key in deliveryapp/.env — copy from .env.example and fill Firebase values.',
      );
    }
    return v;
  }

  static String _opt(String key, [String fallback = '']) =>
      dotenv.env[key]?.trim() ?? fallback;

  static FirebaseOptions get web => FirebaseOptions(
        apiKey: _req('FIREBASE_WEB_API_KEY'),
        appId: _req('FIREBASE_WEB_APP_ID'),
        messagingSenderId: _req('FIREBASE_MESSAGING_SENDER_ID'),
        projectId: _req('FIREBASE_PROJECT_ID'),
        authDomain: _opt('FIREBASE_AUTH_DOMAIN'),
        storageBucket: _opt('FIREBASE_STORAGE_BUCKET'),
        measurementId: _opt('FIREBASE_WEB_MEASUREMENT_ID'),
      );

  static FirebaseOptions get android => FirebaseOptions(
        apiKey: _req('FIREBASE_ANDROID_API_KEY'),
        appId: _req('FIREBASE_ANDROID_APP_ID'),
        messagingSenderId: _req('FIREBASE_MESSAGING_SENDER_ID'),
        projectId: _req('FIREBASE_PROJECT_ID'),
        storageBucket: _opt('FIREBASE_STORAGE_BUCKET'),
      );

  static FirebaseOptions get ios => FirebaseOptions(
        apiKey: _req('FIREBASE_IOS_API_KEY'),
        appId: _req('FIREBASE_IOS_APP_ID'),
        messagingSenderId: _req('FIREBASE_MESSAGING_SENDER_ID'),
        projectId: _req('FIREBASE_PROJECT_ID'),
        storageBucket: _opt('FIREBASE_STORAGE_BUCKET'),
        iosBundleId: _opt('FIREBASE_IOS_BUNDLE_ID', 'com.greenrow.delivery'),
      );

  static FirebaseOptions get macos {
    final iosAppId = dotenv.env['FIREBASE_IOS_APP_ID']?.trim() ?? '';
    final macAppId = dotenv.env['FIREBASE_MACOS_APP_ID']?.trim() ?? '';
    final appId = macAppId.isNotEmpty ? macAppId : iosAppId;
    if (appId.isEmpty) {
      throw StateError(
        'Missing FIREBASE_MACOS_APP_ID or FIREBASE_IOS_APP_ID in deliveryapp/.env',
      );
    }
    return FirebaseOptions(
      apiKey: _req('FIREBASE_IOS_API_KEY'),
      appId: appId,
      messagingSenderId: _req('FIREBASE_MESSAGING_SENDER_ID'),
      projectId: _req('FIREBASE_PROJECT_ID'),
      storageBucket: _opt('FIREBASE_STORAGE_BUCKET'),
      iosBundleId: _opt('FIREBASE_MACOS_BUNDLE_ID', 'com.example.deliveryapp'),
    );
  }

  static FirebaseOptions get windows => FirebaseOptions(
        apiKey: _req('FIREBASE_WEB_API_KEY'),
        appId: _req('FIREBASE_WINDOWS_APP_ID'),
        messagingSenderId: _req('FIREBASE_MESSAGING_SENDER_ID'),
        projectId: _req('FIREBASE_PROJECT_ID'),
        authDomain: _opt('FIREBASE_AUTH_DOMAIN'),
        storageBucket: _opt('FIREBASE_STORAGE_BUCKET'),
        measurementId: _opt('FIREBASE_WINDOWS_MEASUREMENT_ID'),
      );
}
