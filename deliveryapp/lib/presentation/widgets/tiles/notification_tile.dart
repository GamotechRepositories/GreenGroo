import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../cards/dashboard_card.dart';

enum NotificationType { order, payment, incentive, announcement, support }

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.title,
    required this.message,
    required this.time,
    required this.type,
    this.onTap,
    this.isUnread = false,
  });

  final String title;
  final String message;
  final String time;
  final NotificationType type;
  final VoidCallback? onTap;
  final bool isUnread;

  IconData get _icon {
    return switch (type) {
      NotificationType.order => Icons.local_shipping_outlined,
      NotificationType.payment => Icons.payments_outlined,
      NotificationType.incentive => Icons.emoji_events_outlined,
      NotificationType.announcement => Icons.campaign_outlined,
      NotificationType.support => Icons.support_agent_outlined,
    };
  }

  Color get _color {
    return switch (type) {
      NotificationType.order => AppColors.primary,
      NotificationType.payment => AppColors.info,
      NotificationType.incentive => AppColors.warning,
      NotificationType.announcement => AppColors.primaryDark,
      NotificationType.support => AppColors.textSecondary,
    };
  }

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(_icon, color: _color, size: 22),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontSize: 15,
                            ),
                      ),
                    ),
                    if (isUnread)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(message, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.sm),
                Text(time, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
