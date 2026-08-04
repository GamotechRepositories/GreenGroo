import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/settings/store_settings_provider.dart';
import '../../models/cart_item.dart';
import '../../routes/route_paths.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/cart/important_message_cards.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _clearing = false;
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.cart, _scrollController);
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.cart, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadCart() async {
    await ref.read(cartControllerProvider.notifier).loadCart();
  }

  Future<void> _confirmRemoveItem(CartItem item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove item?'),
        content: Text('Remove "${item.name}" from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    await ref.read(cartControllerProvider.notifier).removeFromCartLine(
          productId: item.id,
          variantName: item.variantName,
          colorName: item.colorName,
        );
  }

  Future<void> _clearCart() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear cart?'),
        content: const Text('Remove all items from your cart?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Clear')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _clearing = true);
    await ref.read(cartControllerProvider.notifier).clearCart();
    if (!mounted) return;
    setState(() => _clearing = false);

    final remaining = ref.read(cartControllerProvider).items;
    if (remaining.isNotEmpty) {
      final message = ref.read(cartControllerProvider).errorMessage ??
          'Could not clear all items. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final items = ref.watch(cartControllerProvider.select((s) => s.items));
    final loading = ref.watch(cartControllerProvider.select((s) => s.loading));

    if (!isLoggedIn) {
      return ColoredBox(
        color: AppColors.pageBackground,
        child: RefreshableBody(
          onRefresh: _loadCart,
          child: _LoginPrompt(
            onLogin: () => ref.read(authControllerProvider.notifier).openAuthModal(),
          ),
        ),
      );
    }

    if (loading && items.isEmpty) {
      return const ColoredBox(
        color: AppColors.pageBackground,
        child: SkeletonCartPage(),
      );
    }

    if (items.isEmpty) {
      return ColoredBox(
        color: AppColors.pageBackground,
        child: RefreshableBody(
          onRefresh: _loadCart,
          child: _EmptyCart(onBrowse: () => context.go(RoutePaths.product)),
        ),
      );
    }

    final summary = calculateCartSummary(items);
    final storeSettings = ref.watch(storeSettingsProvider).value;

    return ColoredBox(
      color: AppColors.pageBackground,
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadCart,
        child: ListView.builder(
          controller: _scrollController,
          physics: AppScrollConfig.listPhysics,
          cacheExtent: AppScrollConfig.cacheExtent,
          padding: ShellBottomInsets.listPadding(context, top: 8),
          itemCount: items.length + 3,
          itemBuilder: (context, index) {
            if (index == 0) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Cart (${summary.itemCount})',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                      ),
                    ),
                    TextButton(
                      onPressed: _clearing || loading ? null : _clearCart,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      child: Text(_clearing ? 'Clearing...' : 'Clear Cart'),
                    ),
                  ],
                ),
              );
            }
            if (index == 1) return const SizedBox(height: 4);
            if (index == items.length + 2) {
              return Column(
                children: [
                  const SizedBox(height: 8),
                  ImportantMessageCards(settings: storeSettings),
                  const SizedBox(height: 12),
                  _CouponsBanner(
                    onTap: () => context.push(RoutePaths.coupons),
                  ),
                  const SizedBox(height: 12),
                  _OrderSummary(
                    summary: summary,
                    onCheckout: () => context.push(RoutePaths.checkout),
                  ),
                ],
              );
            }
            if (index >= items.length + 2) return const SizedBox.shrink();

            final item = items[index - 2];
            final isLast = index - 2 == items.length - 1;
            return Column(
              children: [
                _CartItemRow(
                  item: item,
                  onRemove: () => _confirmRemoveItem(item),
                  onDecrease: () async {
                    final nextQty = getDecreasedCartQuantityForCartItem(item);
                    if (nextQty <= 0) {
                      await _confirmRemoveItem(item);
                    } else {
                      await ref
                          .read(cartControllerProvider.notifier)
                          .updateCartLineQuantity(
                            productId: item.id,
                            quantity: nextQty,
                            variantName: item.variantName,
                            colorName: item.colorName,
                          );
                    }
                  },
                  onIncrease: () => ref
                      .read(cartControllerProvider.notifier)
                      .updateCartLineQuantity(
                        productId: item.id,
                        quantity: item.quantity + item.quantityStep,
                        variantName: item.variantName,
                        colorName: item.colorName,
                      ),
                  onTap: () => context.push('/product/${item.id}'),
                ),
                if (!isLast)
                  Divider(
                    height: 1,
                    color: AppColors.borderLight.withValues(alpha: 0.85),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _CartItemRow extends StatelessWidget {
  const _CartItemRow({
    required this.item,
    required this.onRemove,
    required this.onDecrease,
    required this.onIncrease,
    required this.onTap,
  });

  final CartItem item;
  final VoidCallback onRemove;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = item.productImages.isNotEmpty ? item.productImages.first : null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onTap,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: ColoredBox(
                color: Colors.white,
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: image != null
                      ? AppNetworkImage(
                          imageUrl: image,
                          fit: BoxFit.contain,
                          width: 72,
                          height: 72,
                          cacheWidth: 144,
                          cacheHeight: 144,
                          errorIcon: Icons.image_outlined,
                        )
                      : const Icon(Icons.image_outlined, color: AppColors.textMuted),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: onTap,
                        child: Text(
                          item.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            height: 1.25,
                          ),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: onRemove,
                      child: const Padding(
                        padding: EdgeInsets.only(left: 4, bottom: 4),
                        child: Icon(Icons.close, size: 18, color: AppColors.textMuted),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (item.variantName.isNotEmpty)
                  Text(
                    'Variant: ${item.variantName}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                if (item.colorName.isNotEmpty)
                  Text(
                    'Color: ${item.colorName}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                if (item.variantName.isNotEmpty || item.colorName.isNotEmpty)
                  const SizedBox(height: 8),
                Row(
                  children: [
                    _QuantityControl(
                      quantity: item.quantity,
                      onDecrease: onDecrease,
                      onIncrease: onIncrease,
                    ),
                    const Spacer(),
                    Text(
                      formatInr(item.lineTotal),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuantityControl extends StatelessWidget {
  const _QuantityControl({
    required this.quantity,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.mobileSurface.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _qtyButton('−', onDecrease),
          Container(
            width: 34,
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
          _qtyButton('+', onIncrease),
        ],
      ),
    );
  }

  Widget _qtyButton(String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 30,
        height: 30,
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _CouponsBanner extends StatelessWidget {
  const _CouponsBanner({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
          ),
          child: const Row(
            children: [
              Icon(Icons.local_offer_outlined, size: 20, color: AppColors.primary),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'View available coupons',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, size: 20, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({
    required this.summary,
    required this.onCheckout,
  });

  final CartSummary summary;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Divider(height: 1),
        const SizedBox(height: 16),
        const Text(
          'Order Summary',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 14),
        _summaryRow('Subtotal', formatInr(summary.subtotal)),
        const SizedBox(height: 8),
        _summaryRow(
          'Shipping',
          summary.shippingFree ? 'FREE' : formatInr(summary.shipping),
          valueColor: summary.shippingFree ? Colors.green.shade700 : null,
        ),
        if (!summary.shippingFree) ...[
          const SizedBox(height: 6),
          Text(
            'Free delivery on orders above ${formatInr(AppConstants.freeDeliveryThreshold)}',
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
        const SizedBox(height: 6),
        const Text(
          'GST included in prices',
          style: TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        if (summary.savings > 0) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.check_circle_outline, size: 16, color: Colors.green.shade700),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'You save ${formatInr(summary.savings)} on this order',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.green.shade700,
                  ),
                ),
              ),
            ],
          ),
        ],
        const Divider(height: 28),
        _summaryRow(
          'Total',
          formatInr(summary.total),
          bold: true,
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: onCheckout,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: const Text('Place Order'),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => context.go(RoutePaths.product),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: AppColors.borderLight),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Continue Shopping'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: () => context.push(RoutePaths.support),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Support'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false, Color? valueColor}) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.bold : FontWeight.w500,
      fontSize: bold ? 16 : 14,
      color: bold ? AppColors.textPrimary : AppColors.textSecondary,
    );
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: style),
        Text(
          value,
          style: style.copyWith(color: valueColor ?? AppColors.textPrimary),
        ),
      ],
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Sign in to view your cart and place orders.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onLogin,
              child: const Text('Login / Sign Up'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            const Text(
              'Your cart is empty',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Browse products and add items to get started.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: onBrowse, child: const Text('Browse Products')),
          ],
        ),
      ),
    );
  }
}
