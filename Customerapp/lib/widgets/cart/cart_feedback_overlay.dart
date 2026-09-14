import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/cart/cart_controller.dart';
import '../../routes/app_router.dart';
import '../../routes/route_paths.dart';
import 'added_to_cart_toast.dart';
import 'fly_product_animator.dart';

/// Global cart toast + side effects for screens outside [AppShell].
class CartFeedbackOverlay extends ConsumerWidget {
  const CartFeedbackOverlay({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(cartControllerProvider, (previous, next) {
      if (next.navigateToCheckout) {
        ref.read(cartControllerProvider.notifier).clearCheckoutNavigation();
        ref.read(routerProvider).push(RoutePaths.checkout);
      }
      if (next.errorMessage != null &&
          next.errorMessage != previous?.errorMessage) {
        final message = next.errorMessage!;
        ref.read(cartControllerProvider.notifier).clearError();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    });

    return Stack(
      children: [
        child,
        const FlyProductAnimator(),
        const AddedToCartToast(),
      ],
    );
  }
}
