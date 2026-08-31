import 'dart:async';
import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/socket_service.dart';
import '../../../utils/map_navigation.dart';
import '../../widgets/buttons/delivery_action_button.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';
import 'pickup_qr_scan_screen.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  const ActiveDeliveryScreen({super.key});

  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  ActiveDeliveryData? _delivery;
  bool _isLoading = true;
  Timer? _refreshTimer;
  StreamSubscription<Map<String, dynamic>>? _pickupSub;
  final TextEditingController _otpController = TextEditingController(text: '4321');

  @override
  void initState() {
    super.initState();
    _loadDelivery();
    _refreshTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadDelivery());
    _pickupSub = SocketService.instance.onPickupVerified.listen((_) => _loadDelivery());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _pickupSub?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _loadDelivery() async {
    final data = await OrderService.instance.fetchActiveDelivery();
    if (mounted) {
      setState(() {
        _delivery = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _openPickupQrScanner() async {
    if (_delivery == null) return;
    final verified = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => PickupQrScanScreen(
          orderId: _delivery!.id,
          orderNumber: _delivery!.orderNumber,
        ),
      ),
    );
    if (verified == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pickup verified! Customer address unlocked.'),
          backgroundColor: Color(0xFF059669),
        ),
      );
      await _loadDelivery();
    }
  }

  void _showCompleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Complete Delivery', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ask customer for the 4-digit Delivery OTP.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
              decoration: InputDecoration(
                hintText: '4321',
                counterText: '',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              final otp = _otpController.text.trim();
              Navigator.pop(ctx);
              if (_delivery != null && otp.isNotEmpty) {
                final messenger = ScaffoldMessenger.of(context);
                final nav = Navigator.of(context);
                final success = await OrderService.instance.completeDelivery(_delivery!.id, otp);
                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('🎉 Order delivered successfully! You are now back online for orders.'),
                      backgroundColor: Color(0xFF059669),
                    ),
                  );
                  nav.pop();
                } else {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('❌ Invalid OTP code (Default: 4321)'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('COMPLETE ORDER'),
          ),
        ],
      ),
    );
  }

  Future<void> _navigateToDarkStore(ActiveDeliveryData d) async {
    final ok = await openMapsNavigation(
      destLat: d.darkStoreLat,
      destLng: d.darkStoreLng,
      fallbackAddress: d.darkStoreAddress,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Google Maps. Install Maps or try again.')),
      );
    }
  }

  Future<void> _navigateToCustomer(ActiveDeliveryData d) async {
    final ok = await openMapsNavigation(
      destLat: d.customerLat,
      destLng: d.customerLng,
      fallbackAddress: d.customerAddress,
      preferAddress: true,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Google Maps. Install Maps or try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: const CustomAppBar(title: 'Active Delivery', showBackButton: true),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_delivery == null) {
      return Scaffold(
        appBar: const CustomAppBar(title: 'Active Delivery', showBackButton: true),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.local_shipping_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('No Active Delivery', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'Stay online on the home screen to receive automated round-robin order assignments.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Check For Orders',
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final d = _delivery!;
    final isLocked = d.isCustomerLocationLocked;

    return Scaffold(
      appBar: CustomAppBar(
        title: 'Order #${d.orderNumber}',
        subtitle: isLocked ? 'Phase 1: Dark Store Pickup' : 'Phase 2: Out For Delivery',
        showBackButton: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: StatusChip(
                label: isLocked ? 'EN ROUTE TO DARK STORE' : 'OUT FOR DELIVERY ✅',
                type: isLocked ? StatusType.info : StatusType.success,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Pickup Dark Store Card
            DashboardCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Icon(Icons.storefront_outlined, color: AppColors.primary),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('PICKUP DARK STORE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                            Text(d.darkStoreName, style: Theme.of(context).textTheme.titleMedium),
                            Text(d.darkStoreAddress, style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isLocked ? const Color(0xFFFEF3C7) : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isLocked
                        ? 'At the store, ask the manager to open Show Pickup QR, then scan it below.'
                        : '✅ PICKUP VERIFIED — OUT FOR DELIVERY',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isLocked ? const Color(0xFF92400E) : const Color(0xFF065F46),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.md),

            // CUSTOMER LOCATION CARD (LOCKED VS UNLOCKED)
            DashboardCard(
              child: isLocked
                  ? const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.lock, color: Colors.amber, size: 28),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('CUSTOMER ADDRESS LOCKED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber)),
                                  Text(
                                    'Customer delivery address unlocks after you scan the Pickup QR at the Dark Store.',
                                    style: TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('PICKUP VERIFIED ✓', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF065F46))),
                        const SizedBox(height: 8),
                        const Text('DELIVER TO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 8),
                        Text(d.customerName, style: Theme.of(context).textTheme.titleMedium),
                        Text(d.customerAddress, style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 14),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: SizedBox(
                            height: 130,
                            width: double.infinity,
                            child: CustomPaint(
                              painter: MapGuidancePainter(),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Align(
                                  alignment: Alignment.bottomLeft,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.55),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.navigation_rounded, color: Color(0xFF10B981), size: 16),
                                        SizedBox(width: 6),
                                        Text(
                                          'Tap Navigate below to open Maps',
                                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),

            const SizedBox(height: AppSpacing.md),

            // Items List Summary
            DashboardCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ORDER ITEMS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 8),
                  ...d.items.map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${item['quantity']}x ${item['name']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                            Text('₹${item['price'] * item['quantity']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 12, AppSpacing.lg, AppSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isLocked) ...[
                  DeliveryActionButton(
                    label: 'Scan Pickup QR',
                    icon: Icons.qr_code_scanner_rounded,
                    style: DeliveryActionStyle.accent,
                    onPressed: _openPickupQrScanner,
                  ),
                  const SizedBox(height: 10),
                  DeliveryActionButton(
                    label: 'Navigate to Dark Store',
                    icon: Icons.storefront_outlined,
                    style: DeliveryActionStyle.outline,
                    onPressed: () => _navigateToDarkStore(d),
                  ),
                ] else ...[
                  DeliveryActionButton(
                    label: 'Navigate to Customer',
                    icon: Icons.navigation_rounded,
                    style: DeliveryActionStyle.accent,
                    onPressed: () => _navigateToCustomer(d),
                  ),
                  const SizedBox(height: 10),
                  DeliveryActionButton(
                    label: 'Complete Delivery · Enter OTP',
                    icon: Icons.check_circle_outline,
                    style: DeliveryActionStyle.primary,
                    onPressed: _showCompleteDialog,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Route preview for active delivery cards.
class MapGuidancePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = const Color(0xFF0F172A);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    final roadPaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(size.width * 0.15, size.height * 0.75)
      ..cubicTo(
        size.width * 0.4,
        size.height * 0.8,
        size.width * 0.4,
        size.height * 0.25,
        size.width * 0.85,
        size.height * 0.3,
      );

    canvas.drawPath(path, roadPaint);

    final routePaint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke;

    canvas.drawPath(path, routePaint);

    // Store Pin (Origin)
    final storePinPaint = Paint()..color = const Color(0xFF3B82F6);
    canvas.drawCircle(Offset(size.width * 0.15, size.height * 0.75), 8, storePinPaint);

    // Customer Pin (Destination)
    final customerPinPaint = Paint()..color = const Color(0xFFEF4444);
    canvas.drawCircle(Offset(size.width * 0.85, size.height * 0.3), 10, customerPinPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
