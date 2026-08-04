import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Initializes Firebase using native Android config ([google-services.json]).
///
/// Run `dart pub global run flutterfire_cli:flutterfire configure` and switch
/// to [DefaultFirebaseOptions] when iOS or web support is required.
Future<void> ensureFirebaseInitialized() async {
  if (Firebase.apps.isNotEmpty) {
    return;
  }

  if (kIsWeb) {
    return;
  }

  if (!Platform.isAndroid) {
    if (kDebugMode) {
      debugPrint(
        'Firebase: push notifications are configured for Android only. '
        'Run flutterfire configure for other platforms.',
      );
    }
    return;
  }

  await Firebase.initializeApp();
}
