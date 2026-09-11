import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/services/notification_inbox_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../shell/shell_navigation.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/notification_tile.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _inbox = NotificationInboxService.instance;

  @override
  void initState() {
    super.initState();
    _inbox.ensureSocketListeners();
    _inbox.addListener(_onInbox);
    _inbox.refresh();
  }

  @override
  void dispose() {
    _inbox.removeListener(_onInbox);
    super.dispose();
  }

  void _onInbox() {
    if (mounted) setState(() {});
  }

  String _timeLabel(DateTime? when) {
    if (when == null) return '';
    final local = when.toLocal();
    final diff = DateTime.now().difference(local);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${local.day}/${local.month}/${local.year}';
  }

  void _openRelated(RiderNotification item) {
    _inbox.markRead(item.id);
    final screen = item.screen.toLowerCase();
    final type = item.type.toUpperCase();

    if (screen == 'wallet' ||
        type == 'ORDER_COMPLETED' ||
        type == 'WALLET_CREDITED') {
      if (widget.embedded) {
        ShellNavigation.instance.goToTab(3);
      } else {
        Navigator.pushNamed(context, AppRoutes.wallet);
      }
      return;
    }
    if (screen == 'shifts' ||
        type == 'SHIFT_STARTED' ||
        type == 'SHIFT_REMINDER') {
      if (widget.embedded) {
        ShellNavigation.instance.goToTab(1);
      } else {
        Navigator.pushNamed(context, AppRoutes.myShifts);
      }
      return;
    }
    if (screen == 'gigs' || type == 'NEW_GIG') {
      Navigator.pushNamed(context, AppRoutes.gigs);
      return;
    }
    if (type == 'ORDER_RECEIVED') {
      if (widget.embedded) {
        ShellNavigation.instance.goToTab(0);
      } else {
        Navigator.pushNamed(context, AppRoutes.home);
      }
      final orderId = item.orderId ?? '';
      ShellNavigation.instance.requestOfferRecovery(
        orderId: orderId,
        reason: 'ORDER_RECEIVED',
      );
      return;
    }
    if (type == 'VERIFICATION_COMPLETED') {
      if (widget.embedded) {
        ShellNavigation.instance.goToTab(0);
      } else {
        Navigator.pushNamed(context, AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final items = _inbox.items;

    final body = RefreshIndicator(
      onRefresh: _inbox.refresh,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          if (_inbox.hasUnread)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _inbox.markAllRead,
                child: const Text('Mark all read'),
              ),
            ),
          if (_inbox.loading && items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Column(
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    size: 48,
                    color: Theme.of(context).disabledColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No notifications yet',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Orders, shifts, gigs and wallet updates will show here.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            )
          else
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Dismissible(
                  key: ValueKey(item.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.delete_outline, color: Colors.white),
                  ),
                  onDismissed: (_) => _inbox.deleteOne(item.id),
                  child: NotificationTile(
                    title: item.title,
                    message: item.body.isEmpty ? item.title : item.body,
                    time: _timeLabel(item.createdAt),
                    type: NotificationTile.typeFromString(item.type),
                    isUnread: !item.isRead,
                    badge: item.badge,
                    amount: item.amount,
                    onTap: () => _openRelated(item),
                  ),
                ),
              ),
            ),
        ],
      ),
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
