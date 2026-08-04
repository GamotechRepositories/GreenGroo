import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/app_notification.dart';
import '../../models/push_notification_payload.dart';
import '../../routes/app_router.dart';
import '../../routes/route_paths.dart';
import 'notifications_controller.dart';

class NotificationPendingNavigation {
  NotificationPendingNavigation._();

  static PushNotificationPayload? _pending;

  static void store(PushNotificationPayload payload) {
    _pending = payload;
  }

  static PushNotificationPayload? consume() {
    final payload = _pending;
    _pending = null;
    return payload;
  }
}

abstract final class NotificationNavigator {
  static Future<void> openFromPayload(
    BuildContext context,
    WidgetRef ref,
    PushNotificationPayload payload, {
    String? notificationId,
  }) async {
    final type = payload.type ?? '';
    final orderId = payload.orderId;
    final offerId = payload.offerId;
    final linkTarget = payload.data['linkTarget']?.toString() ?? '';
    final resolvedNotificationId = notificationId ?? payload.notificationId;

    if (resolvedNotificationId != null && resolvedNotificationId.isNotEmpty) {
      await ref
          .read(notificationsControllerProvider.notifier)
          .markRead(resolvedNotificationId);
    }
    if (!context.mounted) return;

    if (_isOrderType(type) && orderId != null && orderId.isNotEmpty) {
      _push(context, '/orders/$orderId');
      return;
    }

    if (type == 'offer' || type == 'promotional') {
      if (linkTarget == 'hot_selling') {
        _push(context, RoutePaths.hotSelling);
        return;
      }
      if (linkTarget == 'home') {
        _push(context, RoutePaths.home);
        return;
      }
      if (offerId != null && offerId.isNotEmpty) {
        _push(context, '/product/$offerId');
        return;
      }
      _push(context, RoutePaths.justArrived);
      return;
    }

    if (_isPaymentType(type) && orderId != null && orderId.isNotEmpty) {
      _push(context, '/orders/$orderId');
      return;
    }

    // General / test notifications — stay on current screen (system tray only).
    return;
  }

  static Future<void> openFromAppNotification(
    BuildContext context,
    WidgetRef ref,
    AppNotification notification,
  ) async {
    if (!notification.isRead) {
      await ref
          .read(notificationsControllerProvider.notifier)
          .markRead(notification.id);
    }
    if (!context.mounted) return;

    if (notification.isOrderRelated &&
        notification.orderId != null &&
        notification.orderId!.isNotEmpty) {
      _push(context, '/orders/${notification.orderId}');
      return;
    }

    if (notification.isOffer || notification.type == 'promotional') {
      final linkTarget = notification.data['linkTarget']?.toString() ?? '';
      if (linkTarget == 'hot_selling') {
        _push(context, RoutePaths.hotSelling);
        return;
      }
      if (linkTarget == 'home') {
        _push(context, RoutePaths.home);
        return;
      }
      final offerId = notification.offerId;
      if (offerId != null && offerId.isNotEmpty) {
        _push(context, '/product/$offerId');
        return;
      }
      _push(context, RoutePaths.justArrived);
      return;
    }

    if (notification.isPaymentRelated &&
        notification.orderId != null &&
        notification.orderId!.isNotEmpty) {
      _push(context, '/orders/${notification.orderId}');
      return;
    }
  }

  static Future<void> flushPending(BuildContext context, WidgetRef ref) async {
    final pending = NotificationPendingNavigation.consume();
    if (pending == null) return;

    final rootContext = rootNavigatorKey.currentContext ?? context;
    if (!rootContext.mounted) return;

    await openFromPayload(rootContext, ref, pending);
  }

  static PushNotificationPayload? parseLocalPayload(String? raw) {
    if (raw == null || raw.isEmpty) return null;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) return null;
      return PushNotificationPayload(
        title: decoded['title']?.toString(),
        body: decoded['body']?.toString(),
        data: Map<String, dynamic>.from(decoded),
        messageId: decoded['messageId']?.toString(),
      );
    } catch (_) {
      return null;
    }
  }

  static void _push(BuildContext context, String path) {
    if (!context.mounted) return;
    context.push(path);
  }

  static bool _isOrderType(String type) {
    return type.startsWith('order_') || type == 'out_for_delivery';
  }

  static bool _isPaymentType(String type) {
    return type.startsWith('payment_');
  }
}
