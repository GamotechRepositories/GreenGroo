import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../core/exceptions/api_exception.dart';
import '../../core/network/api_response_parser.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/address_utils.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/payment_utils.dart';
import '../../core/utils/razorpay_error_message.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import '../../features/checkout/payment_modal.dart';
import '../../models/address.dart';
import '../../models/cart_item.dart';
import '../../models/coupon.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/select_delivery_location_sheet.dart';

enum PaymentModeOption {
  gpay,
  razorpay,
  cod,
  upiManual,
}

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({
    super.key,
    this.selectedAddressId,
    this.appliedCouponCode,
    this.customerMessage,
  });

  final String? selectedAddressId;
  final String? appliedCouponCode;
  final String? customerMessage;

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  late final Razorpay _razorpay;

  PaymentModeOption _selectedMode = PaymentModeOption.gpay;
  String _paymentPlan = PaymentPlan.full;
  bool _placingOrder = false;
  bool _orderPlaced = false;
  String _errorMessage = '';
  String _orderSuccessNote = '';
  String? _attemptedOrderId;
  String? _lastAttemptKey;
  AppliedCoupon? _appliedCoupon;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleRazorpaySuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleRazorpayError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    Future.microtask(() {
      ref.read(addressControllerProvider.notifier).loadAddresses();
      final code = widget.appliedCouponCode?.trim();
      if (code != null && code.isNotEmpty) {
        _fetchCoupon(code);
      }
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _fetchCoupon(String code) async {
    try {
      final cartItems = ref.read(cartControllerProvider).items;
      final subtotal = calculateCartSummary(cartItems).subtotal;
      final coupon = await ref
          .read(apiServiceProvider)
          .validateCoupon(code: code, subtotal: subtotal);
      if (mounted) {
        setState(() {
          _appliedCoupon = coupon;
        });
      }
    } catch (_) {}
  }

  List<Map<String, dynamic>> _checkoutItemsPayload(List<CartItem> items) {
    return items
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
  }

  String? _resolveAddressId(String? id) {
    if (id == null ||
        id.trim().isEmpty ||
        id == 'default_address' ||
        id == 'defult_address') {
      return null;
    }
    return id;
  }

  Map<String, dynamic>? _customerLocationPayload() {
    final loc = ref.read(deliveryLocationProvider);
    if (loc == null) return null;
    final map = <String, dynamic>{
      'city': loc.city ?? '',
      'area': loc.area ?? '',
      'state': loc.state ?? '',
      'pincode': loc.pincode ?? '',
      'fullAddress': loc.address ?? loc.displayAddress,
    };
    if (loc.latitude != null && loc.longitude != null) {
      map['lat'] = loc.latitude;
      map['lng'] = loc.longitude;
      map['location'] = {'lat': loc.latitude, 'lng': loc.longitude};
    }
    return map;
  }

  Future<String?> _syncCheckoutAttempt(
    List<CartItem> items,
    String addressId, {
    bool force = false,
  }) async {
    if (_orderPlaced || items.isEmpty) return _attemptedOrderId;

    final resolvedId = _resolveAddressId(addressId);
    final key =
        '${resolvedId ?? ''}|$_paymentPlan|${_appliedCoupon?.code ?? ''}|${items.map((i) => '${i.id}:${i.quantity}').join(',')}';
    if (!force && key == _lastAttemptKey && _attemptedOrderId != null) {
      return _attemptedOrderId;
    }

    try {
      final response = await ref.read(apiServiceProvider).createCheckoutAttempt({
        if (resolvedId != null) 'addressId': resolvedId,
        'paymentMethod': _selectedMode == PaymentModeOption.cod ? 'cod' : 'online',
        'checkoutItems': _checkoutItemsPayload(items),
        'checkoutMode': 'cart',
        'customerLocation': _customerLocationPayload(),
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
      });
      final order = ApiResponseParser.getData(response.data) as Map<String, dynamic>;
      final orderId = order['_id']?.toString();
      if (orderId != null && orderId.isNotEmpty) {
        _attemptedOrderId = orderId;
        _lastAttemptKey = key;
        return orderId;
      }
    } catch (_) {}

    return _attemptedOrderId;
  }

  Future<void> _processPayment(Address address) async {
    if (_placingOrder) return;

    setState(() => _errorMessage = '');

    final cartItems = ref.read(cartControllerProvider).items;
    if (cartItems.isEmpty) {
      setState(() => _errorMessage = 'Your cart is empty.');
      return;
    }

    await _syncCheckoutAttempt(cartItems, address.id, force: true);

    switch (_selectedMode) {
      case PaymentModeOption.gpay:
      case PaymentModeOption.razorpay:
        await _startRazorpayPayment(address);
        break;
      case PaymentModeOption.cod:
        await _placeCodOrder(address);
        break;
      case PaymentModeOption.upiManual:
        _openManualUpiModal(address);
        break;
    }
  }

  Future<void> _startRazorpayPayment(Address address) async {
    setState(() {
      _placingOrder = true;
      _errorMessage = '';
    });

    try {
      final cartItems = ref.read(cartControllerProvider).items;
      final resolvedId = _resolveAddressId(address.id);
      final response = await ref.read(apiServiceProvider).createRazorpayOrder({
        if (resolvedId != null) 'addressId': resolvedId,
        'paymentMode': _paymentPlan,
        'checkoutItems': _checkoutItemsPayload(cartItems),
        'checkoutMode': 'cart',
        'customerLocation': _customerLocationPayload(),
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

      setState(() => _placingOrder = false);

      final user = ref.read(authControllerProvider).user!;
      final options = <String, dynamic>{
        'key': keyId,
        'amount': amountPaise,
        'order_id': razorpayOrderId,
        'name': 'GreenGrocc',
        'description': _paymentPlan == PaymentPlan.advance
            ? '10% advance payment via Razorpay'
            : 'Order payment via Razorpay',
        'prefill': {
          'contact': user.phone,
          'email': user.email,
          'name': user.name,
        },
      };

      if (_selectedMode == PaymentModeOption.gpay) {
        options['config'] = {
          'display': {
            'blocks': {
              'banks': {
                'name': 'Pay via UPI / Google Pay',
                'instruments': [
                  {'method': 'upi'},
                ],
              },
            },
            'sequence': ['block.banks'],
            'preferences': {'show_default_blocks': true},
          },
        };
      }

      _razorpay.open(options);
    } catch (e) {
      final msg = apiErrorMessage(e, fallback: 'Failed to start payment. Try again.');
      setState(() {
        _placingOrder = false;
        _errorMessage = msg;
      });
    }
  }

  Future<void> _handleRazorpaySuccess(PaymentSuccessResponse response) async {
    setState(() {
      _placingOrder = true;
      _errorMessage = '';
    });

    try {
      final cartItems = ref.read(cartControllerProvider).items;
      final addresses = ref.read(addressControllerProvider.select((s) => s.addresses));
      final defaultAddr = addresses.where((a) => a.isDefault).firstOrNull ?? addresses.firstOrNull;
      final rawId = widget.selectedAddressId ?? defaultAddr?.id;
      final resolvedId = _resolveAddressId(rawId);

      await ref.read(apiServiceProvider).verifyRazorpayPayment({
        if (resolvedId != null) 'addressId': resolvedId,
        'paymentMode': _paymentPlan,
        'customerMessage': widget.customerMessage?.trim() ?? '',
        'checkoutItems': _checkoutItemsPayload(cartItems),
        'checkoutMode': 'cart',
        'customerLocation': _customerLocationPayload(),
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
        if (_attemptedOrderId != null) 'attemptedOrderId': _attemptedOrderId,
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
      });

      await _completeOrderSuccess(
        _paymentPlan == PaymentPlan.advance
            ? 'Order confirmed. 10% paid via Razorpay. Balance on delivery.'
            : 'Order placed and payment confirmed via Razorpay!',
      );
    } catch (e) {
      setState(() {
        _errorMessage = apiErrorMessage(
          e,
          fallback: 'Payment verified but order creation failed. Contact support.',
        );
        _placingOrder = false;
      });
    }
  }

  void _handleRazorpayError(PaymentFailureResponse response) {
    final msg = razorpayErrorMessage(response);
    setState(() {
      _placingOrder = false;
      _errorMessage = msg;
    });
  }

  void _handleExternalWallet(ExternalWalletResponse response) {}

  Future<void> _placeCodOrder(Address address) async {
    setState(() {
      _placingOrder = true;
      _errorMessage = '';
    });

    try {
      final cartItems = ref.read(cartControllerProvider).items;
      final resolvedId = _resolveAddressId(address.id);
      final response = await ref.read(apiServiceProvider).placeOrder({
        if (resolvedId != null) 'addressId': resolvedId,
        'paymentMethod': 'cod',
        'customerMessage': widget.customerMessage?.trim() ?? '',
        'checkoutItems': _checkoutItemsPayload(cartItems),
        'checkoutMode': 'cart',
        'customerLocation': _customerLocationPayload(),
        if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
      });

      final body = ApiResponseParser.getData(response.data);
      if (body is! Map<String, dynamic>) {
        throw ApiException(
          ApiResponseParser.getMessage(response.data) ??
              'Failed to create COD order.',
        );
      }

      await _completeOrderSuccess(
        'Order placed successfully with Cash on Delivery! Pay when your order arrives.',
      );
    } catch (e) {
      setState(() {
        _placingOrder = false;
        _errorMessage = apiErrorMessage(e, fallback: 'Failed to place COD order.');
      });
    }
  }

  void _openManualUpiModal(Address address) {
    final cartItems = ref.read(cartControllerProvider).items;
    final summary = calculateCartSummary(cartItems);
    final total = applyCouponDiscount(
      summary,
      (_appliedCoupon?.discountAmount ?? 0).toDouble(),
    ).total;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PaymentModal(
        paymentMethod: _paymentPlan == PaymentPlan.advance ? 'cod' : 'online',
        orderTotal: total,
        onPayWithRazorpay: () {
          Navigator.of(context).pop();
          _startRazorpayPayment(address);
        },
        onSubmitUpiProof: ({
          required screenshotUrl,
          required screenshotName,
          required upiTransactionRef,
        }) async {
          try {
            final resolvedId = _resolveAddressId(address.id);
            await ref.read(apiServiceProvider).submitUpiPaymentProof({
              if (resolvedId != null) 'addressId': resolvedId,
              'paymentMode': _paymentPlan,
              'screenshotUrl': screenshotUrl,
              'screenshotName': screenshotName,
              'upiTransactionRef': upiTransactionRef,
              'customerMessage': widget.customerMessage?.trim() ?? '',
              'checkoutItems': _checkoutItemsPayload(cartItems),
              'checkoutMode': 'cart',
              'customerLocation': _customerLocationPayload(),
              if (_appliedCoupon != null) 'couponCode': _appliedCoupon!.code,
              if (_attemptedOrderId != null) 'attemptedOrderId': _attemptedOrderId,
            });
            await _completeOrderSuccess(
              'UPI payment proof submitted successfully. We will verify and process your order soon!',
            );
            return null;
          } catch (e) {
            return apiErrorMessage(e, fallback: 'Failed to submit payment proof.');
          }
        },
        onUploadScreenshot: (filePath) =>
            ref.read(apiServiceProvider).uploadImageFile(filePath, 'payment-proofs'),
      ),
    );
  }

  Future<void> _completeOrderSuccess(String note) async {
    setState(() {
      _orderPlaced = true;
      _placingOrder = false;
      _orderSuccessNote = note;
    });
    await ref.read(cartControllerProvider.notifier).loadCart();
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartControllerProvider.select((s) => s.items));
    final addressList = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final deliveryLoc = ref.watch(deliveryLocationProvider);

    final selectedAddress = widget.selectedAddressId != null
        ? addressList.where((a) => a.id == widget.selectedAddressId).firstOrNull
        : (addressList.where((a) => a.isDefault).firstOrNull ?? addressList.firstOrNull);

    final Address effectiveAddress = selectedAddress ??
        Address(
          id: widget.selectedAddressId ?? 'default_address',
          fullName: 'Customer',
          number: '',
          email: '',
          shopNo: '',
          shopName: '',
          fullAddress: deliveryLoc?.displayAddress ?? 'Default Delivery Location',
          landmark: '',
          city: deliveryLoc?.city ?? 'City',
          state: 'State',
          pincode: '000000',
          isDefault: true,
        );

    final baseSummary = calculateCartSummary(cartItems);
    final couponDiscount = (_appliedCoupon?.discountAmount ?? 0)
        .clamp(0.0, baseSummary.subtotal)
        .toDouble();
    final summary = applyCouponDiscount(baseSummary, couponDiscount);

    final payableNow = PaymentUtils.payableAmount(summary.total, _paymentPlan);
    final balanceOnDelivery = summary.total - payableNow;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Select Payment Method',
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        elevation: 0,
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 140),
            children: [
              // 1. Delivery Location Preview & Change Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFF047857),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Delivering to:',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF047857),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            selectedAddress != null
                                ? formatAddressLine(selectedAddress)
                                : (deliveryLoc?.displayAddress ?? 'Select delivery location'),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => showSelectDeliveryLocationBottomSheet(context, ref),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        'Change',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: const Color(0xFF047857),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 2. Order Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Amount to Pay',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        Text(
                          formatInr(payableNow, withDecimals: true),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                    if (_paymentPlan == PaymentPlan.advance) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Balance on delivery',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          Text(
                            formatInr(balanceOnDelivery, withDecimals: true),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (summary.savings > 0) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.local_offer_rounded,
                              size: 14,
                              color: Color(0xFF047857),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Saving ${formatInr(summary.savings)} on this order',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF047857),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              Text(
                'PAYMENT OPTIONS',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: const Color(0xFF64748B),
                ),
              ),

              const SizedBox(height: 12),

              // Option 1: Google Pay & UPI Apps
              _PaymentOptionCard(
                title: 'Google Pay / PhonePe / Paytm / UPI',
                subtitle: 'Instant payment via any UPI App',
                iconWidget: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset('assets/images/payment/gpay.svg', width: 22, height: 22),
                    const SizedBox(width: 4),
                    SvgPicture.asset('assets/images/payment/phonepe.svg', width: 18, height: 18),
                    const SizedBox(width: 4),
                    SvgPicture.asset('assets/images/payment/paytm.svg', width: 18, height: 18),
                  ],
                ),
                selected: _selectedMode == PaymentModeOption.gpay,
                onTap: () => setState(() => _selectedMode = PaymentModeOption.gpay),
              ),

              const SizedBox(height: 10),

              // Option 2: Razorpay (Cards, Netbanking, Wallets)
              _PaymentOptionCard(
                title: 'Razorpay Online Payment',
                subtitle: 'Credit/Debit Card, Net Banking, Wallets & UPI',
                icon: Icons.credit_card_rounded,
                selected: _selectedMode == PaymentModeOption.razorpay,
                onTap: () => setState(() => _selectedMode = PaymentModeOption.razorpay),
              ),

              const SizedBox(height: 10),

              // Option 3: Cash on Delivery (COD)
              _PaymentOptionCard(
                title: 'Cash on Delivery (COD)',
                subtitle: 'Pay cash or UPI when your order arrives',
                icon: Icons.payments_outlined,
                badgeText: 'POPULAR',
                selected: _selectedMode == PaymentModeOption.cod,
                onTap: () => setState(() => _selectedMode = PaymentModeOption.cod),
              ),

              const SizedBox(height: 10),

              // Option 4: Manual UPI QR / Transfer
              _PaymentOptionCard(
                title: 'Scan QR & Upload Screenshot',
                subtitle: 'Pay directly via Store QR and attach payment screenshot',
                icon: Icons.qr_code_scanner_rounded,
                selected: _selectedMode == PaymentModeOption.upiManual,
                onTap: () => setState(() => _selectedMode = PaymentModeOption.upiManual),
              ),

              const SizedBox(height: 20),

              // Payment Plan Radio Switch (Full vs 10% Advance)
              if (_selectedMode != PaymentModeOption.cod) ...[
                Text(
                  'PAYMENT SCHEME',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      RadioListTile<String>(
                        value: PaymentPlan.full,
                        groupValue: _paymentPlan,
                        onChanged: (val) {
                          if (val != null) setState(() => _paymentPlan = val);
                        },
                        title: Text(
                          'Pay 100% Full Payment now',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                          ),
                        ),
                        subtitle: Text(
                          'Pay ${formatInr(summary.total, withDecimals: true)} upfront',
                          style: GoogleFonts.plusJakartaSans(fontSize: 12),
                        ),
                        activeColor: const Color(0xFF047857),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      const Divider(height: 1),
                      RadioListTile<String>(
                        value: PaymentPlan.advance,
                        groupValue: _paymentPlan,
                        onChanged: (val) {
                          if (val != null) setState(() => _paymentPlan = val);
                        },
                        title: Text(
                          'Pay 10% Advance now · Rest on Delivery',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                          ),
                        ),
                        subtitle: Text(
                          'Pay ${formatInr(PaymentUtils.advanceAmount(summary.total), withDecimals: true)} now · ${formatInr(summary.total - PaymentUtils.advanceAmount(summary.total), withDecimals: true)} on delivery',
                          style: GoogleFonts.plusJakartaSans(fontSize: 12),
                        ),
                        activeColor: const Color(0xFF047857),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                    ],
                  ),
                ),
              ],

              if (_errorMessage.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12.5,
                            color: const Color(0xFF991B1B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),

          if (_placingOrder)
            Container(
              color: Colors.black45,
              child: Center(
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(color: Color(0xFF047857)),
                        const SizedBox(height: 16),
                        Text(
                          'Processing order payment...',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          if (_orderPlaced)
            Container(
              color: Colors.black54,
              child: Center(
                child: Card(
                  margin: const EdgeInsets.all(24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: const BoxDecoration(
                            color: Color(0xFFDCFCE7),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            color: Color(0xFF047857),
                            size: 38,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Order Placed Successfully!',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _orderSuccessNote,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: FilledButton(
                            onPressed: () {
                              setState(() => _orderPlaced = false);
                              context.go(RoutePaths.orders);
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF047857),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'View My Orders',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
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
      bottomNavigationBar: _buildBottomPayBar(effectiveAddress, payableNow),
    );
  }

  Widget _buildBottomPayBar(Address address, double payableNow) {
    if (_orderPlaced) return const SizedBox.shrink();

    final buttonLabel = _selectedMode == PaymentModeOption.cod
        ? 'Place Order (Cash on Delivery)'
        : 'Pay ${formatInr(payableNow, withDecimals: true)} Now';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
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
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: _placingOrder ? null : () => _processPayment(address),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF047857),
              disabledBackgroundColor: const Color(0xFFCBD5E1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_rounded, size: 18),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    buttonLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PaymentOptionCard extends StatelessWidget {
  const _PaymentOptionCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
    this.icon,
    this.iconWidget,
    this.badgeText,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final Widget? iconWidget;
  final String? badgeText;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
            width: selected ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Radio<bool>(
              value: true,
              groupValue: selected,
              onChanged: (_) => onTap(),
              activeColor: const Color(0xFF047857),
            ),
            const SizedBox(width: 4),
            if (iconWidget != null) ...[
              iconWidget!,
              const SizedBox(width: 10),
            ] else if (icon != null) ...[
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: selected ? const Color(0xFF047857) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      if (badgeText != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: Text(
                            badgeText!,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
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
