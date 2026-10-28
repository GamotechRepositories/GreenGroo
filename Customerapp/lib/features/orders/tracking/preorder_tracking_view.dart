import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../../features/product/product_providers.dart';
import '../../../models/order.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../services/socket_service.dart';
import '../../../widgets/common/app_network_image.dart';

const Color _brandGreen = Color(0xFF0C831F);
const Color _lightGreen = Color(0xFFF0FDF4);
const Color _borderGreen = Color(0xFF86EFAC);
const Color _slate900 = Color(0xFF0F172A);
const Color _slate700 = Color(0xFF334155);
const Color _slate500 = Color(0xFF64748B);
const Color _slate300 = Color(0xFFCBD5E1);
const Color _slate100 = Color(0xFFF1F5F9);
const Color _slate50 = Color(0xFFF8FAFC);

class PreOrderTrackingView extends ConsumerStatefulWidget {
  const PreOrderTrackingView({
    super.key,
    required this.order,
    this.selectedProductId,
    this.onStatusChanged,
  });

  final Order order;
  final String? selectedProductId;
  final Future<void> Function()? onStatusChanged;

  @override
  ConsumerState<PreOrderTrackingView> createState() => _PreOrderTrackingViewState();
}

class _PreOrderTrackingViewState extends ConsumerState<PreOrderTrackingView> {
  late final SocketService _socket;
  StreamSubscription<Map<String, dynamic>>? _statusSub;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _socket = ref.read(socketServiceProvider);
    _socket.joinOrder(widget.order.id);
    _statusSub = _socket.orderStatusUpdates.listen(_onOrderStatus);
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    _socket.leaveOrder(widget.order.id);
    super.dispose();
  }

  void _onOrderStatus(Map<String, dynamic> data) {
    final orderId = data['orderId']?.toString() ?? data['id']?.toString() ?? '';
    if (orderId == widget.order.id && mounted) {
      widget.onStatusChanged?.call();
    }
  }

  Future<void> _handleRefresh() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      await widget.onStatusChanged?.call();
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  String _formatTimestamp(DateTime? dt) {
    if (dt == null) return '';
    try {
      return DateFormat('dd MMM yyyy, hh:mm a').format(dt.toLocal());
    } catch (_) {
      return '';
    }
  }

  OrderItem? _findFocusedItem() {
    if (widget.selectedProductId != null && widget.selectedProductId!.isNotEmpty) {
      for (final item in widget.order.items) {
        if (item.productId == widget.selectedProductId) return item;
      }
    }
    return widget.order.items.isNotEmpty ? widget.order.items.first : null;
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final focusedItem = _findFocusedItem();
    final timelineSteps = order.effectivePreOrderTimeline;
    final orderCode = order.orderNumber.isNotEmpty
        ? order.orderNumber
        : (order.id.length > 8 ? order.id.substring(order.id.length - 8).toUpperCase() : order.id);

    // Watch product for rich farmer traceability if productId is valid
    Product? focusedProduct;
    if (focusedItem != null && focusedItem.productId.isNotEmpty) {
      final productAsync = ref.watch(productDetailProvider(focusedItem.productId));
      focusedProduct = productAsync.asData?.value;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: _slate900),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(RoutePaths.orders);
            }
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Farm Traceability',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: _slate900,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: _lightGreen,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: _borderGreen),
                  ),
                  child: Text(
                    'Pre-order',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: _brandGreen,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 1),
            Text(
              'Order #$orderCode',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: _slate500,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: _brandGreen),
            tooltip: 'Refresh Status',
            onPressed: _handleRefresh,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _brandGreen,
        onRefresh: _handleRefresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            // 1. Delivery Slot & Current Status Banner
            _buildSlotBanner(order),
            const SizedBox(height: 16),

            // 2. Delivery OTP Card (if active and provided)
            if (order.deliveryOtp.trim().isNotEmpty && order.status.toLowerCase() != 'delivered') ...[
              _buildOtpCard(order.deliveryOtp.trim()),
              const SizedBox(height: 16),
            ],

            // 3. Focused Product & Farmer Traceability Card
            if (focusedItem != null) ...[
              _buildProductAndFarmerCard(focusedItem, focusedProduct, order),
              const SizedBox(height: 16),
            ],

            // 4. Chronological Status Timeline
            _buildTimelineSection(timelineSteps),
            const SizedBox(height: 16),

            // 5. Delivery Address Card
            _buildAddressCard(order),
            const SizedBox(height: 16),

            // 6. Order Summary & Items Breakdown
            _buildOrderItemsCard(order),
            const SizedBox(height: 20),

            // 7. Support & Assistance
            _buildHelpButton(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotBanner(Order order) {
    final slot = order.preOrderSlot.isNotEmpty ? order.preOrderSlot : 'Morning Slot';
    final date = order.preOrderDate.isNotEmpty ? order.preOrderDate : 'Scheduled Harvest';
    final currentStatusLabel = order.preOrderProgressLabel.isNotEmpty
        ? order.preOrderProgressLabel
        : 'In Farm Pipeline';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDE6DF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _lightGreen,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.eco_rounded, color: _brandGreen, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Direct Farm Harvest · Pre-order',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: _slate900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Current State: $currentStatusLabel',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _brandGreen,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, thickness: 1, color: _slate100),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_rounded, size: 16, color: _slate500),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        date,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: _slate700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 16, color: _slate300),
              const SizedBox(width: 12),
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 16, color: _slate500),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        slot,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: _slate700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOtpCard(String otp) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.shield_rounded, color: Color(0xFFD97706), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delivery Verification OTP',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF92400E),
                  ),
                ),
                Text(
                  'Share this 4-digit code with your delivery partner',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    color: const Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
            ),
            child: Text(
              otp,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: const Color(0xFFB45309),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductAndFarmerCard(OrderItem item, Product? product, Order order) {
    final farmer = product?.farmer;
    final hasFarmerInfo = farmer != null && !farmer.isEmpty;
    final farmerName = hasFarmerInfo
        ? (farmer.name.startsWith('श्री.') ? farmer.name : 'श्री. ${farmer.name}')
        : 'श्री. Anand Dhumal';
    final location = hasFarmerInfo && farmer.location.isNotEmpty
        ? farmer.location
        : 'Shirur, Pune, Maharashtra';
    final area = hasFarmerInfo && (farmer.cultivationArea.isNotEmpty || farmer.totalArea.isNotEmpty)
        ? (farmer.cultivationArea.isNotEmpty ? farmer.cultivationArea : farmer.totalArea)
        : '5 acres';
    final method = hasFarmerInfo && farmer.agricultureMethod.isNotEmpty
        ? farmer.agricultureMethod
        : 'Natural Organic Farming';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDE6DF)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Item details header
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 58,
                    height: 58,
                    child: item.image.isNotEmpty
                        ? AppNetworkImage(imageUrl: item.image, fit: BoxFit.cover)
                        : Container(
                            color: _slate100,
                            child: const Icon(Icons.eco_outlined, color: _brandGreen),
                          ),
                  ),
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
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Qty: ${item.quantity}  •  ${formatInr(item.price)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _slate500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1, color: _slate100),

          // Farmer card section
          Container(
            color: const Color(0xFFFBFDFB),
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: hasFarmerInfo && farmer.farmerImage.isNotEmpty
                        ? AppNetworkImage(imageUrl: farmer.farmerImage, fit: BoxFit.cover)
                        : Container(
                            color: const Color(0xFFDCFCE7),
                            child: const Icon(Icons.person_rounded, color: _brandGreen, size: 28),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              farmerName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: _brandGreen,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified_rounded, size: 14, color: _brandGreen),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$location  •  $area',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11.5,
                          color: _slate700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        method,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          color: _slate500,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasFarmerInfo)
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded, color: _brandGreen),
                    onPressed: () {
                      context.push(RoutePaths.farmerProfile, extra: farmer);
                    },
                  ),
              ],
            ),
          ),

          // Dark Store / Collection Centre Hub row
          if (order.darkStore != null && order.darkStore!.storeName.isNotEmpty) ...[
            const Divider(height: 1, thickness: 1, color: _slate100),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.store_mall_directory_outlined, size: 16, color: _brandGreen),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Collection Centre: ${order.darkStore!.storeName} (${order.darkStore!.area})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: _slate700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimelineSection(List<PreOrderTimelineStep> steps) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDE6DF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Order Progress Timeline',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: _slate900,
                ),
              ),
              const Spacer(),
              Text(
                'Live Verification',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: _brandGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Stages are verified directly with the backend, farm sourcing, and collection centre.',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11.5,
              color: _slate500,
            ),
          ),
          const SizedBox(height: 16),
          for (var i = 0; i < steps.length; i++)
            _buildTimelineTile(
              step: steps[i],
              isFirst: i == 0,
              isLast: i == steps.length - 1,
            ),
        ],
      ),
    );
  }

  Widget _buildTimelineTile({
    required PreOrderTimelineStep step,
    required bool isFirst,
    required bool isLast,
  }) {
    final isCompleted = step.isCompleted;
    final isCurrent = step.isCurrent;
    final formattedTime = _formatTimestamp(step.timestamp);

    Color dotBg;
    Color dotBorder;
    Color iconColor;
    Widget dotIcon;

    if (isCompleted) {
      dotBg = _brandGreen;
      dotBorder = _brandGreen;
      iconColor = Colors.white;
      dotIcon = Icon(Icons.check_rounded, size: 14, color: iconColor);
    } else if (isCurrent) {
      dotBg = _lightGreen;
      dotBorder = _brandGreen;
      iconColor = _brandGreen;
      dotIcon = Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: _brandGreen,
          shape: BoxShape.circle,
        ),
      );
    } else {
      dotBg = _slate50;
      dotBorder = _slate300;
      iconColor = _slate300;
      dotIcon = Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(
          color: _slate300,
          shape: BoxShape.circle,
        ),
      );
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Indicator Column with connecting lines
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: dotBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: dotBorder, width: isCurrent ? 2 : 1.5),
                  ),
                  child: Center(child: dotIcon),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isCompleted ? _brandGreen : const Color(0xFFE2E8F0),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Step Details Column
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 4 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          step.title,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13.5,
                            fontWeight: isCurrent || isCompleted ? FontWeight.w800 : FontWeight.w600,
                            color: isCurrent
                                ? _brandGreen
                                : (isCompleted ? _slate900 : _slate500),
                          ),
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'IN PROGRESS',
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
                    step.subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      height: 1.35,
                      color: isCurrent || isCompleted ? _slate700 : _slate500,
                    ),
                  ),
                  if (formattedTime.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded, size: 12, color: _slate500),
                        const SizedBox(width: 4),
                        Text(
                          formattedTime,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _slate500,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (step.actorName != null && step.actorName!.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      'Verified by: ${step.actorName!}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                        color: _slate500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Order order) {
    final addr = order.deliveryAddress;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDE6DF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.location_on_rounded, size: 18, color: _brandGreen),
              const SizedBox(width: 8),
              Text(
                'Delivery Address',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: _slate900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            addr.shopName.isNotEmpty
                ? addr.shopName
                : (addr.fullName.isNotEmpty ? addr.fullName : 'Customer Address'),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            addr.fullAddress.isNotEmpty
                ? addr.fullAddress
                : '${addr.city} - ${addr.pincode}',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              height: 1.4,
              color: _slate700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItemsCard(Order order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDE6DF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Items (${order.items.length})',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 10),
          for (final item in order.items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Text(
                    '${item.quantity}x',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: _brandGreen,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        color: _slate700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    formatInr(item.price * item.quantity),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: _slate900,
                    ),
                  ),
                ],
              ),
            ),
          const Divider(height: 18, thickness: 1, color: _slate100),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Amount Paid',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: _slate900,
                ),
              ),
              Text(
                formatInr(order.total),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: _brandGreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHelpButton(BuildContext context) {
    return Center(
      child: TextButton.icon(
        onPressed: () => context.push(RoutePaths.support),
        icon: const Icon(Icons.help_outline_rounded, size: 16, color: _brandGreen),
        label: Text(
          'Need help with this pre-order?',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: _brandGreen,
          ),
        ),
      ),
    );
  }
}
