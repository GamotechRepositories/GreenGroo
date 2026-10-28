import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/utils/order_utils.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/orders/orders_controller.dart';
import '../../features/orders/tracking/order_tracking_panel.dart';
import '../../features/orders/tracking/preorder_tracking_view.dart';
import '../../models/order.dart';
import '../../routes/route_paths.dart';
import '../../widgets/common/skeleton_loaders.dart';

class OrderTrackingScreen extends ConsumerStatefulWidget {
  const OrderTrackingScreen({
    super.key,
    required this.orderId,
    this.selectedProductId,
  });

  final String orderId;
  final String? selectedProductId;

  @override
  ConsumerState<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> {
  Order? _order;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadOrder);
  }

  Future<void> _loadOrder({bool silent = false}) async {
    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = null;
        });
      }
      return;
    }

    if (!silent && _order == null) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final order = await ref.read(apiServiceProvider).fetchOrderById(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _loading = false;
      });
      ref.read(ordersControllerProvider.notifier).upsertOrder(order);
    } catch (_) {
      if (!mounted || (silent && _order != null)) return;
      setState(() {
        _loading = false;
        if (_order == null) {
          _error = 'Order not found';
        }
      });
    }
  }

  void _handleOrderAgain(Order order) {
    final productId = getPrimaryProductId(order);
    if (productId != null) {
      context.push('/product/$productId');
    } else {
      context.push('/orders/${order.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          title: const Text('Track Order'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Please login to track your order.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => ref.read(authControllerProvider.notifier).openAuthModal(),
                  child: const Text('Login / Sign Up'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_loading && _order == null) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: SkeletonOrderDetail(),
      );
    }

    if (_error != null && _order == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          title: const Text('Track Order'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Order not found or tracking unavailable.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go(RoutePaths.orders),
                  child: const Text('Back to Orders'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_order != null && _order!.isPreOrder) {
      return PreOrderTrackingView(
        order: _order!,
        selectedProductId: widget.selectedProductId,
        onStatusChanged: () => _loadOrder(silent: true),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F6),
      body: OrderTrackingPanel(
        key: ValueKey('tracking-${widget.orderId}'),
        orderId: widget.orderId,
        order: _order,
        onStatusChanged: () => _loadOrder(silent: true),
        onOrderAgain: _order != null ? () => _handleOrderAgain(_order!) : null,
        onInvoice: () => context.push('/orders/${widget.orderId}/invoice'),
      ),
    );
  }
}
