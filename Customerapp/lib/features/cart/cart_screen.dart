import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../../core/exceptions/api_exception.dart';
import '../../core/network/api_response_parser.dart';
import '../../core/providers/app_providers.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/department_utils.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/checkout/checkout_fulfillment_widgets.dart';
import '../../features/settings/store_settings_provider.dart';
import '../../features/wishlist/wishlist_controller.dart';
import '../../models/address.dart';
import '../../models/cart_item.dart';
import '../../models/coupon.dart';
import '../../models/product.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/select_delivery_location_sheet.dart';
import '../../widgets/cart/important_message_cards.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/layout/shell_bottom_insets.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _clearing = false;
  final _couponController = TextEditingController();
  AppliedCoupon? _appliedCoupon;
  bool _applyingCoupon = false;
  String _couponError = '';
  String _fulfillment = FulfillmentType.delivery;
  String? _preOrderSlot;
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
      ref.read(storeSettingsProvider.notifier).refresh();
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
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon(String code) async {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty || _applyingCoupon) return;

    final isLoggedIn = ref.read(authControllerProvider).isLoggedIn;
    if (!isLoggedIn) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to apply coupons'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() {
      _applyingCoupon = true;
      _couponError = '';
    });

    try {
      final items = ref.read(cartControllerProvider).items;
      final subtotal = calculateCartSummary(items).subtotal;
      final coupon = await ref.read(apiServiceProvider).validateCoupon(
            code: trimmed,
            subtotal: subtotal,
          );
      if (!mounted) return;
      setState(() {
        _appliedCoupon = coupon;
        _applyingCoupon = false;
        _couponError = '';
        _couponController.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Coupon "${coupon.code}" applied! Saved ₹${coupon.discountAmount.toStringAsFixed(0)}'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _applyingCoupon = false;
        _couponError = apiErrorMessage(e, fallback: 'Invalid coupon code');
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _couponError = '';
    });
  }

  Future<void> _loadCart() async {
    await ref.read(cartControllerProvider.notifier).loadCart();
  }

  Future<void> _confirmRemoveItem(CartItem item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove item?', style: TextStyle(fontWeight: FontWeight.bold)),
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
        title: const Text('Clear cart?', style: TextStyle(fontWeight: FontWeight.bold)),
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
          child: isLoggedIn
              ? _EmptyCart(onBrowse: () => context.go(RoutePaths.product))
              : _LoginPrompt(
                  onLogin: () => ref.read(authControllerProvider.notifier).openAuthModal(),
                ),
        ),
      );
    }

    final isPickup = _fulfillment == FulfillmentType.pickup;
    final summary = applyStorePickup(calculateCartSummary(items), pickup: isPickup);
    final storeSettings = ref.watch(storeSettingsProvider).value;
    final addresses = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final activeAddress = addresses.where((a) => a.isDefault).firstOrNull ?? addresses.firstOrNull;

    final groups = groupCartByDepartment(items);
    final hasPreOrder = groups.containsKey(Department.preorder);
    final hasNowItems = groups.keys.any((dept) => dept != Department.preorder);
    final slots = storeSettings?.activePreOrderSlots ?? const [];
    final slotChosen = _preOrderSlot != null && slots.any((s) => s.label == _preOrderSlot);
    final storeAsync = ref.watch(checkoutStoreProvider(checkoutStoreQuery(
      hasNowItems: hasNowItems,
      fulfillment: _fulfillment,
      address: activeAddress,
    )));
    final darkStore = storeAsync.value?.store;

    void proceedToPayment() {
      if (!isLoggedIn) {
        ref.read(authControllerProvider.notifier).openAuthModal();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in or register to select payment method and proceed to checkout'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }
      String? problem;
      if (hasPreOrder && !slotChosen) {
        problem = 'Choose a pre-order delivery slot first';
      } else if (isPickup && darkStore == null) {
        problem = 'No dark store serves this location for pickup';
      } else if (activeAddress == null) {
        problem = 'Add your address to continue';
      }
      if (problem != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(problem), behavior: SnackBarBehavior.floating),
        );
        return;
      }
      final query = <String, String>{
        'addressId': activeAddress!.id,
        'fulfillment': _fulfillment,
        if (hasPreOrder && _preOrderSlot != null) 'slot': _preOrderSlot!,
        if (_appliedCoupon != null) 'coupon': _appliedCoupon!.code,
      };
      context.push(Uri(path: RoutePaths.payment, queryParameters: query).toString());
    }

    final couponDiscount = _appliedCoupon != null
        ? _appliedCoupon!.discountAmount.clamp(0.0, summary.subtotal)
        : 0.0;

    Widget itemsCard(List<CartItem> groupItems) => _CartItemsCard(
          items: groupItems,
          onRemove: _confirmRemoveItem,
          onMoveToWishlist: _moveToWishlist,
          onDecrease: (item) async {
            final nextQty = getDecreasedCartQuantityForCartItem(item);
            if (nextQty <= 0) {
              await _confirmRemoveItem(item);
            } else {
              await ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
                    productId: item.id,
                    quantity: nextQty,
                    variantName: item.variantName,
                    colorName: item.colorName,
                  );
            }
          },
          onIncrease: (item) => ref.read(cartControllerProvider.notifier).updateCartLineQuantity(
                productId: item.id,
                quantity: item.quantity + item.quantityStep,
                variantName: item.variantName,
                colorName: item.colorName,
              ),
          onTapItem: (item) => context.push('/product/${item.id}'),
        );

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
              padding: EdgeInsets.only(
                left: 14,
                right: 14,
                top: 10,
                bottom: ShellBottomInsets.of(context) + 140, // Space for sticky bottom bar
              ),
              children: [
                // 1. Delivery Speed Banner
                _DeliverySpeedHeaderCard(
                  itemCount: summary.itemCount,
                  title: isPickup
                      ? 'Store pickup · no delivery fee'
                      : hasNowItems
                          ? 'Delivery in 10–20 minutes'
                          : 'Pre-order · delivered tomorrow',
                  note: hasPreOrder && hasNowItems
                      ? 'Split order: pre-order items at your slot, the rest right away'
                      : null,
                ),
                const SizedBox(height: 12),

                // 2. Delivery or store pickup + dark store contact
                _CartSection(
                  title: 'How do you want your order?',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FulfillmentChoice(
                        value: _fulfillment,
                        onChanged: (value) => setState(() => _fulfillment = value),
                      ),
                      if (isPickup) ...[
                        const SizedBox(height: 12),
                        DarkStoreContactCard(
                          store: darkStore,
                          pickup: true,
                          loading: storeAsync.isLoading && darkStore == null,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 3. Pre-order slot (required when the cart has pre-order items)
                if (hasPreOrder) ...[
                  _CartSection(
                    title: isPickup ? 'Pre-order pickup slot (tomorrow)' : 'Pre-order delivery slot (tomorrow)',
                    child: PreOrderSlotPicker(
                      slots: slots,
                      selected: _preOrderSlot,
                      onSelected: (label) => setState(() => _preOrderSlot = label),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // 4. Cart items, grouped by department
                for (final entry in groups.entries) ...[
                  DepartmentGroupHeader(
                    department: entry.key,
                    itemCount: entry.value.length,
                    etaText: departmentEtaText(
                      entry.key,
                      pickup: isPickup,
                      preOrderSlot: slotChosen ? _preOrderSlot : null,
                    ),
                  ),
                  itemsCard(entry.value),
                  const SizedBox(height: 12),
                ],

                // 5. Make this a Gift Banner
                const _GiftingCard(),
                const SizedBox(height: 16),

                // Important Store Notices
                if (storeSettings != null) ...[
                  ImportantMessageCards(settings: storeSettings),
                  const SizedBox(height: 12),
                ],

                // Apply Coupon Card
                _ApplyCouponCard(
                  controller: _couponController,
                  appliedCoupon: _appliedCoupon,
                  isApplying: _applyingCoupon,
                  errorMessage: _couponError,
                  onApply: _applyCoupon,
                  onRemove: _removeCoupon,
                  onViewAll: () async {
                    final code = await context.push<String>(RoutePaths.coupons);
                    if (code != null && code.isNotEmpty && mounted) {
                      _applyCoupon(code);
                    }
                  },
                ),
                const SizedBox(height: 12),

                // 6. Bill Details Card with Total Savings Highlight
                _BlinkitBillDetailsCard(
                  summary: summary,
                  items: items,
                  pickup: isPickup,
                  appliedCoupon: _appliedCoupon,
                  couponDiscount: couponDiscount,
                ),
                const SizedBox(height: 12),

                // 7. Add GSTIN Card
                const _AddGstinCard(),
                const SizedBox(height: 12),
              ],
            ),
          ),

          // Sticky Bottom Location & "Select Payment Method" Button Bar
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
              addressPrefix: isPickup
                  ? 'Pickup from ${darkStore?.storeName ?? 'dark store'} ·'
                  : 'Delivering to',
              onChangeAddress: () => showSelectDeliveryLocationBottomSheet(context, ref),
              onProceed: proceedToPayment,
              buttonText: hasPreOrder && !slotChosen ? 'Choose a pre-order slot' : 'Select Payment Method',
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
        style: GoogleFonts.plusJakartaSans(
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
        if (onClear != null)
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 22),
            onPressed: onClear,
            tooltip: 'Clear Cart',
          ),
      ],
    );
  }
}

// --- 1. Delivery Speed Header Card ---
class _DeliverySpeedHeaderCard extends StatelessWidget {
  const _DeliverySpeedHeaderCard({
    required this.itemCount,
    required this.title,
    this.note,
  });

  final int itemCount;
  final String title;
  final String? note;

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
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  note ?? 'Shipment of $itemCount item${itemCount > 1 ? 's' : ''}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF6B7280),
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

class _CartSection extends StatelessWidget {
  const _CartSection({required this.title, required this.child});

  final String title;
  final Widget child;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),
          child,
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
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w800,
                      fontSize: 14.5,
                      color: const Color(0xFF0F172A),
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
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 6),

                // Move to Wishlist Link
                GestureDetector(
                  onTap: onMoveToWishlist,
                  child: Text(
                    'Move to wishlist',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF16A34A),
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
              // Light Green Stepper Box [ − 1 + ]
              Container(
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFFDF5), // Light green tint
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF16A34A), width: 1.2),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: onDecrease,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(7)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        child: Text(
                          '−',
                          style: TextStyle(
                            color: Color(0xFF16A34A),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        '${item.quantity}',
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFF16A34A),
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: onIncrease,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(7)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        child: Text(
                          '+',
                          style: TextStyle(
                            color: Color(0xFF16A34A),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
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
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    formatInr(item.lineTotal),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Make this a gift!',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF92400E),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Get your items in a special gift bag for just ₹30',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFB45309),
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

// --- 5. Bill Details Card (Accurate Calculations) ---
class _BlinkitBillDetailsCard extends StatelessWidget {
  const _BlinkitBillDetailsCard({
    required this.summary,
    required this.items,
    this.pickup = false,
    this.appliedCoupon,
    this.couponDiscount = 0.0,
  });

  final CartSummary summary;
  final List<CartItem> items;
  final bool pickup;
  final AppliedCoupon? appliedCoupon;
  final double couponDiscount;

  @override
  Widget build(BuildContext context) {
    final originalTotalMRP = items.fold<double>(
      0,
      (sum, item) =>
          sum +
          (item.price > 0 ? item.price : item.discountedPrice) * item.quantity,
    );
    final productDiscount = items.fold<double>(
      0,
      (sum, item) {
        final original = item.price > 0 ? item.price : item.discountedPrice;
        final diff =
            (original - item.discountedPrice).clamp(0.0, double.infinity);
        return sum + diff * item.quantity;
      },
    );
    final totalSavings =
        productDiscount + (summary.shippingFree ? 30 : 0) + couponDiscount;
    final grandTotal =
        (summary.subtotal - couponDiscount).clamp(0.0, double.infinity) + 5;

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
                Text(
                  'Bill details',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 14),

                // Items total MRP
                Row(
                  children: [
                    const Icon(Icons.article_outlined,
                        size: 18, color: Color(0xFF4B5563)),
                    const SizedBox(width: 8),
                    Text(
                      'Items total',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF374151),
                      ),
                    ),
                    if (productDiscount > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDBEAFE),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Saved ₹${productDiscount.toStringAsFixed(0)}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF1D4ED8),
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    if (originalTotalMRP > summary.subtotal) ...[
                      Text(
                        formatInr(originalTotalMRP),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          color: Colors.grey,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      formatInr(summary.subtotal),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Delivery charge
                Row(
                  children: [
                    const Icon(Icons.delivery_dining_outlined,
                        size: 18, color: Color(0xFF4B5563)),
                    const SizedBox(width: 8),
                    Text(
                      pickup ? 'Store pickup' : 'Delivery charge',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF374151),
                      ),
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
                    Text(
                      'FREE',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Handling charge
                Row(
                  children: [
                    const Icon(Icons.shopping_bag_outlined,
                        size: 18, color: Color(0xFF4B5563)),
                    const SizedBox(width: 8),
                    Text(
                      'Handling charge',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF374151),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '₹5',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),

                if (couponDiscount > 0 && appliedCoupon != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.local_offer_outlined,
                          size: 18, color: Color(0xFF16A34A)),
                      const SizedBox(width: 8),
                      Text(
                        'Coupon (${appliedCoupon!.code})',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '-${formatInr(couponDiscount)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 14),

                const Divider(height: 1),
                const SizedBox(height: 14),

                // Grand total
                Row(
                  children: [
                    Text(
                      'Grand total',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      formatInr(grandTotal),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18.5,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Total Savings Highlight Card
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
                      Text(
                        'Your total savings',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1D4ED8),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        couponDiscount > 0
                            ? 'Includes ₹${couponDiscount.toStringAsFixed(0)} coupon discount & ₹30 free delivery'
                            : 'Includes ₹30 savings through free delivery',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF3B82F6),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${totalSavings.toStringAsFixed(0)}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF1D4ED8),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Add GSTIN',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Claim GST input credit up to 18% on your order',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF6B7280),
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

// --- 7. Apply Coupon Card ---
class _ApplyCouponCard extends StatelessWidget {
  const _ApplyCouponCard({
    required this.controller,
    required this.appliedCoupon,
    required this.isApplying,
    required this.errorMessage,
    required this.onApply,
    required this.onRemove,
    required this.onViewAll,
  });

  final TextEditingController controller;
  final AppliedCoupon? appliedCoupon;
  final bool isApplying;
  final String errorMessage;
  final ValueChanged<String> onApply;
  final VoidCallback onRemove;
  final VoidCallback onViewAll;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.local_offer_rounded,
                  color: Color(0xFF16A34A),
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Coupons & Offers',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1F2937),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: onViewAll,
                borderRadius: BorderRadius.circular(6),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View all',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: Color(0xFF16A34A),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (appliedCoupon != null)
            // Applied Coupon Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF86EFAC), width: 1.2),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: const BoxDecoration(
                      color: Color(0xFF16A34A),
                      shape: BoxShape.circle,
                    ),
                    child:
                        const Icon(Icons.check, size: 14, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              appliedCoupon!.code,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                                color: const Color(0xFF15803D),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 1.5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFBBF7D0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'APPLIED',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF166534),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'You save ₹${appliedCoupon!.discountAmount.toStringAsFixed(0)} on this order',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: onRemove,
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFFDC2626),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'Remove',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            // Input Box & Apply Button
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: TextField(
                      controller: controller,
                      textCapitalization: TextCapitalization.characters,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: const Color(0xFF1F2937),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter coupon code',
                        hintStyle: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0,
                          color: const Color(0xFF9CA3AF),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xFF16A34A),
                            width: 1.5,
                          ),
                        ),
                      ),
                      onSubmitted: onApply,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 44,
                  child: FilledButton(
                    onPressed:
                        isApplying ? null : () => onApply(controller.text),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                    ),
                    child: isApplying
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'APPLY',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                  ),
                ),
              ],
            ),
            if (errorMessage.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    size: 15,
                    color: Color(0xFFDC2626),
                  ),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      errorMessage,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFDC2626),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
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
    this.addressPrefix = 'Delivering to',
  });

  final String addressPrefix;
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
        bottom: ShellBottomInsets.of(context),
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
                      '$addressPrefix $addressLabel',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                    Text(
                      addressText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF6B7280),
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
                child: Text(
                  'Change',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Main Light Green Action Button
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
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
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

// =========================================================
// Select Payment Method Sheet / Modal
// =========================================================
class _SelectPaymentMethodSheet extends ConsumerStatefulWidget {
  const _SelectPaymentMethodSheet({
    required this.summary,
    required this.activeAddress,
    required this.cartItems,
  });

  final CartSummary summary;
  final Address? activeAddress;
  final List<CartItem> cartItems;

  @override
  ConsumerState<_SelectPaymentMethodSheet> createState() =>
      __SelectPaymentMethodSheetState();
}

class __SelectPaymentMethodSheetState
    extends ConsumerState<_SelectPaymentMethodSheet> {
  String _selectedPaymentMode = 'cod'; // 'cod' or 'online' or 'upi'
  bool _placingOrder = false;
  String _error = '';

  Future<void> _handlePlaceOrder() async {
    final address = widget.activeAddress;
    if (address == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a delivery address first.')),
      );
      return;
    }

    if (_selectedPaymentMode != 'cod') {
      Navigator.pop(context);
      context.push(
        '${RoutePaths.payment}?addressId=${address.id}',
      );
      return;
    }

    setState(() {
      _placingOrder = true;
      _error = '';
    });

    try {
      final itemsPayload = widget.cartItems
          .map(
            (item) => {
              'productId': item.id,
              'quantity': item.quantity,
              'variantName': item.variantName,
              'colorName': item.colorName,
              'name': item.name,
              'price': item.price,
              'discountedPrice': item.discountedPrice,
              'brandName': item.brandName,
              'image': item.productImages.isNotEmpty ? item.productImages.first : '',
            },
          )
          .toList();

      final api = ref.read(apiServiceProvider);
      final response = await api.placeOrder({
        'addressId': address.id,
        'paymentMethod': 'cod',
        'checkoutItems': itemsPayload,
        'checkoutMode': 'cart',
      });

      final body = ApiResponseParser.getData(response.data);
      if (body is! Map<String, dynamic>) {
        throw ApiException(
          ApiResponseParser.getMessage(response.data) ??
              'Failed to create order. Try again.',
        );
      }

      await ref.read(cartControllerProvider.notifier).clearCart();
      if (!mounted) return;

      Navigator.pop(context); // Close sheet

      // Show Order Placed Success Modal
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 54),
              ),
              const SizedBox(height: 16),
              Text(
                'Order Placed Successfully! 🎉',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your fresh items are being prepared for express delivery.',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(context);
                    context.go(RoutePaths.orders);
                  },
                  child: const Text('View My Orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _placingOrder = false;
        _error = apiErrorMessage(e, fallback: 'Failed to place order.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final grandTotal = widget.summary.subtotal + 5;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.paddingOf(context).bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Back button (←) + Bill Total Amount
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 24),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bill Total: ${formatInr(grandTotal)}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    'Includes all taxes & handling charges',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),

          Text(
            'Select Payment Method',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),

          // Option 1: UPI Payment
          _PaymentOptionTile(
            icon: Icons.qr_code_scanner_rounded,
            title: 'UPI Payment',
            subtitle: 'Google Pay, PhonePe, Paytm, BHIM UPI',
            isSelected: _selectedPaymentMode == 'upi',
            onTap: () => setState(() => _selectedPaymentMode = 'upi'),
          ),
          const SizedBox(height: 10),

          // Option 2: Cash on Delivery (COD)
          _PaymentOptionTile(
            icon: Icons.payments_outlined,
            title: 'Cash on Delivery (COD)',
            subtitle: 'Pay cash or UPI upon delivery at your door',
            isSelected: _selectedPaymentMode == 'cod',
            onTap: () => setState(() => _selectedPaymentMode = 'cod'),
          ),
          const SizedBox(height: 10),

          // Option 3: Online Payment / Cards
          _PaymentOptionTile(
            icon: Icons.credit_card_rounded,
            title: 'Cards / NetBanking / Razorpay',
            subtitle: 'Credit Card, Debit Card, NetBanking',
            isSelected: _selectedPaymentMode == 'online',
            onTap: () => setState(() => _selectedPaymentMode = 'online'),
          ),

          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13)),
          ],

          const SizedBox(height: 20),

          // CTA Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              onPressed: _placingOrder ? null : _handlePlaceOrder,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _placingOrder
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      'Choose Payment & Place Order · ${formatInr(grandTotal)}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
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

class _PaymentOptionTile extends StatelessWidget {
  const _PaymentOptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFFDF5) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
              size: 20,
            ),
          ],
        ),
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
            Text(
              'Sign in to view your cart',
              style: GoogleFonts.plusJakartaSans(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Items you add to your cart will appear here',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
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
            Text(
              'Your cart is empty',
              style: GoogleFonts.plusJakartaSans(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Explore our fresh products and add items to your cart',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
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
