import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/notification_tile.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Notifications',
        subtitle: 'Stay updated',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: const [
          NotificationTile(
            title: 'New Order',
            message: 'A new delivery order is available near you',
            time: '— min ago',
            type: NotificationType.order,
            isUnread: true,
          ),
          SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: 'Payment Received',
            message: 'Your delivery payment has been credited',
            time: '— hour ago',
            type: NotificationType.payment,
          ),
          SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: 'Incentive Unlocked',
            message: 'You unlocked a weekly bonus incentive',
            time: '— hour ago',
            type: NotificationType.incentive,
          ),
          SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: 'Announcement',
            message: 'New safety guidelines for delivery partners',
            time: '— day ago',
            type: NotificationType.announcement,
          ),
          SizedBox(height: AppSpacing.md),
          NotificationTile(
            title: 'Support Update',
            message: 'Your support ticket has been updated',
            time: '— day ago',
            type: NotificationType.support,
          ),
        ],
      ),
    );
  }
}
