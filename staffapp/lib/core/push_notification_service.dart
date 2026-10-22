import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_client.dart';
import 'session_manager.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[StaffPush] Background message: ${message.messageId}');
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  bool _initialized = false;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    try {
      await Firebase.initializeApp();

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;

      // Request permission (especially needed for Android 13+)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('[StaffPush] Authorization status: ${settings.authorizationStatus}');

      // Configure foreground presentation
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Listen for foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[StaffPush] Foreground notification: ${message.notification?.title}');
      });

      // Token refresh listener
      messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        syncTokenWithBackend();
      });

      // Retrieve device FCM token
      _fcmToken = await messaging.getToken();
      debugPrint('[StaffPush] FCM Device Token: $_fcmToken');

      await syncTokenWithBackend();
    } catch (e, st) {
      debugPrint('[StaffPush] Push initialization error: $e\n$st');
    }
  }

  /// Sends device FCM token to backend /api/staff/my/fcm-token
  Future<void> syncTokenWithBackend() async {
    try {
      if (_fcmToken == null || _fcmToken!.isEmpty) return;

      final isLoggedIn = await SessionManager.isLoggedIn();
      if (!isLoggedIn) return;

      await ApiClient.post('/api/staff/my/fcm-token', {
        'token': _fcmToken,
      });
      debugPrint('[StaffPush] FCM token successfully registered with backend ✓');
    } catch (e) {
      debugPrint('[StaffPush] Failed to sync FCM token with backend: $e');
    }
  }
}
