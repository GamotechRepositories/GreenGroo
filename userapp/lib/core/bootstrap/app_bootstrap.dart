import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/orders/orders_controller.dart';
import '../../features/wishlist/wishlist_controller.dart';

/// Loads user-specific data after login or on app resume.
Future<void> bootstrapUserSession(WidgetRef ref) async {
  final auth = ref.read(authControllerProvider);
  if (!auth.isLoggedIn || auth.loading) return;

  ref.read(cartControllerProvider.notifier).loadCart();
  // Stagger non-critical fetches to reduce first-launch UI isolate spikes.
  await Future<void>.delayed(const Duration(milliseconds: 140));
  ref.read(wishlistControllerProvider.notifier).loadWishlist();
  await Future<void>.delayed(const Duration(milliseconds: 140));
  ref.read(ordersControllerProvider.notifier).loadOrders();
}
