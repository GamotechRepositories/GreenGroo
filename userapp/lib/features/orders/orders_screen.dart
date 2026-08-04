import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/orders/orders_controller.dart';
import '../../models/order.dart';
import '../../routes/route_paths.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import 'widgets/blinkit_order_card.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.orders, _scrollController);
      _loadOrders();
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.orders, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    await ref.read(ordersControllerProvider.notifier).loadOrders();
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final orders = ref.watch(ordersControllerProvider.select((s) => s.orders));
    final loading = ref.watch(ordersControllerProvider.select((s) => s.loading));
    final hasLoaded = ref.watch(ordersControllerProvider.select((s) => s.hasLoaded));
    final error = ref.watch(ordersControllerProvider.select((s) => s.error));

    ref.listen(authControllerProvider.select((s) => s.isLoggedIn), (previous, next) {
      if (next) _loadOrders();
    });

    return ColoredBox(
      color: AppColors.pageBackground,
      child: _buildBody(
        context,
        isLoggedIn: isLoggedIn,
        orders: orders,
        loading: loading,
        hasLoaded: hasLoaded,
        error: error,
      ),
    );
  }

  Widget _buildBody(
    BuildContext context, {
    required bool isLoggedIn,
    required List<Order> orders,
    required bool loading,
    required bool hasLoaded,
    required String? error,
  }) {
    if (!isLoggedIn) {
      return RefreshableBody(
        onRefresh: _loadOrders,
        child: _LoginPrompt(
          onLogin: () => ref.read(authControllerProvider.notifier).openAuthModal(),
        ),
      );
    }

    if (loading || !hasLoaded) {
      return const SkeletonOrderList();
    }

    if (error != null && orders.isEmpty) {
      return RefreshableBody(
        onRefresh: _loadOrders,
        child: _OrdersError(
          message: error,
          onRetry: _loadOrders,
        ),
      );
    }

    if (orders.isEmpty) {
      return RefreshableBody(
        onRefresh: _loadOrders,
        child: _EmptyOrders(onBrowse: () => context.go(RoutePaths.product)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: AppColors.primary,
      child: ListView.separated(
        controller: _scrollController,
        physics: AppScrollConfig.listPhysics,
        cacheExtent: AppScrollConfig.cacheExtent,
        padding: ShellBottomInsets.listPadding(context, left: 12, top: 12, right: 12),
        itemCount: orders.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          return RepaintBoundary(
            child: BlinkitOrderCard(order: orders[index]),
          );
        },
      ),
    );
  }
}

class _LoginPrompt extends StatelessWidget {
  const _LoginPrompt({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _StateCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_outline, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              const Text(
                'Login to view your orders',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
              const SizedBox(height: 8),
              const Text(
                'Track orders and reorder your favourite products in one tap.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onLogin,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.navSelected,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Login / Sign Up'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrdersError extends StatelessWidget {
  const _OrdersError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _StateCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_outlined, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(onPressed: onRetry, child: const Text('Retry')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _StateCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.receipt_long_outlined, color: AppColors.primary, size: 36),
              ),
              const SizedBox(height: 16),
              const Text(
                'No orders yet',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
              const SizedBox(height: 8),
              const Text(
                "You haven't placed any orders yet. Browse products and checkout to see them here.",
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onBrowse,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Browse Products'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StateCard extends StatelessWidget {
  const _StateCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: child,
    );
  }
}
