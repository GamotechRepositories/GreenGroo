import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../firebase/firebase_initializer.dart';
import '../features/notifications/notification_navigator.dart';
import '../models/push_notification_payload.dart';

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  static const String ordersChannelId = 'orders';
  static const String ordersChannelName = 'Orders';

  static Future<void> ensureFirebaseReady() => ensureFirebaseInitialized();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _openedAppSubscription;

  Future<void> Function(String token)? tokenSyncHandler;
  void Function(PushNotificationPayload payload)? onNotificationOpened;
  void Function(PushNotificationPayload payload)? onForegroundMessage;

  bool _initialized = false;
  String? _cachedToken;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    await ensureFirebaseInitialized();

    if (Firebase.apps.isEmpty) {
      if (kDebugMode) {
        debugPrint(
          'NotificationService: Firebase not initialized — skipping FCM setup.',
        );
      }
      return;
    }

    await _initializeLocalNotifications();
    await _createAndroidNotificationChannel();
    await requestPermission();
    await _configureForegroundPresentation();
    _registerForegroundListener();
    _registerOpenedAppListener();
    await _registerInitialMessage();
    await _registerTokenListeners();
    await registerToken();

    _initialized = true;
  }

  Future<void> requestPermission() async {
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.requestNotificationsPermission();

    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint(
      'NotificationService: permission status ${settings.authorizationStatus.name}',
    );
  }

  /// Re-fetches the device token after login or when permission may have changed.
  Future<void> syncTokenWithBackend() => registerToken();

  Future<String?> getToken() async {
    if (Firebase.apps.isEmpty) {
      return null;
    }

    try {
      return await _messaging.getToken();
    } catch (error, stackTrace) {
      if (kDebugMode) {
        debugPrint('NotificationService: getToken failed — $error');
        debugPrint('$stackTrace');
      }
      return null;
    }
  }

  Future<void> registerToken() async {
    final token = await getToken();
    if (token == null || token.isEmpty) {
      debugPrint('NotificationService: no FCM token available yet');
      return;
    }

    _cachedToken = token;
    debugPrint('NotificationService: FCM token $token');

    final handler = tokenSyncHandler;
    if (handler != null) {
      await handler(token);
      return;
    }

    debugPrint(
      'NotificationService: token cached — waiting for login to sync with backend',
    );
  }

  Future<void> dispatchCachedToken() async {
    final token = _cachedToken ?? await getToken();
    if (token == null || token.isEmpty) return;
    _cachedToken = token;

    final handler = tokenSyncHandler;
    if (handler != null) {
      await handler(token);
    }
  }

  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    await ensureFirebaseInitialized();
    if (Firebase.apps.isEmpty) {
      return;
    }

    final payload = PushNotificationPayload.fromRemoteMessage(message);
    if (message.notification == null) {
      await instance._showLocalNotification(payload);
    }
  }

  Future<void> dispose() async {
    await _tokenRefreshSubscription?.cancel();
    await _foregroundSubscription?.cancel();
    await _openedAppSubscription?.cancel();
    _tokenRefreshSubscription = null;
    _foregroundSubscription = null;
    _openedAppSubscription = null;
    tokenSyncHandler = null;
    onNotificationOpened = null;
    onForegroundMessage = null;
    _initialized = false;
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettings = InitializationSettings(
      android: androidSettings,
    );

    await _localNotifications.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTapped,
    );
  }

  Future<void> _createAndroidNotificationChannel() async {
    const channel = AndroidNotificationChannel(
      ordersChannelId,
      ordersChannelName,
      description: 'Order updates and delivery notifications',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    await androidPlugin?.createNotificationChannel(channel);
  }

  Future<void> _configureForegroundPresentation() async {
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  void _registerForegroundListener() {
    _foregroundSubscription =
        FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      debugPrint(
        'NotificationService: foreground message ${message.messageId ?? ''}',
      );
      final payload = PushNotificationPayload.fromRemoteMessage(message);
      onForegroundMessage?.call(payload);
      await _showLocalNotification(payload);
    });
  }

  void _registerOpenedAppListener() {
    _openedAppSubscription =
        FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpened);
  }

  Future<void> _registerInitialMessage() async {
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      NotificationPendingNavigation.store(
        PushNotificationPayload.fromRemoteMessage(initialMessage),
      );
    }
  }

  Future<void> _registerTokenListeners() async {
    final token = await getToken();
    if (kDebugMode && token != null) {
      debugPrint('NotificationService: initial FCM token $token');
    }

    _tokenRefreshSubscription =
        _messaging.onTokenRefresh.listen((String token) async {
      if (kDebugMode) {
        debugPrint('NotificationService: FCM token refreshed $token');
      }
      final handler = tokenSyncHandler;
      if (handler != null) {
        await handler(token);
      } else {
        await registerToken();
      }
    });
  }

  void _onLocalNotificationTapped(NotificationResponse response) {
    final payload = NotificationNavigator.parseLocalPayload(response.payload);
    if (payload == null) {
      return;
    }

    onNotificationOpened?.call(payload);
  }

  void _handleNotificationOpened(RemoteMessage message) {
    final payload = PushNotificationPayload.fromRemoteMessage(message);
    onNotificationOpened?.call(payload);

    if (kDebugMode) {
      debugPrint(
        'NotificationService: notification opened — ${payload.title ?? payload.data}',
      );
    }
  }

  Future<void> _showLocalNotification(PushNotificationPayload payload) async {
    final title = payload.title?.trim();
    final body = payload.body?.trim();

    if ((title == null || title.isEmpty) && (body == null || body.isEmpty)) {
      return;
    }

    try {
      const androidDetails = AndroidNotificationDetails(
        ordersChannelId,
        ordersChannelName,
        channelDescription: 'Order updates and delivery notifications',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
        visibility: NotificationVisibility.public,
        playSound: true,
        enableVibration: true,
        ticker: 'BulkMobileMart',
      );

      const notificationDetails = NotificationDetails(android: androidDetails);

      await _localNotifications.show(
        id: payload.messageId?.hashCode ??
            DateTime.now().millisecondsSinceEpoch,
        title: title ?? ordersChannelName,
        body: body ?? '',
        notificationDetails: notificationDetails,
        payload: jsonEncode(payload.toNavigationMap()),
      );
    } catch (error, stackTrace) {
      debugPrint('NotificationService: local notification failed — $error');
      debugPrint('$stackTrace');
    }
  }
}
