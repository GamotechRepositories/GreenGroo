import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../config/constants.dart';
import '../../config/theme.dart';
import '../../core/exceptions/api_exception.dart';
import '../../core/network/api_response_parser.dart';
import '../../core/providers/app_providers.dart';
import '../../core/utils/address_utils.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/razorpay_error_message.dart';
import '../../core/utils/payment_utils.dart';
import '../../widgets/common/app_network_image.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/settings/store_settings_provider.dart';
import '../../models/address.dart';
import '../../models/cart_item.dart';
import '../../models/coupon.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/address_form.dart';
import '../../widgets/common/minimum_order_warning.dart';
import '../../widgets/common/skeleton_loaders.dart';

const _maxOrderNoteLength = 200;

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key, this.initialCouponCode});

  final String? initialCouponCode;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final Razorpay _razorpay;

  String? _selectedAddressId;
  bool _showAddressForm = false;
  bool _showAddressPicker = false;
  bool _savingAddress = false;
  String _paymentPlan = PaymentPlan.advance;
  String _message = '';
  int _messageLength = 0;
  String _formError = '';
  String _orderError = '';
  bool _placingOrder = false;
  bool _orderPlaced = false;
  bool _showSuccessModal = false;
  String _orderSuccessNote = '';
  String _pendingPaymentMode = 'online';
  String? _attemptedOrderId;
  String? _lastCheckoutAttemptKey;

  final _couponController = TextEditingController();
  AppliedCoupon? _appliedCoupon;
  bool _applyingCoupon = false;
  String _couponError = '';

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleRazorpaySuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleRazorpayError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    Future.microtask(() {
      ref.read(storeSettingsProvider.notifier).refresh();
      final cart = ref.read(cartControllerProvider);
      if (cart.items.isEmpty && !cart.loading) {
        ref.read(cartControllerProvider.notifier).loadCart(silent: true);
      }
      final addresses = ref.read(addressControllerProvider);
      if (addresses.addresses.isEmpty && !addresses.loading) {
        ref.read(addressControllerProvider.notifier).loadAddresses();
      }
      final initialCode = widget.initialCouponCode?.trim() ?? '';
      if (initialCode.isNotEmpty) {
        _applyCoupon(initialCode);
      }
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon(String code) async {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty || _applyingCoupon) return;

    setState(() {
      _applyingCoupon = true;
      _couponError = '';
    });

    try {
      var items = ref.read(cartControllerProvider).items;
      if (items.isEmpty) {
        await ref.read(cartControllerProvider.notifier).loadCart(silent: true);
        items = ref.read(cartControllerProvider).items;
      }
      final subtotal = calculateCartSummary(items).subtotal;
      final coupon = await ref
          .read(apiServiceProvider)
          .validateCoupon(code: trimmed, subtotal: subtotal);
      if (!mounted) return;
      setState(() {
        _appliedCoupon = coupon;
        _applyingCoupon = false;
        _couponError = '';
        _couponController.clear();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _applyingCoupon = false;
        _couponError = apiErrorMessage(e, fallback: 'Failed to apply coupon.');
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _couponError = '';
    });
  }

  void _syncSelectedAddress(List<Address> addresses) {
    if (addresses.isEmpty) {
      _selectedAddressId = null;
      return;
    }
    if (_selectedAddressId != null &&
        addresses.any((addr) => addr.id == _selectedAddressId)) {
      return;
    }
    final defaultAddr = addresses.where((a) => a.isDefault).firstOrNull ?? addresses.first;
    _selectedAddressId = defaultAddr.id;
  }

  List<Map<String, dynamic>> _checkoutItemsPayload(List<CartItem> items) {
    return items
        .map(
          (item) => {
            'productId': item.id,
            'quantity': item.quantity,
            'variantName': item.variantName,
            'colorName': item.colorName,
          },
        )
        .toList();
  }

  Future<String?> _syncCheckoutAttempt(List<CartItem> items, {bool force = false}) async {
    if (_orderPlaced || items.isEmpty) return _attemptedOrderId;

    final key =
        '${_selectedAddressId ?? ''}|$_paymentPlan|${_appliedCoupon?.code ?? ''}|${items.map((i) => '${i.id}:${i.quantity}').join(',')}';
    if (!force && key == _lastCheckoutAttemptKey && _attemptedOrderId != null) {
      return _attemptedOrderId;
    }

    try {
      final response = await ref.read(apiServiceProvider).createCheckoutAttempt({
        if (_selectedAddressId != null) 'addressId': _selectedAddressId,
        'paymentMethod': PaymentUtils.checkoutPaymentMethod(_paymentPlan),
        'checkoutItems': _checkoutItemsPayload(items),
        'checkoutMode': 'cart',
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
      });
      final order = ApiResponseParser.getData(response.data) as Map<String, dynamic>;
      final orderId = order['_id']?.toString();
      if (orderId != null && orderId.isNotEmpty) {
        _attemptedOrderId = orderId;
        _lastCheckoutAttemptKey = key;
        return orderId;
      }
    } catch (_) {
      // Caller can retry with force before payment.
    }

    return _attemptedOrderId;
  }

  Future<void> _handleSaveAddress(Map<String, String> form) async {
    setState(() {
      _savingAddress = true;
      _formError = '';
    });

    final error = await ref.read(addressControllerProvider.notifier).saveAddress(
          form,
          makeDefault: ref.read(addressControllerProvider).addresses.isEmpty,
        );

    if (!mounted) return;

    if (error == null) {
      final addresses = ref.read(addressControllerProvider).addresses;
      final newest = addresses.isNotEmpty ? addresses.first : null;
      setState(() {
        _savingAddress = false;
        _showAddressForm = false;
        _showAddressPicker = false;
        _selectedAddressId = newest?.id;
      });
    } else {
      setState(() {
        _savingAddress = false;
        _formError = error;
      });
    }
  }

  Map<String, String> _addressInitialValues() {
    final user = ref.read(authControllerProvider).user;
    return {
      'fullName': user?.name ?? '',
      'number': user?.phone ?? '',
      'email': user?.email ?? '',
      'shopNo': '',
      'shopName': '',
      'fullAddress': '',
      'landmark': '',
      'city': '',
      'state': '',
      'pincode': '',
    };
  }

  Future<void> _placeOrder() async {
    if (_selectedAddressId == null || _placingOrder) return;

    setState(() => _orderError = '');

    await ref.read(cartControllerProvider.notifier).loadCart(silent: true);
    if (!mounted) return;

    final cartItems = ref.read(cartControllerProvider).items;
    if (cartItems.isEmpty) {
      setState(() => _orderError = 'Your cart is empty. Please add items before checkout.');
      if (mounted) context.go(RoutePaths.cart);
      return;
    }

    final summary = calculateCartSummary(cartItems);
    final storeSettings = ref.read(storeSettingsProvider).value;
    final minimumOrderValue = storeSettings?.minimumOrderValue ?? 3000;
    if (!meetsMinimumOrder(summary.subtotal, minimumOrderValue)) return;

    await _syncCheckoutAttempt(cartItems, force: true);
    if (!mounted) return;

    await _startRazorpayPayment();
  }

  String get _apiPaymentMode => _paymentPlan;

  Future<void> _startRazorpayPayment() async {
    if (_selectedAddressId == null) return;

    setState(() {
      _placingOrder = true;
      _orderError = '';
    });

    try {
      final cartItems = ref.read(cartControllerProvider).items;
      final response = await ref.read(apiServiceProvider).createRazorpayOrder({
        'addressId': _selectedAddressId,
        'paymentMode': _apiPaymentMode,
        'checkoutItems': _checkoutItemsPayload(cartItems),
        'checkoutMode': 'cart',
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
      });
      final body = ApiResponseParser.getData(response.data);
      if (body is! Map<String, dynamic>) {
        throw ApiException(
          ApiResponseParser.getMessage(response.data) ??
              'Invalid payment response from server.',
        );
      }

      final attemptedId = body['attemptedOrderId']?.toString();
      if (attemptedId != null && attemptedId.isNotEmpty) {
        _attemptedOrderId = attemptedId;
      }

      final keyId = body['keyId']?.toString() ?? '';
      final razorpayOrderId = body['razorpayOrderId']?.toString() ?? '';
      final amountRaw = body['amount'];
      final amountPaise = amountRaw is int
          ? amountRaw
          : int.tryParse(amountRaw?.toString() ?? '');

      if (keyId.isEmpty || razorpayOrderId.isEmpty) {
        throw ApiException(
          ApiResponseParser.getMessage(response.data) ??
              'Online payment is not configured. Please contact support.',
        );
      }
      if (amountPaise == null || amountPaise <= 0) {
        throw ApiException('Invalid payment amount.');
      }

      _pendingPaymentMode = _apiPaymentMode;
      setState(() => _placingOrder = false);

      final user = ref.read(authControllerProvider).user!;
      final options = <String, dynamic>{
        'key': keyId,
        'amount': amountPaise,
        'order_id': razorpayOrderId,
        'name': 'Bulk Mobile Mart',
        'description': _paymentPlan == PaymentPlan.advance
            ? '10% advance payment via Razorpay'
            : 'Full order payment via Razorpay',
        'prefill': {
          'contact': user.phone,
          'email': user.email,
          'name': user.name,
        },
      };
      _razorpay.open(options);
    } catch (e) {
      final message = apiErrorMessage(
        e,
        fallback: 'Failed to start payment. Please try again.',
      );
      setState(() {
        _placingOrder = false;
        _orderError = message;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    }
  }

  Future<void> _handleRazorpaySuccess(PaymentSuccessResponse response) async {
    setState(() {
      _placingOrder = true;
      _orderError = '';
    });

    try {
      final cartItems = ref.read(cartControllerProvider).items;
      await ref.read(apiServiceProvider).verifyRazorpayPayment({
        'addressId': _selectedAddressId,
        'paymentMode': _pendingPaymentMode,
        'customerMessage': _message.trim(),
        'checkoutItems': _checkoutItemsPayload(cartItems),
        'checkoutMode': 'cart',
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
        if (_attemptedOrderId != null) 'attemptedOrderId': _attemptedOrderId,
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
      });
      await _completeOrderSuccess(
        _pendingPaymentMode == PaymentPlan.advance
            ? 'Order confirmed. 10% paid via Razorpay. Pay the balance on delivery.'
            : null,
      );
    } catch (e) {
      setState(() {
        _orderError = apiErrorMessage(
          e,
          fallback: 'Payment verified but order failed. Contact support.',
        );
        _placingOrder = false;
      });
    }
  }

  void _handleRazorpayError(PaymentFailureResponse response) {
    final message = razorpayErrorMessage(response);
    setState(() {
      _placingOrder = false;
      _orderError = message;
    });
    final cartItems = ref.read(cartControllerProvider).items;
    if (cartItems.isNotEmpty) {
      _syncCheckoutAttempt(cartItems, force: true);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // no-op
  }

  Future<void> _completeOrderSuccess([String? note]) async {
    setState(() {
      _orderPlaced = true;
      _placingOrder = false;
      _orderSuccessNote =
          note ?? 'Your order has been placed and will be delivered soon.';
      _showSuccessModal = true;
    });
    await ref.read(cartControllerProvider.notifier).loadCart();
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final cartItems = ref.watch(cartControllerProvider.select((s) => s.items));
    final cartLoading = ref.watch(cartControllerProvider.select((s) => s.loading));
    final addressList = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final addressesLoading =
        ref.watch(addressControllerProvider.select((s) => s.loading));

    if (!isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Please login to proceed with checkout.',
                  textAlign: TextAlign.center,
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

    _syncSelectedAddress(addressList);
    final baseSummary = calculateCartSummary(cartItems);
    final couponDiscount = (_appliedCoupon?.discountAmount ?? 0)
        .clamp(0.0, baseSummary.subtotal)
        .toDouble();
    final summary = applyCouponDiscount(baseSummary, couponDiscount);
    final storeSettings = ref.watch(storeSettingsProvider).value;
    final minimumOrderValue = storeSettings?.minimumOrderValue ?? 3000;
    final minimumOrderMet = meetsMinimumOrder(summary.subtotal, minimumOrderValue);
    final orderShortfall =
        minimumOrderShortfall(summary.subtotal, minimumOrderValue);
    final selectedAddress = _selectedAddressId == null
        ? null
        : addressList
            .where((a) => a.id == _selectedAddressId)
            .cast<Address?>()
            .firstOrNull;

    if (!cartLoading && cartItems.isEmpty && !_orderPlaced) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go(RoutePaths.cart);
      });
    }

    if (!cartLoading && cartItems.isNotEmpty && !_orderPlaced) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _syncCheckoutAttempt(cartItems);
      });
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go(RoutePaths.cart),
        ),
        title: const Text('Checkout'),
      ),
      body: Stack(
        children: [
          cartLoading && cartItems.isEmpty
              ? const SkeletonCheckoutPage()
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                  children: [
                    if (!minimumOrderMet) ...[
                      MinimumOrderWarning(
                        subtotal: summary.subtotal,
                        minimumOrderValue: minimumOrderValue,
                        onAddMore: () => context.go(RoutePaths.product),
                      ),
                      const SizedBox(height: 12),
                    ],
                    _StepSection(
                      title: 'Payment via Razorpay',
                      child: RadioGroup<String>(
                        groupValue: _paymentPlan,
                        onChanged: (value) {
                          if (value != null) setState(() => _paymentPlan = value);
                        },
                        child: Column(
                          children: [
                            _PaymentPlanOption(
                              value: PaymentPlan.advance,
                              selected: _paymentPlan == PaymentPlan.advance,
                              title: 'Pay 10% now · balance on delivery',
                              subtitle:
                                  'Pay ${formatInr(PaymentUtils.advanceAmount(summary.total), withDecimals: true)} now · ${formatInr(summary.total - PaymentUtils.advanceAmount(summary.total), withDecimals: true)} on delivery',
                              onTap: () => setState(() => _paymentPlan = PaymentPlan.advance),
                            ),
                            const SizedBox(height: 10),
                            _PaymentPlanOption(
                              value: PaymentPlan.full,
                              selected: _paymentPlan == PaymentPlan.full,
                              title: 'Pay 100% now',
                              subtitle:
                                  'Complete payment of ${formatInr(summary.total, withDecimals: true)} via Razorpay',
                              onTap: () => setState(() => _paymentPlan = PaymentPlan.full),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _StepSection(
                      title: 'Delivery Details',
                      child: addressesLoading
                          ? const SkeletonAddressList()
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (addressList.isEmpty && !_showAddressForm) ...[
                                  const Text(
                                    'No saved address yet. Add one to continue.',
                                    style: TextStyle(color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 12),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: FilledButton.icon(
                                      onPressed: () => setState(() => _showAddressForm = true),
                                      icon: const Icon(Icons.add, size: 20),
                                      label: const Text('Add delivery address'),
                                      style: FilledButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 12,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                                if (selectedAddress != null &&
                                    !_showAddressForm &&
                                    !_showAddressPicker)
                                  _SelectedAddressCard(
                                    address: selectedAddress,
                                    showChange: addressList.length > 1,
                                    onChange: () => setState(() => _showAddressPicker = true),
                                  ),
                                if (_showAddressPicker && !_showAddressForm)
                                  _AddressPicker(
                                    addresses: addressList,
                                    selectedId: _selectedAddressId,
                                    onSelect: (id) => setState(() {
                                      _selectedAddressId = id;
                                      _showAddressPicker = false;
                                    }),
                                    onAddNew: () => setState(() {
                                      _showAddressForm = true;
                                      _showAddressPicker = false;
                                    }),
                                  ),
                                if (_showAddressForm) ...[
                                  AddressForm(
                                    plain: true,
                                    initial: _addressInitialValues(),
                                    submitting: _savingAddress,
                                    onCancel: () => setState(() {
                                      _showAddressForm = false;
                                      _formError = '';
                                    }),
                                    onSubmit: _handleSaveAddress,
                                  ),
                                  if (_formError.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      _formError,
                                      style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                                    ),
                                  ],
                                ] else if (addressList.isNotEmpty &&
                                    selectedAddress == null &&
                                    !_showAddressPicker)
                                  TextButton(
                                    onPressed: () => setState(() => _showAddressForm = true),
                                    child: const Text('+ Add Address'),
                                  ),
                                if (selectedAddress != null &&
                                    !_showAddressForm &&
                                    !_showAddressPicker)
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: TextButton(
                                      onPressed: () => setState(() => _showAddressForm = true),
                                      child: const Text('+ Add new address'),
                                    ),
                                  ),
                              ],
                            ),
                    ),
                    const SizedBox(height: 12),
                    _StepSection(
                      title: 'Order Note (optional)',
                      child: Stack(
                        children: [
                          TextField(
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText: 'Any special instructions for your order...',
                              filled: true,
                              fillColor: Colors.white,
                              counterText: '$_messageLength/$_maxOrderNoteLength',
                            ),
                            onChanged: (value) {
                              if (value.length > _maxOrderNoteLength) return;
                              setState(() {
                                _message = value;
                                _messageLength = value.length;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    _StepSection(
                      title: 'Coupon',
                      child: _buildCouponSection(),
                    ),
                    const SizedBox(height: 12),
                    _StepSection(
                      title: 'Order Summary',
                      child: Column(
                        children: [
                          ...cartItems.map(
                            (item) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _CheckoutLineItem(item: item),
                            ),
                          ),
                          const Divider(height: 24),
                          _summaryRow('Items', '${summary.itemCount}'),
                          const SizedBox(height: 8),
                          _summaryRow('Subtotal', formatInr(summary.subtotal)),
                          if (!minimumOrderMet) ...[
                            const SizedBox(height: 10),
                            MinimumOrderWarning(
                              subtotal: summary.subtotal,
                              minimumOrderValue: minimumOrderValue,
                              compact: true,
                            ),
                          ],
                          const SizedBox(height: 8),
                          _summaryRow(
                            'Shipping',
                            summary.shippingFree ? 'FREE' : formatInr(summary.shipping),
                          ),
                          if (couponDiscount > 0) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Coupon discount (${_appliedCoupon!.code})',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                    color: Colors.green.shade700,
                                  ),
                                ),
                                Text(
                                  '-${formatInr(couponDiscount)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.green.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 8),
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'GST included in prices',
                              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                            ),
                          ),
                          const Divider(height: 24),
                          _summaryRow(
                            'Pay now (Razorpay)',
                            formatInr(
                              PaymentUtils.payableAmount(summary.total, _paymentPlan),
                              withDecimals: true,
                            ),
                          ),
                          if (_paymentPlan == PaymentPlan.advance) ...[
                            const SizedBox(height: 8),
                            _summaryRow(
                              'Balance on delivery',
                              formatInr(
                                summary.total - PaymentUtils.advanceAmount(summary.total),
                                withDecimals: true,
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          _summaryRow('Total', formatInr(summary.total), bold: true),
                          if (summary.savings > 0) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.check_circle_outline,
                                      size: 18, color: Colors.green.shade700),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'You will save ${formatInr(summary.savings)} on this order',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.green.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          if (!summary.shippingFree) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Free delivery on orders above ${formatInr(AppConstants.freeDeliveryThreshold)}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (_orderError.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        _orderError,
                        style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                      ),
                    ],
                  ],
                ),
          if (_placingOrder)
            Container(
              color: Colors.black38,
              child: const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: AppColors.primary),
                        SizedBox(height: 16),
                        Text('Processing payment...', style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (_showSuccessModal)
            Container(
              color: Colors.black38,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(24),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: Colors.green.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.check, color: Colors.green.shade700, size: 36),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Order Confirmed',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _orderSuccessNote,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: () {
                              setState(() => _showSuccessModal = false);
                              context.go(RoutePaths.orders);
                            },
                            child: const Text('View My Orders'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: cartItems.isEmpty
          ? null
          : _CheckoutPayBar(
              summary: summary,
              paymentPlan: _paymentPlan,
              minimumOrderMet: minimumOrderMet,
              minimumOrderValue: minimumOrderValue,
              orderShortfall: orderShortfall,
              hasAddress: _selectedAddressId != null,
              placingOrder: _placingOrder,
              onPay: _placeOrder,
            ),
    );
  }

  Widget _buildCouponSection() {
    final applied = _appliedCoupon;

    if (applied != null) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.green.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.local_offer, size: 20, color: Colors.green.shade700),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    applied.code,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      letterSpacing: 0.5,
                      color: Colors.green.shade800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'You save ${formatInr(applied.discountAmount)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green.shade700,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: _removeCoupon,
              style: TextButton.styleFrom(
                foregroundColor: Colors.red.shade700,
                visualDensity: VisualDensity.compact,
              ),
              child: const Text('Remove'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _couponController,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  hintText: 'Enter coupon code',
                  isDense: true,
                  filled: true,
                  fillColor: Colors.white,
                ),
                onSubmitted: _applyCoupon,
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: _applyingCoupon
                  ? null
                  : () => _applyCoupon(_couponController.text),
              child: _applyingCoupon
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Apply'),
            ),
          ],
        ),
        if (_couponError.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            _couponError,
            style: TextStyle(color: Colors.red.shade700, fontSize: 13),
          ),
        ],
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () async {
              final code = await context.push<String>(RoutePaths.coupons);
              if (code != null && code.isNotEmpty && mounted) {
                _applyCoupon(code);
              }
            },
            icon: const Icon(Icons.local_offer_outlined, size: 16),
            label: const Text('View all coupons'),
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
            ),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: bold ? FontWeight.bold : FontWeight.w500,
            color: bold ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w500),
        ),
      ],
    );
  }
}

class _CheckoutPayBar extends StatelessWidget {
  const _CheckoutPayBar({
    required this.summary,
    required this.paymentPlan,
    required this.minimumOrderMet,
    required this.minimumOrderValue,
    required this.orderShortfall,
    required this.hasAddress,
    required this.placingOrder,
    required this.onPay,
  });

  final CartSummary summary;
  final String paymentPlan;
  final bool minimumOrderMet;
  final double minimumOrderValue;
  final double orderShortfall;
  final bool hasAddress;
  final bool placingOrder;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    final payableNow = PaymentUtils.payableAmount(summary.total, paymentPlan);
    final balanceOnDelivery = summary.total - payableNow;
    final readyToPay = hasAddress && minimumOrderMet;
    final canPay = readyToPay && !placingOrder;

    final buttonLabel = placingOrder
        ? 'Please wait...'
        : 'Pay ${formatInr(payableNow, withDecimals: true)} with Razorpay';

    String? helperText;
    if (!minimumOrderMet) {
      helperText =
          'Add ${formatInr(orderShortfall)} more to reach minimum order of ${formatInr(minimumOrderValue)}';
    } else if (!hasAddress) {
      helperText = 'Add a delivery address to continue';
    }

    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.borderLight)),
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 12,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (minimumOrderMet) ...[
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Pay now (Razorpay)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Text(
                      formatInr(payableNow, withDecimals: true),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                if (paymentPlan == PaymentPlan.advance) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Balance on delivery',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                      Text(
                        formatInr(balanceOnDelivery, withDecimals: true),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
              ],
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: canPay ? onPay : null,
                  style: FilledButton.styleFrom(
                    disabledBackgroundColor:
                        placingOrder && readyToPay ? AppColors.primary : AppColors.borderLight,
                    disabledForegroundColor:
                        placingOrder && readyToPay ? Colors.white : AppColors.textMuted,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: readyToPay ? 1 : 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (placingOrder)
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      else
                        const Icon(Icons.lock_outline_rounded, size: 18),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          buttonLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (helperText != null) ...[
                const SizedBox(height: 8),
                Text(
                  helperText,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: !minimumOrderMet
                        ? const Color(0xFF9A3412)
                        : AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CheckoutLineItem extends StatelessWidget {
  const _CheckoutLineItem({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final image = item.productImages.isNotEmpty ? item.productImages.first : null;

    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: image != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: AppNetworkImage(
                    imageUrl: image,
                    fit: BoxFit.contain,
                    width: 56,
                    height: 56,
                    cacheWidth: 112,
                    cacheHeight: 112,
                    errorIcon: Icons.image_outlined,
                  ),
                )
              : const Icon(Icons.image_outlined, color: AppColors.textMuted),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                'Qty: ${item.quantity}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
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
            ],
          ),
        ),
        Text(
          formatInr(item.lineTotal),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ],
    );
  }
}

class _StepSection extends StatelessWidget {
  const _StepSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SelectedAddressCard extends StatelessWidget {
  const _SelectedAddressCard({
    required this.address,
    required this.showChange,
    required this.onChange,
  });

  final Address address;
  final bool showChange;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.mobileSurface.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        getAddressFullName(address),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (address.isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'DEFAULT',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (showChange)
                TextButton(onPressed: onChange, child: const Text('Change')),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            formatAddressLine(address),
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 4),
          Text('+91 ${address.number}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}

class _AddressPicker extends StatelessWidget {
  const _AddressPicker({
    required this.addresses,
    required this.selectedId,
    required this.onSelect,
    required this.onAddNew,
  });

  final List<Address> addresses;
  final String? selectedId;
  final ValueChanged<String> onSelect;
  final VoidCallback onAddNew;

  @override
  Widget build(BuildContext context) {
    return RadioGroup<String>(
      groupValue: selectedId,
      onChanged: (value) {
        if (value != null) onSelect(value);
      },
      child: Column(
        children: [
          ...addresses.map(
            (addr) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => onSelect(addr.id),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selectedId == addr.id ? AppColors.primary : AppColors.borderLight,
                    ),
                    color: selectedId == addr.id
                        ? AppColors.primary.withValues(alpha: 0.05)
                        : Colors.white,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Radio<String>(
                        value: addr.id,
                        activeColor: AppColors.primary,
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              getAddressFullName(addr),
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              formatAddressLine(addr),
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(onPressed: onAddNew, child: const Text('+ Add new address')),
        ),
        ],
      ),
    );
  }
}

class _PaymentPlanOption extends StatelessWidget {
  const _PaymentPlanOption({
    required this.value,
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String value;
  final bool selected;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.borderLight,
          ),
          color: selected ? AppColors.primary.withValues(alpha: 0.05) : Colors.white,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Radio<String>(
              value: value,
              activeColor: AppColors.primary,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.35),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
