import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/theme.dart';
import '../core/utils/notification_time.dart';
import '../features/notifications/notification_navigator.dart';
import '../features/notifications/notifications_controller.dart';
import '../features/notifications/widgets/notification_tile.dart';
import '../models/app_notification.dart';

class NotificationDetailScreen extends ConsumerStatefulWidget {
  const NotificationDetailScreen({
    super.key,
    required this.notificationId,
  });

  final String notificationId;

  @override
  ConsumerState<NotificationDetailScreen> createState() =>
      _NotificationDetailScreenState();
}

class _NotificationDetailScreenState
    extends ConsumerState<NotificationDetailScreen> {
  bool _markedRead = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureLoaded());
  }

  Future<void> _ensureLoaded() async {
    final state = ref.read(notificationsControllerProvider);
    if (!state.hasLoaded) {
      await ref
          .read(notificationsControllerProvider.notifier)
          .loadNotifications(force: true);
    }
    if (!mounted || _markedRead) return;

    final notification = _findNotification(
      ref.read(notificationsControllerProvider),
    );
    if (notification != null && !notification.isRead) {
      _markedRead = true;
      await ref
          .read(notificationsControllerProvider.notifier)
          .markRead(notification.id);
    }
  }

  AppNotification? _findNotification(NotificationsState state) {
    for (final item in state.items) {
      if (item.id == widget.notificationId) return item;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsControllerProvider);
    final notification = _findNotification(state);

    if (notification == null && !state.loading && state.hasLoaded) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notification')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Notification not found'),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Go back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (notification == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Notification'),
        actions: [
          if (notification.isOrderRelated ||
              notification.isOffer ||
              notification.isPaymentRelated)
            TextButton(
              onPressed: () => NotificationNavigator.openFromAppNotification(
                context,
                ref,
                notification,
              ),
              child: const Text('Open'),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          NotificationTile(
            notification: notification,
            dismissible: false,
            onTap: () {},
            onDismissed: () {},
          ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.borderLight),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    formatNotificationTime(notification.createdAt),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.textMuted,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    notification.body,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          height: 1.5,
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
