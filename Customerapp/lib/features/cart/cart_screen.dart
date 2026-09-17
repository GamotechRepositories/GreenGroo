import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/home/home_providers.dart';
import '../../features/settings/store_settings_provider.dart';
import '../../features/wishlist/wishlist_controller.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../routes/route_paths.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/cart/important_message_cards.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _clearing = false;
  int _selectedInstructionIndex = -1;
  int _selectedDonationAmount = 0;
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.cart, _scrollController);
      ref.read(cartControllerProvider.notifier).loadCart(silent: true);
      final addresses = ref.read(addressControllerProvider);
      if (addresses.addresses.isEmpty && !addresses.loading) {
        ref.read(addressControllerProvider.notifier).loadAddresses();
      }
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

  Future<void> _moveToWishlist(CartItem item) async {
    final product = Product(
      id: item.id,
      name: item.name,
      categories: const [],
      subcategory: '',
      brandName: item.brandName,
      price: item.price,
      discountedPrice: item.discountedPrice,
      discountedPercent: 0,
      stock: item.stock,
      productImages: item.productImages,
      pricingType: item.pricingType,
      bulkPricing: item.bulkPricing,
      variantType: item.variantType,
      variants: item.variants,
      minOrderQuantity: item.minOrderQuantity,
      stepByQuantity: item.stepByQuantity,
    );

    await ref.read(wishlistControllerProvider.notifier).toggleWishlist(product);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Saved "${item.name}" to Wishlist'),
        behavior: SnackBarBehavior.floating,
      ),
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
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final items = ref.watch(cartControllerProvider.select((s) => s.items));
    final loading = ref.watch(cartControllerProvider.select((s) => s.loading));

    if (!isLoggedIn) {
      return ColoredBox(
        color: const Color(0xFFF4F5F7),
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
        color: Color(0xFFF4F5F7),
        child: SkeletonCartPage(),
      );
    }

    if (items.isEmpty) {
      return ColoredBox(
        color: const Color(0xFFF4F5F7),
        child: RefreshableBody(
          onRefresh: _loadCart,
          child: _EmptyCart(onBrowse: () => context.go(RoutePaths.product)),
        ),
      );
    }

    final summary = calculateCartSummary(items);
    final storeSettings = ref.watch(storeSettingsProvider).value;
    final addresses = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final activeAddress = addresses.where((a) => a.isDefault).firstOrNull ?? addresses.firstOrNull;

    final recommendedProducts = ref.watch(homeDealsProvider).value ?? const [];

    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: _CartTopAppBar(
          title: 'Checkout',
          onClear: _clearing || loading ? null : _clearCart,
        ),
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            color: const Color(0xFF16A34A),
            onRefresh: _loadCart,
            child: ListView(
              controller: _scrollController,
              physics: AppScrollConfig.listPhysics,
              padding: const EdgeInsets.only(
                left: 14,
                right: 14,
                top: 10,
                bottom: 140, // Space for sticky bottom bar
              ),
              children: [
                // 1. Delivery Speed Banner
                _DeliverySpeedHeaderCard(
                  itemCount: summary.itemCount,
                  deliveryTime: '14 minutes',
                ),
                const SizedBox(height: 12),

                // 2. Cart Items Container Card
                _CartItemsCard(
                  items: items,
                  onRemove: _confirmRemoveItem,
                  onMoveToWishlist: _moveToWishlist,
                  onDecrease: (item) async {
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
                  onIncrease: (item) => ref
                      .read(cartControllerProvider.notifier)
                      .updateCartLineQuantity(
                        productId: item.id,
                        quantity: item.quantity + item.quantityStep,
                        variantName: item.variantName,
                        colorName: item.colorName,
                      ),
                  onTapItem: (item) => context.push('/product/${item.id}'),
                ),
                const SizedBox(height: 12),

                // 3. Make this a Gift Banner
                const _GiftingCard(),
                const SizedBox(height: 16),

                // 4. "You might also like" Recommendation Carousel
                if (recommendedProducts.isNotEmpty) ...[
                  _YouMightAlsoLikeSection(products: recommendedProducts),
                  const SizedBox(height: 16),
                ],

                // Important Store Notices
                if (storeSettings != null) ...[
                  ImportantMessageCards(settings: storeSettings),
                  const SizedBox(height: 12),
                ],

                // 5. Bill Details Card with Total Savings Highlight
                _BlinkitBillDetailsCard(summary: summary),
                const SizedBox(height: 12),

                // 6. Add GSTIN Card
                const _AddGstinCard(),
                const SizedBox(height: 12),

                // 7. Delivery Instructions Selector
                _DeliveryInstructionsCard(
                  selectedIndex: _selectedInstructionIndex,
                  onSelect: (index) {
                    setState(() {
                      _selectedInstructionIndex =
                          _selectedInstructionIndex == index ? -1 : index;
                    });
                  },
                ),
                const SizedBox(height: 12),

                // 8. Feeding India Cause Banner
                _FeedingIndiaBanner(
                  selectedDonation: _selectedDonationAmount,
                  onSelectDonation: (amt) {
                    setState(() {
                      _selectedDonationAmount =
                          _selectedDonationAmount == amt ? 0 : amt;
                    });
                  },
                ),
              ],
            ),
          ),

          // Sticky Bottom Location & Proceed Button Bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _BlinkitStickyBottomBar(
              addressLabel: activeAddress != null
                  ? (activeAddress.shopName.isNotEmpty
                      ? activeAddress.shopName
                      : (activeAddress.fullName.isNotEmpty ? activeAddress.fullName : 'Work'))
                  : 'Work',
              addressText: activeAddress != null
                  ? activeAddress.fullAddress
                  : 'Add or choose a delivery address',
              onChangeAddress: () => context.push(RoutePaths.checkout),
              onProceed: () => context.push(RoutePaths.checkout),
              buttonText: 'Select Payment Method',
            ),
          ),
        ],
      ),
    );
  }
}

// --- Top App Bar ---
class _CartTopAppBar extends StatelessWidget {
  const _CartTopAppBar({
    required this.title,
    required this.onClear,
  });

  final String title;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      leading: Navigator.canPop(context)
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            )
          : null,
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.black, size: 22),
          onPressed: () => context.push(RoutePaths.product),
        ),
        Container(
          margin: const EdgeInsets.only(right: 12),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.ios_share_rounded, size: 14, color: Colors.black),
              SizedBox(width: 4),
              Text(
                'Share',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// --- 1. Delivery Speed Header Card ---
class _DeliverySpeedHeaderCard extends StatelessWidget {
  const _DeliverySpeedHeaderCard({
    required this.itemCount,
    required this.deliveryTime,
  });

  final int itemCount;
  final String deliveryTime;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(
              color: Color(0xFFECFDF5),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.access_time_filled,
              color: Color(0xFF10B981),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Free delivery in $deliveryTime',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Shipment of $itemCount item${itemCount > 1 ? 's' : ''}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- 2. Cart Items White Card ---
class _CartItemsCard extends StatelessWidget {
  const _CartItemsCard({
    required this.items,
    required this.onRemove,
    required this.onMoveToWishlist,
    required this.onDecrease,
    required this.onIncrease,
    required this.onTapItem,
  });

  final List<CartItem> items;
  final ValueChanged<CartItem> onRemove;
  final ValueChanged<CartItem> onMoveToWishlist;
  final ValueChanged<CartItem> onDecrease;
  final ValueChanged<CartItem> onIncrease;
  final ValueChanged<CartItem> onTapItem;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          for (int i = 0; i < items.length; i++) ...[
            _BlinkitCartItemRow(
              item: items[i],
              onRemove: () => onRemove(items[i]),
              onMoveToWishlist: () => onMoveToWishlist(items[i]),
              onDecrease: () => onDecrease(items[i]),
              onIncrease: () => onIncrease(items[i]),
              onTap: () => onTapItem(items[i]),
            ),
            if (i < items.length - 1)
              Divider(height: 1, color: Colors.grey.shade100, indent: 14, endIndent: 14),
          ],
        ],
      ),
    );
  }
}

class _BlinkitCartItemRow extends StatelessWidget {
  const _BlinkitCartItemRow({
    required this.item,
    required this.onRemove,
    required this.onMoveToWishlist,
    required this.onDecrease,
    required this.onIncrease,
    required this.onTap,
  });

  final CartItem item;
  final VoidCallback onRemove;
  final VoidCallback onMoveToWishlist;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = item.productImages.isNotEmpty ? item.productImages.first : null;
    final hasDiscount = item.price > item.discountedPrice && item.discountedPrice > 0;

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Thumbnail
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: image != null
                    ? AppNetworkImage(
                        imageUrl: image,
                        fit: BoxFit.contain,
                        width: 76,
                        height: 76,
                        errorIcon: Icons.image_outlined,
                      )
                    : const Icon(Icons.image_outlined, color: Colors.grey),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Details Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: onTap,
                  child: Text(
                    item.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF1F2937),
                      height: 1.25,
                    ),
                  ),
                ),
                const SizedBox(height: 4),

                // Variant / Subtitle
                Text(
                  item.variantName.isNotEmpty
                      ? item.variantName
                      : (item.colorName.isNotEmpty ? item.colorName : 'Standard'),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 6),

                // Move to Wishlist Link
                GestureDetector(
                  onTap: onMoveToWishlist,
                  child: const Text(
                    'Move to wishlist',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF6B7280),
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Stepper & Price Column
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Solid Green Stepper Box [ - 4 + ]
              Container(
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFF16A34A),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: onDecrease,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        child: Text(
                          '−',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: onIncrease,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        child: Text(
                          '+',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Price Line
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (hasDiscount) ...[
                    Text(
                      formatInr(item.price * item.quantity),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    formatInr(item.lineTotal),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// --- 3. Make this a Gift Banner ---
class _GiftingCard extends StatelessWidget {
  const _GiftingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFEF3C7), Color(0xFFFFFBEB)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.8),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.card_giftcard,
              color: Color(0xFFD97706),
              size: 26,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Make this a gift!',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF92400E),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Get your items in a special gift bag for just ₹30',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF16A34A),
              side: const BorderSide(color: Color(0xFF16A34A), width: 1.2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            child: const Text(
              'Select',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

// --- 4. "You might also like" Carousel ---
class _YouMightAlsoLikeSection extends StatelessWidget {
  const _YouMightAlsoLikeSection({required this.products});

  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 2, bottom: 10),
          child: Text(
            'You might also like',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937),
            ),
          ),
        ),
        SizedBox(
          height: 220,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: products.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final product = products[index];
              return _RecommendationProductCard(product: product);
            },
          ),
        ),
      ],
    );
  }
}

class _RecommendationProductCard extends ConsumerWidget {
  const _RecommendationProductCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final image = product.productImages.isNotEmpty ? product.productImages.first : null;
    final hasDiscount = product.discountedPercent > 0;

    return Container(
      width: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image + Wishlist Icon
          Stack(
            children: [
              Container(
                height: 90,
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                  child: image != null
                      ? AppNetworkImage(
                          imageUrl: image,
                          fit: BoxFit.contain,
                          width: 140,
                          height: 90,
                        )
                      : const Icon(Icons.image_outlined, color: Colors.grey),
                ),
              ),
              Positioned(
                top: 6,
                right: 6,
                child: GestureDetector(
                  onTap: () => ref
                      .read(wishlistControllerProvider.notifier)
                      .toggleWishlist(product),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.favorite_border,
                      size: 14,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Weight + ADD Button Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '250 g',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    InkWell(
                      onTap: () => ref
                          .read(cartControllerProvider.notifier)
                          .addToCart(product, 1),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF16A34A), width: 1.2),
                        ),
                        child: const Text(
                          'ADD',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Price line
                Row(
                  children: [
                    Text(
                      formatInr(product.discountedPrice),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(width: 4),
                      Text(
                        formatInr(product.price),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.grey,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ],
                ),

                // Discount tag
                if (hasDiscount) ...[
                  const SizedBox(height: 2),
                  Text(
                    '${product.discountedPercent}% OFF on MRP',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ],

                const SizedBox(height: 4),
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- 5. Bill Details Card ---
class _BlinkitBillDetailsCard extends StatelessWidget {
  const _BlinkitBillDetailsCard({required this.summary});

  final CartSummary summary;

  @override
  Widget build(BuildContext context) {
    final originalTotal = summary.subtotal + 45;
    final totalSavings = 45 + (summary.shippingFree ? 30 : 0);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Bill details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 14),

                // Items total
                Row(
                  children: [
                    const Icon(Icons.article_outlined, size: 18, color: Color(0xFF4B5563)),
                    const SizedBox(width: 8),
                    const Text(
                      'Items total',
                      style: TextStyle(fontSize: 14, color: Color(0xFF374151)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBEAFE),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Saved ₹45',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatInr(originalTotal),
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      formatInr(summary.subtotal),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Delivery charge
                Row(
                  children: [
                    const Icon(Icons.delivery_dining_outlined, size: 18, color: Color(0xFF4B5563)),
                    const SizedBox(width: 8),
                    const Text(
                      'Delivery charge',
                      style: TextStyle(fontSize: 14, color: Color(0xFF374151)),
                    ),
                    const Spacer(),
                    const Text(
                      '₹30',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'FREE',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Handling charge
                const Row(
                  children: [
                    Icon(Icons.shopping_bag_outlined, size: 18, color: Color(0xFF4B5563)),
                    SizedBox(width: 8),
                    Text(
                      'Handling charge',
                      style: TextStyle(fontSize: 14, color: Color(0xFF374151)),
                    ),
                    Spacer(),
                    Text(
                      '₹5',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                const Divider(height: 1),
                const SizedBox(height: 14),

                // Grand total
                Row(
                  children: [
                    const Text(
                      'Grand total',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatInr(summary.subtotal + 5),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Total Savings Highlight Card (Light Blue Container)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Your total savings',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Includes ₹30 savings through free delivery',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹$totalSavings',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1D4ED8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- 6. Add GSTIN Card ---
class _AddGstinCard extends StatelessWidget {
  const _AddGstinCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFDBEAFE),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.percent_rounded,
              color: Color(0xFF2563EB),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Add GSTIN',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Claim GST input credit up to 18% on your order',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF)),
        ],
      ),
    );
  }
}

// --- 7. Delivery Instructions Selector ---
class _DeliveryInstructionsCard extends StatelessWidget {
  const _DeliveryInstructionsCard({
    required this.selectedIndex,
    required this.onSelect,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 2, bottom: 10),
          child: Text(
            'Delivery instructions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937),
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: _InstructionTile(
                icon: Icons.mic_none_outlined,
                title: 'Record',
                titleColor: const Color(0xFF16A34A),
                subtitle: 'Press here and hold',
                isSelected: selectedIndex == 0,
                onTap: () => onSelect(0),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _InstructionTile(
                icon: Icons.phone_disabled_outlined,
                title: 'Avoid calling',
                subtitle: 'No phone calls',
                isSelected: selectedIndex == 1,
                onTap: () => onSelect(1),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _InstructionTile(
                icon: Icons.notifications_off_outlined,
                title: "Don't ring bell",
                subtitle: 'Silent drop',
                isSelected: selectedIndex == 2,
                onTap: () => onSelect(2),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _InstructionTile extends StatelessWidget {
  const _InstructionTile({
    required this.icon,
    required this.title,
    this.titleColor,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final Color? titleColor;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 100,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFECFDF5) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, size: 20, color: titleColor ?? const Color(0xFF4B5563)),
                if (isSelected)
                  const Icon(Icons.check_box, size: 18, color: Color(0xFF16A34A))
                else
                  Icon(Icons.check_box_outline_blank, size: 18, color: Colors.grey.shade400),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: titleColor ?? const Color(0xFF1F2937),
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// --- 8. Feeding India Cause Banner ---
class _FeedingIndiaBanner extends StatelessWidget {
  const _FeedingIndiaBanner({
    required this.selectedDonation,
    required this.onSelectDonation,
  });

  final int selectedDonation;
  final ValueChanged<int> onSelectDonation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text(
                'Join us at feeding india',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF15803D),
                ),
              ),
              SizedBox(width: 4),
              Icon(Icons.arrow_forward_rounded, size: 16, color: Color(0xFF15803D)),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Together, we can fuel young minds to grow, learn, and thrive',
            style: TextStyle(fontSize: 12, color: Color(0xFF166534)),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _donationChip(5, '₹5'),
              const SizedBox(width: 8),
              _donationChip(10, '₹10'),
              const SizedBox(width: 8),
              _donationChip(15, '1 MEAL'),
              const SizedBox(width: 8),
              _donationChip(0, 'Custom'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _donationChip(int value, String label) {
    final isSelected = selectedDonation == value && value > 0;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onSelectDonation(value),
      selectedColor: const Color(0xFF16A34A),
      backgroundColor: Colors.white,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: isSelected ? Colors.white : const Color(0xFF15803D),
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF86EFAC),
        ),
      ),
    );
  }
}

// --- Sticky Bottom Bar ---
class _BlinkitStickyBottomBar extends StatelessWidget {
  const _BlinkitStickyBottomBar({
    required this.addressLabel,
    required this.addressText,
    required this.onChangeAddress,
    required this.onProceed,
    required this.buttonText,
  });

  final String addressLabel;
  final String addressText;
  final VoidCallback onChangeAddress;
  final VoidCallback onProceed;
  final String buttonText;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        top: 10,
        bottom: MediaQuery.paddingOf(context).bottom + 10,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Address Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_city_rounded,
                  color: Color(0xFFD97706),
                  size: 18,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Delivering to $addressLabel',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    Text(
                      addressText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onChangeAddress,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Change',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Main Green Action Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: onProceed,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                buttonText,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            const Text(
              'Sign in to view your cart',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Items you add to your cart will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onLogin,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Sign In'),
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
            const Icon(Icons.remove_shopping_cart_outlined, size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            const Text(
              'Your cart is empty',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Explore our fresh products and add items to your cart',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onBrowse,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Browse Products'),
            ),
          ],
        ),
      ),
    );
  }
}
