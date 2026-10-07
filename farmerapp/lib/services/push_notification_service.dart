import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../config/app_env.dart';
import '../firebase_options.dart';
import '../screens/documents/documents_screen.dart';
import '../screens/earnings/earnings_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/orders/order_detail_screen.dart';
import '../screens/orders/orders_screen.dart';
import '../screens/schemes/schemes_screen.dart';
import 'api_service.dart';
import 'app_language.dart';
import 'farmer_state.dart';

/// Must match FARMER_CHANNEL_ID in backend/farmer-manager-service/src/farmerPush.js.
const String kFarmerChannelId = 'farmer_alerts';

Future<bool> _ensureFirebase() async {
  if (Firebase.apps.isNotEmpty) return true;
  await AppEnv.load();
  final options = DefaultFirebaseOptions.currentPlatform;
  if (options == null) return false;
  await Firebase.initializeApp(options: options);
  return true;
}

/// Runs in a separate isolate while the app is in background or closed. The system tray
/// already shows FCM `notification` messages, so only Firebase needs to be ready here.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await _ensureFirebase();
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  GlobalKey<NavigatorState>? _navigatorKey;
  bool _initialized = false;
  bool _available = false;
  bool _shellReady = false;
  String? _token;
  String? _syncedKey;
  Map<String, dynamic>? _pendingTap;

  bool get isAvailable => _available;

  Future<void> init({required GlobalKey<NavigatorState> navigatorKey}) async {
    if (_initialized) return;
    _initialized = true;
    _navigatorKey = navigatorKey;
    try {
      if (!await _ensureFirebase()) {
        debugPrint('[Push] Firebase keys missing in .env — push disabled');
        return;
      }
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await _initLocalNotifications();

      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(alert: true, badge: true, sound: true);
      debugPrint('[Push] permission: ${settings.authorizationStatus}');
      await messaging.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
      _available = true;

      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen((m) => _queueTap(m.data));
      messaging.onTokenRefresh.listen((t) {
        _token = t;
        syncToken();
      });
      AppLanguage().addListener(syncToken);

      final initial = await messaging.getInitialMessage();
      if (initial != null) _queueTap(initial.data);

      _token = await messaging.getToken();
      debugPrint('[Push] FCM token: $_token');
      await syncToken();
    } catch (e, st) {
      debugPrint('[Push] init failed: $e\n$st');
    }
  }

  Future<void> _initLocalNotifications() async {
    await _local.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        try {
          final decoded = jsonDecode(payload);
          if (decoded is Map) _queueTap(Map<String, dynamic>.from(decoded));
        } catch (_) {}
      },
    );

    await _local
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          kFarmerChannelId,
          'Farmer alerts',
          description: 'Orders, pickups, payments, documents and scheme updates',
          importance: Importance.high,
        ));

    final launch = await _local.getNotificationAppLaunchDetails();
    final payload = launch?.notificationResponse?.payload;
    if ((launch?.didNotificationLaunchApp ?? false) && payload != null && payload.isNotEmpty) {
      try {
        final decoded = jsonDecode(payload);
        if (decoded is Map) _queueTap(Map<String, dynamic>.from(decoded));
      } catch (_) {}
    }
  }

  void _onForegroundMessage(RemoteMessage message) {
    FarmerState().requestSync();
    // Document reviews already raise an in-app snackbar with a View button.
    if ((message.data['type'] ?? '').toString().toUpperCase() == 'DOCUMENT') return;

    final title = message.notification?.title ?? message.data['title']?.toString() ?? '';
    final body = message.notification?.body ?? message.data['body']?.toString() ?? '';
    if (title.isEmpty && body.isEmpty) return;
    final tag = message.data['tag']?.toString();

    _local.show(
      id: (tag != null && tag.isNotEmpty ? tag : message.messageId ?? '$title$body').hashCode & 0x7fffffff,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          kFarmerChannelId,
          'Farmer alerts',
          channelDescription: 'Orders, pickups, payments, documents and scheme updates',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          tag: (tag != null && tag.isNotEmpty) ? tag : null,
          styleInformation: BigTextStyleInformation(body),
        ),
        iOS: const DarwinNotificationDetails(presentAlert: true, presentSound: true),
      ),
      payload: jsonEncode(message.data),
    );
  }

  /// Sends the current FCM token to the backend once the farmer is logged in.
  Future<void> syncToken() async {
    final token = _token;
    if (!_available || token == null || token.isEmpty) return;
    if (!FarmerState().isLoggedIn || (ApiService().token ?? '').isEmpty) return;
    final language = AppLanguage().isMarathi ? 'mr' : 'en';
    final key = '${ApiService().token}|$token|$language';
    if (key == _syncedKey) return;
    try {
      await ApiService().registerPushToken(token, platform: defaultTargetPlatform.name, language: language);
      _syncedKey = key;
      debugPrint('[Push] token registered with backend');
    } catch (e) {
      debugPrint('[Push] token sync failed: $e');
    }
  }

  /// Call before the session token is cleared so the backend stops pushing to this phone.
  Future<void> unregister({String? authToken}) async {
    _syncedKey = null;
    _shellReady = false;
    final token = _token;
    if (!_available || token == null || token.isEmpty) return;
    try {
      await ApiService().unregisterPushToken(token, authToken: authToken);
    } catch (e) {
      debugPrint('[Push] token removal failed: $e');
    }
  }

  /// MainShell is on screen; taps that arrived during splash/login can open now.
  void setShellReady(bool ready) {
    _shellReady = ready;
    if (ready) _consumePendingTap();
  }

  void _queueTap(Map<String, dynamic> data) {
    _pendingTap = data;
    FarmerState().requestSync();
    _consumePendingTap();
  }

  void _consumePendingTap() {
    final data = _pendingTap;
    final nav = _navigatorKey?.currentState;
    if (data == null || nav == null || !_shellReady || !FarmerState().isLoggedIn) return;
    _pendingTap = null;

    final screen = (data['screen'] ?? '').toString().toLowerCase();
    final orderId = (data['orderId'] ?? '').toString();
    final Widget page;
    switch (screen) {
      case 'order':
        page = orderId.isNotEmpty ? OrderDetailScreen(orderId: orderId) : const OrdersScreen();
      case 'earnings':
        page = const EarningsScreen();
      case 'documents':
        page = const DocumentsScreen();
      case 'schemes':
        page = const SchemesScreen();
      default:
        page = const NotificationsScreen();
    }
    nav.push(MaterialPageRoute(builder: (_) => page));
  }

  Future<Map<String, dynamic>?> sendTestNotification() async {
    final res = await ApiService().sendTestPush();
    return res is Map ? Map<String, dynamic>.from(res) : null;
  }
}
