import 'dart:async';
import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/buttons/secondary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  const ActiveDeliveryScreen({super.key});

  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  ActiveDeliveryData? _delivery;
  bool _isLoading = true;
  Timer? _refreshTimer;
  final TextEditingController _otpController = TextEditingController(text: '4321');

  @override
  void initState() {
    super.initState();
    _loadDelivery();
    _refreshTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadDelivery());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
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

  void _showScanQrDialog() {
    final qrController = TextEditingController(
      text: _delivery?.darkStoreQrCode.isNotEmpty == true
          ? _delivery!.darkStoreQrCode
          : 'DARKSTORE_DEMO',
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_scanner, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text('Scan Store QR Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Position your camera to scan the Dark Store QR Code at the pickup counter.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Container(
              height: 140,
              decoration: BoxDecoration(
                color: Colors.grey.shade900,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF059669), width: 2),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.crop_free, size: 48, color: Color(0xFF10B981)),
                    SizedBox(height: 8),
                    Text('Camera Scanner Active', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: qrController,
              decoration: InputDecoration(
                labelText: 'Store QR Code String',
                hintText: 'e.g. DARKSTORE_...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.qr_code),
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
              final code = qrController.text.trim();
              Navigator.pop(ctx);
              if (_delivery != null && code.isNotEmpty) {
                final messenger = ScaffoldMessenger.of(context);
                final success = await OrderService.instance.scanStoreQr(_delivery!.id, code);
                if (success) {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('✅ Dark Store QR Verified! Customer address & map unlocked.'),
                      backgroundColor: Color(0xFF059669),
                    ),
                  );
                  _loadDelivery();
                } else {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('❌ Invalid Dark Store QR Code'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('VERIFY & UNLOCK MAP'),
          ),
        ],
      ),
    );
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
                        ? '🔑 SCAN DARK STORE QR CODE AT PICKUP DESK'
                        : '✅ STORE QR VERIFIED — OUT FOR DELIVERY',
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
                  ? Column(
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.lock, color: Colors.amber, size: 28),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('CUSTOMER ADDRESS & MAP LOCKED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber)),
                                  Text(
                                    'Scan Dark Store QR Code on arrival to unlock customer address & live route map guidance.',
                                    style: TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                            minimumSize: const Size(double.infinity, 44),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.qr_code_scanner),
                          label: const Text('SCAN DARK STORE QR CODE', style: TextStyle(fontWeight: FontWeight.bold)),
                          onPressed: _showScanQrDialog,
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDBEAFE),
                                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                              ),
                              child: Icon(Icons.person_outline, color: AppColors.info),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('CUSTOMER (UNLOCKED ✅)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF))),
                                  Text(d.customerName, style: Theme.of(context).textTheme.titleMedium),
                                  Text(d.customerPhone, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                                  Text(d.customerAddress, style: Theme.of(context).textTheme.bodyMedium),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Interactive Map Guidance Box
                        Container(
                          height: 160,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Stack(
                            children: [
                              Positioned.fill(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: CustomPaint(
                                    painter: MapGuidancePainter(),
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 12,
                                left: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Row(
                                    children: [
                                      Icon(Icons.navigation, color: Color(0xFF10B981), size: 14),
                                      SizedBox(width: 4),
                                      Text('LIVE ROUTE GUIDANCE: 1.8 KM', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
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
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isLocked) ...[
                PrimaryButton(
                  label: 'SCAN DARK STORE QR CODE',
                  icon: Icons.qr_code_scanner,
                  onPressed: _showScanQrDialog,
                ),
              ] else ...[
                SecondaryButton(
                  label: 'CALL CUSTOMER (${d.customerPhone})',
                  icon: Icons.phone_outlined,
                  onPressed: () {},
                ),
                const SizedBox(height: AppSpacing.md),
                PrimaryButton(
                  label: 'COMPLETE DELIVERY (ENTER OTP)',
                  icon: Icons.check_circle_outline,
                  onPressed: _showCompleteDialog,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Custom painter to draw interactive route map visualization
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
