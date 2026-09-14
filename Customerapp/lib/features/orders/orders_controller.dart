import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../models/order.dart';
import '../../features/auth/auth_controller.dart';

class OrdersState {
  const OrdersState({
    this.orders = const [],
    this.loading = false,
    this.hasLoaded = false,
    this.error,
  });

  final List<Order> orders;
  final bool loading;
  final bool hasLoaded;
  final String? error;

  OrdersState copyWith({
    List<Order>? orders,
    bool? loading,
    bool? hasLoaded,
    String? error,
    bool clearError = false,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      loading: loading ?? this.loading,
      hasLoaded: hasLoaded ?? this.hasLoaded,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final ordersControllerProvider =
    NotifierProvider<OrdersController, OrdersState>(OrdersController.new);

class OrdersController extends Notifier<OrdersState> {
  @override
  OrdersState build() {
    ref.listen(authControllerProvider, (previous, next) {
      if (!next.isLoggedIn) {
        state = const OrdersState();
      } else if (previous?.isLoggedIn != true) {
        loadOrders();
      }
    });

    Future.microtask(() {
      if (ref.read(authControllerProvider).isLoggedIn && !state.hasLoaded) {
        loadOrders();
      }
    });

    return const OrdersState();
  }

  Future<void> loadOrders() async {
    final auth = ref.read(authControllerProvider);
    if (!auth.isLoggedIn) {
      state = const OrdersState();
      return;
    }

    state = state.copyWith(loading: true, clearError: true);
    try {
      final orders = await ref.read(apiServiceProvider).fetchMyOrders();
      state = OrdersState(orders: orders, loading: false, hasLoaded: true);
    } catch (_) {
      state = const OrdersState(
        orders: [],
        loading: false,
        hasLoaded: true,
        error: 'Failed to load orders',
      );
    }
  }

  void upsertOrder(Order order) {
    final index = state.orders.indexWhere((o) => o.id == order.id);
    if (index == -1) {
      state = state.copyWith(orders: [order, ...state.orders]);
      return;
    }
    final updated = List<Order>.from(state.orders);
    updated[index] = order;
    state = state.copyWith(orders: updated);
  }
}
