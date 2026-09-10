import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../core/config/api_config.dart';
import '../../core/routes/app_routes.dart';
import '../../presentation/shell/shell_navigation.dart';
import 'auth_service.dart';
import 'notification_inbox_service.dart';

/// Global navigator key for FCM tap deep-links.
final GlobalKey<NavigatorState> notificationNavigatorKey =
    GlobalKey<NavigatorState>();

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  bool _initialized = false;
  Map<String, dynamic>? _pendingTap;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('FCM permission: ${settings.authorizationStatus}');

      final token = await _messaging.getToken();
      debugPrint('FCM token: $token');
      await _syncTokenToBackend(token);

      _messaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM token refreshed: $newToken');
        _syncTokenToBackend(newToken);
      });

      // App open: NO system tray — inbox + apply verification instantly if needed
      FirebaseMessaging.onMessage.listen((message) async {
        debugPrint('FCM foreground (no tray): ${message.messageId}');
        final type = message.data['type']?.toString() ?? '';
        if (type == 'VERIFICATION_COMPLETED') {
          await AuthService.instance.applyVerificationStatus('approved');
          await AuthService.instance.fetchMe();
        }
        final id = message.data['notificationId']?.toString();
        if (id != null && id.isNotEmpty) {
          await NotificationInboxService.instance.refreshUnreadOnly();
        } else {
          await NotificationInboxService.instance.refresh();
        }
      });

      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        debugPrint('FCM opened from background: ${message.messageId}');
        _queueNotificationTap(message.data);
        NotificationInboxService.instance.refresh();
      });

      final initial = await _messaging.getInitialMessage();
      if (initial != null) {
        debugPrint('FCM opened from terminated: ${initial.messageId}');
        _queueNotificationTap(initial.data);
      }

      NotificationInboxService.instance.ensureSocketListeners();
      await NotificationInboxService.instance.refreshUnreadOnly();
    } catch (e, st) {
      debugPrint('PushNotificationService.init failed: $e');
      debugPrint('$st');
      _initialized = false;
    }
  }

  /// Call when MainShell is ready so deep-links work after cold start.
  void consumePendingTap() {
    final pending = _pendingTap;
    if (pending == null) return;
    _pendingTap = null;
    _applyNotificationTap(pending);
  }

  void _queueNotificationTap(Map<String, dynamic> data) {
    _pendingTap = Map<String, dynamic>.from(data);
    // Apply immediately if shell is already up; otherwise MainShell will consume.
    if (ShellNavigation.instance.tabNotifier != null) {
      consumePendingTap();
    } else {
      // Retry a few times while splash → home finishes.
      var attempts = 0;
      void retry() {
        attempts++;
        if (_pendingTap == null) return;
        if (ShellNavigation.instance.tabNotifier != null) {
          consumePendingTap();
          return;
        }
        if (attempts < 40) {
          Future.delayed(const Duration(milliseconds: 250), retry);
        }
      }

      Future.delayed(const Duration(milliseconds: 400), retry);
    }
  }

  void _applyNotificationTap(Map<String, dynamic> data) {
    final screen = (data['screen'] ?? '').toString().toLowerCase();
    final type = (data['type'] ?? '').toString().toUpperCase();
    final nav = notificationNavigatorKey.currentState;
    final shell = ShellNavigation.instance;

    void goTab(int i) => shell.goToTab(i);

    if (screen == 'wallet' ||
        type == 'ORDER_COMPLETED' ||
        type == 'WALLET_CREDITED') {
      goTab(3);
      nav?.pushNamed(AppRoutes.wallet);
      return;
    }
    if (screen == 'shifts' ||
        type == 'SHIFT_STARTED' ||
        type == 'SHIFT_REMINDER') {
      goTab(1);
      return;
    }
    if (screen == 'gigs' || type == 'NEW_GIG') {
      nav?.pushNamed(AppRoutes.gigs);
      return;
    }
    if (type == 'ORDER_RECEIVED' || screen == 'home' || screen == 'orders') {
      goTab(0);
      return;
    }
    goTab(4); // notifications tab
  }

  Future<void> syncTokenNow() async {
    try {
      final token = await _messaging.getToken();
      await _syncTokenToBackend(token);
    } catch (e) {
      debugPrint('syncTokenNow failed: $e');
    }
  }

  Future<void> _syncTokenToBackend(String? token) async {
    if (token == null || token.isEmpty) return;
    final auth = AuthService.instance;
    if (auth.token == null || auth.token!.isEmpty) {
      debugPrint('FCM token ready but user not logged in yet');
      return;
    }
    try {
      final res = await apiPost(
        ApiConfig.fcmToken,
        headers: {
          ...ApiConfig.defaultHeaders,
          'Authorization': 'Bearer ${auth.token}',
        },
        body: jsonEncode({'fcmToken': token}),
      );
      debugPrint('FCM token sync status: ${res.statusCode}');
    } catch (e) {
      debugPrint('FCM token sync failed: $e');
    }
  }
}
