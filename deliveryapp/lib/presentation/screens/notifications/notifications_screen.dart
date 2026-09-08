import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../data/services/announcement_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/notification_tile.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<HrAnnouncement> _announcements = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await AnnouncementService.instance.fetchLive();
      if (mounted) setState(() => _announcements = items);
    } catch (_) {}
  }

  String _timeLabel(HrAnnouncement item) {
    final when = item.publishedAt;
    if (when == null) return '';
    final diff = DateTime.now().difference(when);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final body = ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        if (_announcements.isEmpty)
          NotificationTile(
            title: l10n.notificationAnnouncement,
            message: l10n.notificationAnnouncementMessage,
            time: l10n.timeDayAgo,
            type: NotificationType.announcement,
          )
        else
          ..._announcements.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: NotificationTile(
                title: item.title,
                message: item.body.isEmpty ? l10n.notificationAnnouncement : item.body,
                time: _timeLabel(item),
                type: NotificationType.announcement,
                isUnread: true,
              ),
            ),
          ),
        if (_announcements.isNotEmpty) const SizedBox(height: AppSpacing.md),
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
          title: l10n.notificationSupportUpdate,
          message: l10n.notificationSupportMessage,
          time: l10n.timeDayAgo,
          type: NotificationType.support,
        ),
      ],
    );

    if (widget.embedded) return body;

    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.notifications,
        subtitle: l10n.stayUpdated,
        showBackButton: true,
      ),
      body: body,
    );
  }
}
