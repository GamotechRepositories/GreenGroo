import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../models/order.dart';
import '../live_tracking_map.dart';
import '../order_tracking_models.dart';
import 'courier_avatar_badge.dart';
import 'grocery_bag_badge.dart';
import 'horizontal_order_stepper.dart';

/// Full-page modern live order tracking view matching the UI mockup design:
/// Deep green header, full-width live map, and rounded card stack:
/// 1. Order Summary & ETA card (with GG grocery bag)
/// 2. Delivery Partner card (with avatar, rating, bike info, call button)
/// 3. Order Status horizontal stepper (5 steps with live timestamps)
/// 4. Need Help card (with support trigger)
/// 5. Order OTP, items, bill breakdown and repeat order.
class ModernTrackingView extends StatefulWidget {
  const ModernTrackingView({
    super.key,
    required this.order,
    required this.tracking,
    required this.route,
    required this.driver,
    required this.heading,
    required this.onBack,
    this.onStatusChanged,
    this.onInvoice,
    this.onOrderAgain,
  });

  final Order order;
  final OrderTracking tracking;
  final List<LatLng> route;
  final LatLng? driver;
  final double? heading;
  final VoidCallback onBack;
  final VoidCallback? onStatusChanged;
  final VoidCallback? onInvoice;
  final VoidCallback? onOrderAgain;

  @override
  State<ModernTrackingView> createState() => _ModernTrackingViewState();
}

class _ModernTrackingViewState extends State<ModernTrackingView> {
  bool _itemsExpanded = false;

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'packed':
      case 'processing':
        return 'Packed';
      case 'out_for_delivery':
      case 'shipping':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'In Progress';
    }
  }

  String _headerSubtitle(OrderTracking tracking) {
    if (tracking.isDelivered) return 'Your order has been delivered 🎉';
    if (tracking.isCancelled) return 'Your order has been cancelled ❌';
    if (tracking.liveTracking || tracking.status == 'out_for_delivery' || tracking.status == 'shipping') {
      return 'Your order is on the way 🛵';
    }
    if (tracking.status == 'packed' || tracking.status == 'processing') {
      return 'Packed — waiting for pickup 📦';
    }
    if (tracking.status == 'confirmed') {
      return 'Your order has been confirmed ✅';
    }
    return 'Preparing your fresh order 🥗';
  }

  Future<void> _callDriver(String phone) async {
    final digits = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (digits.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: digits);
    if (!await launchUrl(uri) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not initiate phone call')),
      );
    }
  }

  void _copyOtp(String otp) {
    Clipboard.setData(ClipboardData(text: otp));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Delivery OTP copied to clipboard!')),
    );
  }

  void _openHelpSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.support_agent_rounded, color: Color(0xFF0F5A31), size: 28),
                  const SizedBox(width: 12),
                  const Text(
                    'GreenGrocc Support',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Have an issue with your live order? Our team is available 24/7.',
                style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.chat_bubble_outline, color: Color(0xFF0F5A31)),
                ),
                title: const Text('Chat with us on WhatsApp', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: const Text('Instant answers & order updates'),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                onTap: () {
                  Navigator.pop(ctx);
                  launchUrl(Uri.parse('https://wa.me/919999999999?text=Hello%20GreenGrocc%20Support'));
                },
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE8F5E9),
                  child: Icon(Icons.phone_outlined, color: Color(0xFF0F5A31)),
                ),
                title: const Text('Call Customer Care', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: const Text('Speak directly to an agent'),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                onTap: () {
                  Navigator.pop(ctx);
                  launchUrl(Uri.parse('tel:+911800123456'));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final tracking = widget.tracking;
    final orderCode = order.orderNumber.trim().isNotEmpty
        ? order.orderNumber.trim()
        : (order.id.length > 8 ? order.id.substring(0, 8).toUpperCase() : order.id);

    final statusLabel = _formatStatusLabel(tracking.status);
    final etaText = tracking.eta?.text.isNotEmpty == true
        ? tracking.eta!.text
        : (order.status == 'delivered' ? '0 min' : '12 mins');

    final driver = tracking.driver;
    final driverName = driver?.name.isNotEmpty == true ? driver!.name : 'Rohit Kumar';
    final driverPhone = driver?.phone.isNotEmpty == true ? driver!.phone : '+919876543210';
    final driverVehicle = driver?.vehicleNumber.isNotEmpty == true ? driver!.vehicleNumber : 'MH 12 AB 3456';
    final driverType = driver?.vehicleType.isNotEmpty == true ? driver!.vehicleType : 'Bike';
    final driverRating = driver?.rating ?? 4.8;
    final driverDeliveries = driver?.totalDeliveries ?? 256;

    final hasOtp = order.deliveryOtp.trim().isNotEmpty && !tracking.isClosed;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F6),
      body: Column(
        children: [
          // 1. Top Forest Green App Bar (Header)
          Container(
            color: const Color(0xFF0F5A31),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(6, 4, 14, 10),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                      onPressed: widget.onBack,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Track Your Order',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _headerSubtitle(tracking),
                            style: const TextStyle(
                              color: Color(0xFFE2F3E7),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Order ID Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0A4222),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Order ID',
                            style: TextStyle(
                              color: Color(0xFFA5D6A7),
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '#$orderCode',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2. Body: Interactive Map + Scrollable Cards
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                // Live Interactive Google Map
                SizedBox(
                  height: 270,
                  child: LiveTrackingMap(
                    driver: widget.driver,
                    heading: widget.heading,
                    store: tracking.storeLocation,
                    destination: tracking.destination,
                    route: widget.route,
                    etaText: tracking.eta?.text,
                    distanceMeters: tracking.eta?.distanceMeters,
                    liveTracking: tracking.liveTracking,
                    height: 270,
                  ),
                ),

                // Card Stack Container
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Card 1: Order Summary & ETA Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Grocery Bag Badge (GG logo + fresh vegetables)
                            const GroceryBagBadge(size: 50),
                            const SizedBox(width: 12),
                            // Order info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Order #$orderCode',
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${order.items.length} items  •  ₹${order.total.toInt()}',
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  // Status Chip
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8F5E9),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 5,
                                          height: 5,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF00C853),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 5),
                                        Text(
                                          statusLabel,
                                          style: const TextStyle(
                                            color: Color(0xFF0F5A31),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Vertical Divider
                            Container(
                              width: 1,
                              height: 40,
                              color: const Color(0xFFE2E8F0),
                            ),
                            const SizedBox(width: 12),
                            // Big bold ETA
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                const Text(
                                  'ETA',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF64748B),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  etaText,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F5A31),
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                const Icon(
                                  Icons.access_time_rounded,
                                  size: 13.5,
                                  color: Color(0xFF0F5A31),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Card 2: Delivery Partner Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const CourierAvatarBadge(size: 44),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    driverName,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.star_rounded,
                                        size: 13.5,
                                        color: Color(0xFFFFB300),
                                      ),
                                      const SizedBox(width: 3),
                                      Text(
                                        '$driverRating ($driverDeliveries deliveries)',
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 5),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(2.5),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFE8F5E9),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.two_wheeler_rounded,
                                          size: 11,
                                          color: Color(0xFF0F5A31),
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        driverVehicle,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        driverType,
                                        style: const TextStyle(
                                          fontSize: 9.5,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            // Circular Call Button
                            Material(
                              color: const Color(0xFF0F5A31),
                              shape: const CircleBorder(),
                              elevation: 2,
                              child: InkWell(
                                customBorder: const CircleBorder(),
                                onTap: () => _callDriver(driverPhone),
                                child: Container(
                                  width: 38,
                                  height: 38,
                                  alignment: Alignment.center,
                                  child: const Icon(
                                    Icons.phone_rounded,
                                    color: Colors.white,
                                    size: 17,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Card 3: Order Status Horizontal Stepper
                      HorizontalOrderStepper(
                        status: tracking.status,
                        timeline: tracking.timeline,
                      ),
                      const SizedBox(height: 10),

                      // Card 4: Need Help? Card
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF7EE),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFC8E6C9)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                color: Color(0xFF0F5A31),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.chat_bubble_outline_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Need help?',
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  SizedBox(height: 1),
                                  Text(
                                    'Contact our support team',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Get Help Button
                            Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: _openHelpSheet,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFF0F5A31)),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Get Help',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F5A31),
                                        ),
                                      ),
                                      SizedBox(width: 2),
                                      Icon(
                                        Icons.chevron_right_rounded,
                                        size: 13,
                                        color: Color(0xFF0F5A31),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Optional: Delivery OTP Banner
                      if (hasOtp) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF00C853), width: 1.5),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.lock_outline_rounded, color: Color(0xFF0F5A31), size: 17),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Delivery OTP',
                                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                                  ),
                                  Text(
                                    order.deliveryOtp,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F5A31),
                                      letterSpacing: 2,
                                    ),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              TextButton.icon(
                                onPressed: () => _copyOtp(order.deliveryOtp),
                                icon: const Icon(Icons.copy_rounded, size: 13.5, color: Color(0xFF0F5A31)),
                                label: const Text('Copy OTP', style: TextStyle(color: Color(0xFF0F5A31), fontWeight: FontWeight.w700, fontSize: 11.5)),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Order Items Accordion
                      const SizedBox(height: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => setState(() => _itemsExpanded = !_itemsExpanded),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    const Icon(Icons.receipt_long_rounded, color: Color(0xFF64748B), size: 16),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${order.items.length} items in this order',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    const Spacer(),
                                    Icon(
                                      _itemsExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                                      color: const Color(0xFF64748B),
                                      size: 16,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (_itemsExpanded) ...[
                              const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              for (final item in order.items)
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${item.quantity}x ${item.name}',
                                          style: const TextStyle(fontSize: 11.5, color: Color(0xFF1E293B)),
                                        ),
                                      ),
                                      Text(
                                        '₹${(item.price * item.quantity).toInt()}',
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 4),
                            ],
                          ],
                        ),
                      ),

                      // Repeat Order / Invoice actions
                      const SizedBox(height: 12),
                      if (widget.onOrderAgain != null)
                        FilledButton.icon(
                          onPressed: widget.onOrderAgain,
                          icon: const Icon(Icons.repeat_rounded, size: 16),
                          label: const Text('Repeat Order', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF0F5A31),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                    ],
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
