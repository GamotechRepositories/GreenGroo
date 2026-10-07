import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'config/app_env.dart';

/// Firebase client options built from `.env` (see [AppEnv]).
/// Returns null when the keys for the current platform are missing.
class DefaultFirebaseOptions {
  DefaultFirebaseOptions._();

  static FirebaseOptions? get currentPlatform {
    final projectId = AppEnv.get('FIREBASE_PROJECT_ID');
    final senderId = AppEnv.get('FIREBASE_MESSAGING_SENDER_ID');
    final bucket = AppEnv.get('FIREBASE_STORAGE_BUCKET');
    final authDomain = AppEnv.get('FIREBASE_AUTH_DOMAIN');
    if (projectId.isEmpty || senderId.isEmpty) return null;

    FirebaseOptions? build(String apiKey, String appId,
        {String? bundleId, String? measurementId, bool web = false}) {
      if (apiKey.isEmpty || appId.isEmpty) return null;
      return FirebaseOptions(
        apiKey: apiKey,
        appId: appId,
        messagingSenderId: senderId,
        projectId: projectId,
        storageBucket: bucket.isEmpty ? null : bucket,
        authDomain: web && authDomain.isNotEmpty ? authDomain : null,
        iosBundleId: bundleId == null || bundleId.isEmpty ? null : bundleId,
        measurementId: measurementId == null || measurementId.isEmpty ? null : measurementId,
      );
    }

    final webKey = AppEnv.get('FIREBASE_WEB_API_KEY');
    final iosKey = AppEnv.get('FIREBASE_IOS_API_KEY');

    if (kIsWeb) {
      return build(webKey, AppEnv.get('FIREBASE_WEB_APP_ID'),
          measurementId: AppEnv.get('FIREBASE_WEB_MEASUREMENT_ID'), web: true);
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return build(AppEnv.get('FIREBASE_ANDROID_API_KEY'), AppEnv.get('FIREBASE_ANDROID_APP_ID'));
      case TargetPlatform.iOS:
        return build(iosKey, AppEnv.get('FIREBASE_IOS_APP_ID'),
            bundleId: AppEnv.get('FIREBASE_IOS_BUNDLE_ID'));
      case TargetPlatform.macOS:
        return build(iosKey, AppEnv.get('FIREBASE_MACOS_APP_ID'),
            bundleId: AppEnv.get('FIREBASE_MACOS_BUNDLE_ID'));
      case TargetPlatform.windows:
        return build(webKey, AppEnv.get('FIREBASE_WINDOWS_APP_ID'),
            measurementId: AppEnv.get('FIREBASE_WINDOWS_MEASUREMENT_ID'), web: true);
      default:
        return null;
    }
  }
}
