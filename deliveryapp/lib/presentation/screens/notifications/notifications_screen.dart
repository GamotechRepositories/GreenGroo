import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/notification_inbox_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../shell/shell_navigation.dart';

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
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(local.year, local.month, local.day);
    final time = TimeOfDay.fromDateTime(local);
    final hh = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final mm = time.minute.toString().padLeft(2, '0');
    final ampm = time.period == DayPeriod.am ? 'AM' : 'PM';
    final clock = '$hh:$mm $ampm';
    if (day == today) return clock;
    if (day == today.subtract(const Duration(days: 1))) return 'Yesterday';
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

  Future<void> _confirmClearAll() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all notifications?'),
        content: const Text('This removes all notifications from your list.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Clear all'),
          ),
        ],
      ),
    );
    if (ok == true) await _inbox.clearAll();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final items = _inbox.items;
    final topInset = MediaQuery.paddingOf(context).top;

    final list = RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _inbox.refresh,
      child: _inbox.loading && items.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 160),
                Center(child: CircularProgressIndicator()),
              ],
            )
          : items.isEmpty
              ? ListView(
                  children: [
                    const SizedBox(height: 120),
                    Icon(
                      Icons.notifications_none_rounded,
                      size: 52,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No notifications yet',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Orders, shifts, gigs and wallet updates will show here.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.only(bottom: 24),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    thickness: 1,
                    color: Colors.grey.shade200,
                  ),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return _NotificationRow(
                      id: item.id,
                      title: item.title,
                      body: item.body.isEmpty ? item.title : item.body,
                      time: _timeLabel(item.createdAt),
                      isUnread: !item.isRead,
                      onTap: () => _openRelated(item),
                      onDismiss: () => _inbox.deleteOne(item.id),
                    );
                  },
                ),
    );

    final body = Column(
      children: [
        Container(
          width: double.infinity,
          color: AppColors.primaryDark,
          padding: EdgeInsets.fromLTRB(8, topInset + 4, 8, 14),
          child: Row(
            children: [
              if (!widget.embedded)
                IconButton(
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                )
              else
                Builder(
                  builder: (ctx) => IconButton(
                    onPressed: () => Scaffold.of(ctx).openDrawer(),
                    icon: const Icon(Icons.menu, color: Colors.white),
                  ),
                ),
              Expanded(
                child: Text(
                  l10n.notifications,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 48),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: items.isEmpty ? null : _inbox.markAllRead,
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.done_all_rounded,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Mark all as read',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF374151),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Container(width: 1, height: 28, color: Colors.grey.shade300),
                Expanded(
                  child: InkWell(
                    onTap: items.isEmpty ? null : _confirmClearAll,
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.delete_outline_rounded,
                            size: 16,
                            color: Color(0xFFDC2626),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Clear all',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(child: list),
      ],
    );

    return ColoredBox(
      color: Colors.white,
      child: body,
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    required this.isUnread,
    required this.onTap,
    required this.onDismiss,
  });

  final String id;
  final String title;
  final String body;
  final String time;
  final bool isUnread;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: const Color(0xFFDC2626),
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 6, right: 10),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isUnread ? AppColors.primary : Colors.transparent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF111827),
                              height: 1.25,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          time,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      body,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        height: 1.4,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(left: 4, top: 18),
                child: Icon(
                  Icons.chevron_right_rounded,
                  size: 22,
                  color: Color(0xFFD1D5DB),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
