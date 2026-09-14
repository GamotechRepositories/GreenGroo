import 'package:flutter/material.dart';

import '../../../config/theme.dart';
import '../../../core/utils/notification_time.dart';
import '../../../models/app_notification.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
    required this.onDismissed,
    this.dismissible = true,
  });

  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismissed;
  final bool dismissible;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final content = Material(
      color: notification.isRead
          ? AppColors.mobileBg
          : AppColors.primary.withValues(alpha: 0.04),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _NotificationTypeIcon(notification: notification),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: notification.isRead
                                  ? FontWeight.w600
                                  : FontWeight.w800,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(left: 8),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      formatNotificationTime(notification.createdAt),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (!dismissible) return content;

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismissed(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red.shade600,
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
      ),
      child: content,
    );
  }
}

class _NotificationTypeIcon extends StatelessWidget {
  const _NotificationTypeIcon({required this.notification});

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _resolveIcon(notification);

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: color, size: 22),
    );
  }

  (IconData, Color) _resolveIcon(AppNotification notification) {
    if (notification.isOffer) {
      return (Icons.local_offer_outlined, Colors.deepPurple);
    }
    if (notification.isPaymentRelated) {
      return (Icons.payments_outlined, Colors.green.shade700);
    }
    if (notification.isOrderRelated) {
      return (Icons.receipt_long_outlined, AppColors.primary);
    }
    return (Icons.notifications_none_rounded, AppColors.navSelected);
  }
}
