import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/notification_tile.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.notifications,
        subtitle: l10n.stayUpdated,
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          NotificationTile(
            title: l10n.notificationNewOrder,
            message: l10n.notificationNewOrderMessage,
            time: l10n.timeMinAgo,
            type: NotificationType.order,
            isUnread: true,
          ),
          const SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: l10n.notificationPaymentReceived,
            message: l10n.notificationPaymentMessage,
            time: l10n.timeHourAgo,
            type: NotificationType.payment,
          ),
          const SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: l10n.notificationIncentiveUnlocked,
            message: l10n.notificationIncentiveMessage,
            time: l10n.timeHourAgo,
            type: NotificationType.incentive,
          ),
          const SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: l10n.notificationAnnouncement,
            message: l10n.notificationAnnouncementMessage,
            time: l10n.timeDayAgo,
            type: NotificationType.announcement,
          ),
          const SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: l10n.notificationSupportUpdate,
            message: l10n.notificationSupportMessage,
            time: l10n.timeDayAgo,
            type: NotificationType.support,
          ),
        ],
      ),
    );
  }
}
