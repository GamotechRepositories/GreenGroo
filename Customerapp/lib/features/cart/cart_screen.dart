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

const _pageBg = Color(0xFFF3F5F9);
const _brand = Color(0xFF0C831F);
const _ink = Color(0xFF0F172A);
const _muted = Color(0xFF64748B);
const _ring = Color(0xB3E2E8F0);

BoxDecoration _cardDecoration() => BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: _ring),
    );

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: GoogleFonts.plusJakartaSans(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.9,
          color: _muted,
        ),
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  const _DashedDivider();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const dash = 4.0;
        const gap = 3.0;
        final count = (constraints.maxWidth / (dash + gap)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
            count,
            (_) => const SizedBox(
              width: dash,
              height: 1,
              child: ColoredBox(color: Color(0xFFE2E8F0)),
            ),
          ),
        );
      },
    );
  }
}

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
        color: _pageBg,
        child: SkeletonCartPage(),
      );
    }

    if (items.isEmpty) {
      return ColoredBox(
        color: _pageBg,
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
    final storeSettings = ref.watch(storeSettingsProvider).value;
    final summary = applyStorePickup(
      calculateCartSummary(items, settings: storeSettings),
      pickup: isPickup,
    );
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
    final productSavings = items.fold<double>(0, (sum, item) {
      final original = item.price > 0 ? item.price : item.discountedPrice;
      return sum + (original - item.discountedPrice).clamp(0.0, double.infinity) * item.quantity;
    });
    final displaySavings = productSavings + couponDiscount;
    final toPay = (summary.subtotal - couponDiscount).clamp(0.0, double.infinity) + 5;
    final lastGroup = groups.keys.isEmpty ? null : groups.keys.last;

    Widget itemsCard(List<CartItem> groupItems, {bool showAddMore = false}) => _CartItemsCard(
          items: groupItems,
          onAddMore: showAddMore ? () => context.go(RoutePaths.product) : null,
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
      backgroundColor: _pageBg,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: _CartTopAppBar(
          itemCount: summary.itemCount,
          savings: displaySavings,
          onClear: _clearing || loading ? null : _clearCart,
        ),
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            color: _brand,
            onRefresh: _loadCart,
            child: ListView(
              controller: _scrollController,
              physics: AppScrollConfig.listPhysics,
              padding: EdgeInsets.only(
                left: 12,
                right: 12,
                top: 12,
                bottom: ShellBottomInsets.of(context) + 150, // Space for sticky bottom bar
              ),
              children: [
                if (displaySavings > 0) ...[
                  _SavingsBanner(savings: displaySavings),
                  const SizedBox(height: 12),
                ],

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

                // Cart items, grouped by department
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
                  itemsCard(entry.value, showAddMore: entry.key == lastGroup),
                  const SizedBox(height: 12),
                ],

                // Delivery or store pickup + dark store contact
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

                // Pre-order slot (required when the cart has pre-order items)
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

                const _GiftingCard(),
                const SizedBox(height: 12),

                // Important Store Notices
                if (storeSettings != null) ...[
                  ImportantMessageCards(settings: storeSettings),
                  const SizedBox(height: 12),
                ],

                const _SectionLabel('Offers & benefits'),
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

                const _SectionLabel('Bill details'),
                _BlinkitBillDetailsCard(
                  summary: summary,
                  items: items,
                  pickup: isPickup,
                  appliedCoupon: _appliedCoupon,
                  couponDiscount: couponDiscount,
                ),
                const SizedBox(height: 12),

                const _AddGstinCard(),
                const SizedBox(height: 12),
              ],
            ),
          ),

          // Sticky bottom bar: address, total and checkout button
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
              buttonText: hasPreOrder && !slotChosen ? 'Choose a pre-order slot' : 'Proceed to checkout',
              total: toPay,
              savings: displaySavings,
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
    required this.itemCount,
    required this.savings,
    required this.onClear,
  });

  final int itemCount;
  final double savings;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.canPop(context);
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        border: const Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      padding: EdgeInsets.only(left: canPop ? 4 : 16, right: 4),
      child: Row(
        children: [
          if (canPop)
            IconButton(
              icon: const Icon(Icons.chevron_left_rounded, color: _ink, size: 28),
              onPressed: () => Navigator.pop(context),
            ),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Cart',
                  style: GoogleFonts.plusJakartaSans(
                    color: _ink,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                  ),
                ),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: '$itemCount ${itemCount == 1 ? 'item' : 'items'}'),
                      if (savings > 0) ...[
                        const TextSpan(text: ' · '),
                        TextSpan(
                          text: 'Saving ${formatInr(savings)}',
                          style: const TextStyle(color: _brand, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _muted),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.search_rounded, color: _ink, size: 22),
            onPressed: () => context.push(RoutePaths.product),
          ),
          TextButton(
            onPressed: onClear,
            style: TextButton.styleFrom(
              foregroundColor: _muted,
              disabledForegroundColor: _muted.withValues(alpha: 0.5),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              'Clear all',
              style: GoogleFonts.plusJakartaSans(fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _SavingsBanner extends StatelessWidget {
  const _SavingsBanner({required this.savings});

  final double savings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFECFDF5), Color(0xFFF0FDFA)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Row(
        children: [
          const Text('🎉', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: "You're saving "),
                  TextSpan(text: formatInr(savings), style: const TextStyle(color: _brand)),
                  const TextSpan(text: ' on this order'),
                ],
              ),
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF064E3B),
              ),
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: Color(0xFFECFDF5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.bolt_rounded, color: _brand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: _ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  note ?? 'Shipment of $itemCount item${itemCount > 1 ? 's' : ''}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: _muted,
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
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: _ink,
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
    this.onAddMore,
  });

  final List<CartItem> items;
  final ValueChanged<CartItem> onRemove;
  final ValueChanged<CartItem> onMoveToWishlist;
  final ValueChanged<CartItem> onDecrease;
  final ValueChanged<CartItem> onIncrease;
  final ValueChanged<CartItem> onTapItem;
  final VoidCallback? onAddMore;

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
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
              const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
          ],
          if (onAddMore != null) ...[
            const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
            InkWell(
              onTap: onAddMore,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const Icon(Icons.add_rounded, size: 18, color: _brand),
                    const SizedBox(width: 6),
                    Text(
                      'Add more items',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _brand,
                      ),
                    ),
                  ],
                ),
              ),
            ),
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
    final offPercent = hasDiscount ? ((item.price - item.discountedPrice) / item.price * 100).round() : 0;
    final meta = [item.variantName, item.colorName].where((s) => s.isNotEmpty).join(' · ');
    final removesOnDecrease = getDecreasedCartQuantityForCartItem(item) <= 0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 64,
              height: 64,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: image != null
                    ? AppNetworkImage(
                        imageUrl: image,
                        fit: BoxFit.contain,
                        width: 56,
                        height: 56,
                        errorIcon: Icons.image_outlined,
                      )
                    : const Icon(Icons.image_outlined, color: Color(0xFF94A3B8)),
              ),
            ),
          ),
          const SizedBox(width: 12),
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
                      fontWeight: FontWeight.w600,
                      fontSize: 13.5,
                      color: _ink,
                      height: 1.3,
                    ),
                  ),
                ),
                if (meta.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    meta,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _muted),
                  ),
                ],
                const SizedBox(height: 6),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 6,
                  children: [
                    Text(
                      formatInr(item.discountedPrice > 0 ? item.discountedPrice : item.price),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _ink,
                      ),
                    ),
                    if (hasDiscount) ...[
                      Text(
                        formatInr(item.price),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11.5,
                          color: const Color(0xFF94A3B8),
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      Text(
                        '$offPercent% off',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _brand,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: onMoveToWishlist,
                  child: Text(
                    'Move to wishlist',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: _muted,
                      decoration: TextDecoration.underline,
                      decorationColor: _muted,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                height: 32,
                width: 88,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: _brand,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: const [
                    BoxShadow(color: Color(0x14000000), blurRadius: 2, offset: Offset(0, 1)),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: onDecrease,
                          child: Center(
                            child: Icon(
                              removesOnDecrease ? Icons.delete_outline_rounded : Icons.remove_rounded,
                              size: 15,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      Text(
                        '${item.quantity}',
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: onIncrease,
                          child: const Center(
                            child: Icon(Icons.add_rounded, size: 15, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                formatInr(item.lineTotal),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: _ink,
                ),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: Color(0xFFFEF3C7),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.card_giftcard_rounded,
              color: Color(0xFFD97706),
              size: 19,
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
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Get your items in a special gift bag for just ₹30',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11.5,
                    color: _muted,
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
              foregroundColor: _brand,
              side: const BorderSide(color: _brand),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              minimumSize: const Size(0, 32),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: Text(
              'Select',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 12.5),
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

    final itemCount = summary.itemCount;
    final rowStyle = GoogleFonts.plusJakartaSans(fontSize: 13, color: const Color(0xFF334155));
    final valueStyle = GoogleFonts.plusJakartaSans(
      fontSize: 13,
      fontWeight: FontWeight.w600,
      color: _ink,
    );
    final strikeStyle = GoogleFonts.plusJakartaSans(
      fontSize: 12,
      color: const Color(0xFF94A3B8),
      decoration: TextDecoration.lineThrough,
    );
    final greenStyle = GoogleFonts.plusJakartaSans(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: _brand,
    );

    Widget billRow(String label, List<Widget> values, {TextStyle? labelStyle}) => Row(
          children: [
            Expanded(child: Text(label, style: labelStyle ?? rowStyle)),
            ...values,
          ],
        );

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                billRow(
                  'Item total ($itemCount ${itemCount == 1 ? 'item' : 'items'})',
                  [
                    if (originalTotalMRP > summary.subtotal) ...[
                      Text(formatInr(originalTotalMRP), style: strikeStyle),
                      const SizedBox(width: 6),
                    ],
                    Text(formatInr(summary.subtotal), style: valueStyle),
                  ],
                ),
                const SizedBox(height: 10),
                billRow(
                  pickup ? 'Store pickup' : 'Delivery fee',
                  [
                    Text('₹30', style: strikeStyle),
                    const SizedBox(width: 6),
                    Text('FREE', style: greenStyle),
                  ],
                ),
                const SizedBox(height: 10),
                billRow('Handling charge', [Text('₹5', style: valueStyle)]),
                if (couponDiscount > 0 && appliedCoupon != null) ...[
                  const SizedBox(height: 10),
                  billRow(
                    'Coupon (${appliedCoupon!.code})',
                    [Text('-${formatInr(couponDiscount)}', style: greenStyle)],
                    labelStyle: greenStyle.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
                const SizedBox(height: 12),
                const _DashedDivider(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'To pay',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _ink,
                        ),
                      ),
                    ),
                    Text(
                      formatInr(grandTotal),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: _ink,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFFECFDF5),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Your total savings',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF065F46),
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        couponDiscount > 0
                            ? 'Includes ₹${couponDiscount.toStringAsFixed(0)} coupon discount & ₹30 free delivery'
                            : 'Includes ₹30 savings through free delivery',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          color: const Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${totalSavings.toStringAsFixed(0)}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: _brand,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: _cardDecoration(),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.receipt_long_rounded,
              color: Color(0xFF2563EB),
              size: 18,
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
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: _ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Claim GST input credit up to 18% on your order',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11.5,
                    color: _muted,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
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
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Color(0xFFECFDF5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.local_offer_outlined,
                  color: _brand,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Apply coupon',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _ink,
                      ),
                    ),
                    Text(
                      'Browse offers available for you',
                      style: GoogleFonts.plusJakartaSans(fontSize: 11.5, color: _muted),
                    ),
                  ],
                ),
              ),
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
                        'View',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _brand,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 16,
                        color: _brand,
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
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: _brand,
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
                      backgroundColor: _brand,
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
    required this.total,
    required this.savings,
    this.addressPrefix = 'Delivering to',
  });

  final String addressPrefix;
  final String addressLabel;
  final String addressText;
  final VoidCallback onChangeAddress;
  final VoidCallback onProceed;
  final String buttonText;
  final double total;
  final double savings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 10,
        bottom: ShellBottomInsets.of(context) + 10,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 20,
            offset: Offset(0, -6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: onChangeAddress,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined, color: _brand, size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '$addressPrefix $addressLabel',
                            style: const TextStyle(fontWeight: FontWeight.w700, color: _ink),
                          ),
                          TextSpan(text: ' · $addressText'),
                        ],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(fontSize: 11.5, color: _muted),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Change',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: _brand,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatInr(total),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: _ink,
                      height: 1.2,
                    ),
                  ),
                  Text(
                    savings > 0 ? 'Saved ${formatInr(savings)}' : 'Total to pay',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: savings > 0 ? _brand : _muted,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: FilledButton(
                    onPressed: onProceed,
                    style: FilledButton.styleFrom(
                      backgroundColor: _brand,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text(
                            buttonText,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),
                        const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ],
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
