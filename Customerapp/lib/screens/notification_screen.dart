import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/theme.dart';
import '../core/scroll/app_scroll_config.dart';
import '../features/auth/auth_controller.dart';
import '../features/notifications/notification_navigator.dart';
import '../features/notifications/notifications_controller.dart';
import '../features/notifications/widgets/notification_tile.dart';
import '../widgets/common/refreshable_body.dart';
import '../widgets/common/skeleton_loaders.dart';

class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadInitial());
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    final isLoggedIn = ref.read(authControllerProvider).isLoggedIn;
    if (!isLoggedIn) return;
    await ref
        .read(notificationsControllerProvider.notifier)
        .loadNotifications(force: true);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels < position.maxScrollExtent - 240) return;

    ref.read(notificationsControllerProvider.notifier).loadMore();
  }

  Future<void> _onRefresh() async {
    await ref
        .read(notificationsControllerProvider.notifier)
        .loadNotifications(refresh: true, force: true);
  }

  Future<void> _markAllRead() async {
    await ref.read(notificationsControllerProvider.notifier).markAllRead();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All notifications marked as read')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(
      authControllerProvider.select((state) => state.isLoggedIn),
    );
    final notificationsState = ref.watch(notificationsControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (isLoggedIn && notificationsState.unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: _buildBody(isLoggedIn, notificationsState),
    );
  }

  Widget _buildBody(bool isLoggedIn, NotificationsState state) {
    if (!isLoggedIn) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.notifications_none_rounded,
                size: 56,
                color: AppColors.textMuted.withValues(alpha: 0.7),
              ),
              const SizedBox(height: 16),
              const Text(
                'Sign in to view notifications',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () {
                  ref.read(authControllerProvider.notifier).openAuthModal();
                },
                child: const Text('Login / Register'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.loading && !state.hasLoaded) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: SkeletonOrderList(count: 8),
      );
    }

    if (state.error != null && state.items.isEmpty) {
      return RefreshableBody(
        onRefresh: _onRefresh,
        child: _ErrorState(
          message: state.error!,
          onRetry: _loadInitial,
        ),
      );
    }

    if (state.items.isEmpty) {
      return RefreshableBody(
        onRefresh: _onRefresh,
        child: const _EmptyState(),
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.separated(
        controller: _scrollController,
        physics: AppScrollConfig.listPhysics,
        padding: const EdgeInsets.only(top: 8, bottom: 24),
        itemCount: state.items.length + (state.loadingMore ? 1 : 0),
        separatorBuilder: (context, index) => const Divider(height: 1, indent: 72),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            );
          }

          final notification = state.items[index];
          return NotificationTile(
            notification: notification,
            onTap: () => NotificationNavigator.openFromAppNotification(
              context,
              ref,
              notification,
            ),
            onDismissed: () => ref
                .read(notificationsControllerProvider.notifier)
                .deleteNotification(notification.id),
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none_rounded,
              size: 64,
              color: AppColors.textMuted.withValues(alpha: 0.65),
            ),
            const SizedBox(height: 16),
            Text(
              'No notifications yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Order updates, offers, and payment alerts will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 56,
              color: Colors.red.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
