import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/socket_service.dart';
import '../../../utils/map_navigation.dart';
import '../../widgets/buttons/delivery_action_button.dart';
import '../../widgets/buttons/primary_button.dart';
import 'pickup_qr_scan_screen.dart';
import 'item_proof_capture_screen.dart';

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
      final updated = OrderService.instance.activeDelivery;
      if (updated != null) {
        setState(() => _delivery = updated);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('QR scanned! Now capture item photo for manager approval.'),
          backgroundColor: Color(0xFF059669),
        ),
      );
      await _loadDelivery();
    }
  }

  Future<void> _openItemProofCapture() async {
    if (_delivery == null) return;
    final sent = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => ItemProofCaptureScreen(
          orderId: _delivery!.id,
          orderNumber: _delivery!.orderNumber,
        ),
      ),
    );
    if (sent == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Item photo sent. Waiting for manager approval.'),
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
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
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
                      content: Text('Order delivered successfully! You are now back online for orders.'),
                      backgroundColor: Color(0xFF059669),
                    ),
                  );
                  nav.pop();
                } else {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Invalid OTP code (Default: 4321)'),
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

  Future<void> _callStore(String? phone) async {
    if (phone == null || phone.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Store phone number not available.')),
      );
      return;
    }
    final uri = Uri.parse('tel:$phone');
    if (!await launchUrl(uri)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open phone dialer.')),
        );
      }
    }
  }

  int _totalItemCount(ActiveDeliveryData d) {
    return d.items.fold<int>(0, (sum, item) {
      final qty = item is Map ? (item['quantity'] as num?)?.toInt() ?? 0 : 0;
      return sum + qty;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF3F6F4),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_delivery == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF3F6F4),
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
    final isUnlocked = d.customerAddressUnlocked;
    final qrScanned = d.pickupQrScanned;
    final proofPending = d.pickupProofStatus == 'pending';
    final needsProof = qrScanned && d.pickupProofStatus == 'none';
    final totalItems = _totalItemCount(d);

    String phaseSubtitle;
    if (isUnlocked) {
      phaseSubtitle = 'Phase 3: Out For Delivery';
    } else if (proofPending) {
      phaseSubtitle = 'Phase 2: Awaiting Manager Approval';
    } else if (qrScanned) {
      phaseSubtitle = 'Phase 2: Item Proof Required';
    } else {
      phaseSubtitle = 'Phase 1: Dark Store Pickup';
    }

    String statusLabel;
    Color statusColor;
    Color statusBg;
    if (isUnlocked) {
      statusLabel = 'OUT FOR DELIVERY';
      statusColor = const Color(0xFF059669);
      statusBg = const Color(0xFFECFDF5);
    } else if (proofPending) {
      statusLabel = 'AWAITING MANAGER APPROVAL';
      statusColor = const Color(0xFFD97706);
      statusBg = const Color(0xFFFFF7ED);
    } else if (qrScanned) {
      statusLabel = 'ITEM PROOF REQUIRED';
      statusColor = const Color(0xFF7C3AED);
      statusBg = const Color(0xFFF5F3FF);
    } else {
      statusLabel = 'EN ROUTE TO DARK STORE';
      statusColor = const Color(0xFF2563EB);
      statusBg = const Color(0xFFEFF6FF);
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF3F6F4),
      body: SafeArea(
        child: Column(
          children: [
            _PickupHeader(
              orderNumber: d.orderNumber,
              subtitle: phaseSubtitle,
              onBack: () => Navigator.pop(context),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    _StatusPill(
                      label: statusLabel,
                      color: statusColor,
                      bgColor: statusBg,
                    ),
                    const SizedBox(height: 14),
                    _PickupStoreCard(
                      storeName: d.darkStoreName,
                      address: d.darkStoreAddress,
                      phone: d.darkStorePhone,
                      qrScanned: qrScanned,
                      proofPending: proofPending,
                      isUnlocked: isUnlocked,
                      onCall: () => _callStore(d.darkStorePhone),
                    ),
                    const SizedBox(height: 12),
                    if (isUnlocked)
                      _UnlockedCustomerCard(
                        customerName: d.customerName,
                        customerAddress: d.customerAddress,
                      )
                    else if (proofPending)
                      const _AwaitingApprovalCard()
                    else
                      const _LockedAddressCard(),
                    const SizedBox(height: 12),
                    _OrderItemsCard(items: d.items, totalItems: totalItems),
                  ],
                ),
              ),
            ),
            _BottomActions(
              isUnlocked: isUnlocked,
              qrScanned: qrScanned,
              needsProof: needsProof,
              proofPending: proofPending,
              onScanQr: _openPickupQrScanner,
              onItemProof: _openItemProofCapture,
              onNavigateStore: () => _navigateToDarkStore(d),
              onNavigateCustomer: () => _navigateToCustomer(d),
              onComplete: _showCompleteDialog,
            ),
          ],
        ),
      ),
    );
  }
}

class _PickupHeader extends StatelessWidget {
  const _PickupHeader({
    required this.orderNumber,
    required this.subtitle,
    required this.onBack,
  });

  final String orderNumber;
  final String subtitle;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Row(
        children: [
          _HeaderIconButton(icon: Icons.arrow_back_ios_new_rounded, onTap: onBack),
          Expanded(
            child: Column(
              children: [
                Text(
                  'Order #$orderNumber',
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          _HeaderIconButton(
            icon: Icons.help_outline_rounded,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Scan Pickup QR at the dark store to unlock customer address.')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Icon(icon, size: 20, color: AppColors.textPrimary),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.label,
    required this.color,
    required this.bgColor,
  });

  final String label;
  final Color color;
  final Color bgColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _PickupStoreCard extends StatelessWidget {
  const _PickupStoreCard({
    required this.storeName,
    required this.address,
    required this.phone,
    required this.qrScanned,
    required this.proofPending,
    required this.isUnlocked,
    required this.onCall,
  });

  final String storeName;
  final String address;
  final String? phone;
  final bool qrScanned;
  final bool proofPending;
  final bool isUnlocked;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _IconTile(
                icon: Icons.storefront_rounded,
                color: AppColors.primary,
                bg: AppColors.primaryLight.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PICKUP DARK STORE',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      storeName,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        height: 1.35,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onCall,
                borderRadius: BorderRadius.circular(12),
                child: Column(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.55),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.phone_rounded, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Call Store',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFA7F3D0)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF059669)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isUnlocked
                        ? 'Pickup verified. Customer address is now unlocked.'
                        : proofPending
                            ? 'Item photo sent. Manager is reviewing — address unlocks after approval.'
                            : qrScanned
                                ? 'QR scanned. Capture item photo and send to manager.'
                                : 'At the store, ask the manager to open Show Pickup QR, then scan it below.',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      height: 1.35,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF065F46),
                    ),
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

class _LockedAddressCard extends StatelessWidget {
  const _LockedAddressCard();

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Stack(
        children: [
          Positioned(
            right: -8,
            top: 0,
            bottom: 0,
            child: Icon(
              Icons.shield_outlined,
              size: 88,
              color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _IconTile(
                icon: Icons.lock_rounded,
                color: const Color(0xFFD97706),
                bg: const Color(0xFFFFF7ED),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CUSTOMER ADDRESS LOCKED',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: const Color(0xFFD97706),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Customer delivery address unlocks after QR scan, item photo, and manager approval.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        height: 1.35,
                        color: AppColors.textSecondary,
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
}

class _AwaitingApprovalCard extends StatelessWidget {
  const _AwaitingApprovalCard();

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _IconTile(
            icon: Icons.hourglass_top_rounded,
            color: const Color(0xFFD97706),
            bg: const Color(0xFFFFF7ED),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AWAITING MANAGER APPROVAL',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                    color: const Color(0xFFD97706),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Item photo sent to delivery manager. Customer address unlocks when they approve.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    height: 1.35,
                    color: AppColors.textSecondary,
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

class _UnlockedCustomerCard extends StatelessWidget {
  const _UnlockedCustomerCard({
    required this.customerName,
    required this.customerAddress,
  });

  final String customerName;
  final String customerAddress;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _IconTile(
                icon: Icons.location_on_rounded,
                color: AppColors.primary,
                bg: AppColors.primaryLight.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DELIVER TO',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      customerName,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            customerAddress,
            style: GoogleFonts.inter(
              fontSize: 12,
              height: 1.35,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderItemsCard extends StatelessWidget {
  const _OrderItemsCard({
    required this.items,
    required this.totalItems,
  });

  final List<dynamic> items;
  final int totalItems;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _IconTile(
                icon: Icons.receipt_long_rounded,
                color: AppColors.primary,
                bg: AppColors.primaryLight.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 12),
              Text(
                'ORDER ITEMS',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((raw) {
            final item = raw as Map;
            final qty = (item['quantity'] as num?)?.toInt() ?? 0;
            final name = item['name'] as String? ?? 'Item';
            final price = (item['price'] as num?)?.toDouble() ?? 0;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '$qty x $name',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Text(
                    '₹${(price * qty).toStringAsFixed(0)}',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            );
          }),
          const Divider(height: 24, color: Color(0xFFE5E7EB)),
          Row(
            children: [
              Icon(Icons.inventory_2_outlined, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                'Total Items',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                '$totalItems Items',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BottomActions extends StatelessWidget {
  const _BottomActions({
    required this.isUnlocked,
    required this.qrScanned,
    required this.needsProof,
    required this.proofPending,
    required this.onScanQr,
    required this.onItemProof,
    required this.onNavigateStore,
    required this.onNavigateCustomer,
    required this.onComplete,
  });

  final bool isUnlocked;
  final bool qrScanned;
  final bool needsProof;
  final bool proofPending;
  final VoidCallback onScanQr;
  final VoidCallback onItemProof;
  final VoidCallback onNavigateStore;
  final VoidCallback onNavigateCustomer;
  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F6F4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isUnlocked) ...[
              DeliveryActionButton(
                label: 'Navigate to Customer',
                subtitle: 'Open Google Maps for delivery route',
                icon: Icons.navigation_rounded,
                style: DeliveryActionStyle.accent,
                onPressed: onNavigateCustomer,
              ),
              const SizedBox(height: 8),
              DeliveryActionButton(
                label: 'Complete Delivery',
                subtitle: 'Enter customer OTP to finish',
                icon: Icons.check_circle_outline_rounded,
                style: DeliveryActionStyle.outline,
                onPressed: onComplete,
              ),
            ] else if (proofPending) ...[
              DeliveryActionButton(
                label: 'Waiting for Manager',
                subtitle: 'Item photo under review — address unlocks after tick',
                icon: Icons.hourglass_top_rounded,
                style: DeliveryActionStyle.outline,
                onPressed: null,
                showChevron: false,
              ),
            ] else if (needsProof) ...[
              DeliveryActionButton(
                label: 'Item Proof Photo',
                subtitle: 'Capture packed items for manager approval',
                icon: Icons.camera_alt_rounded,
                style: DeliveryActionStyle.accent,
                onPressed: onItemProof,
              ),
              const SizedBox(height: 8),
              DeliveryActionButton(
                label: 'Navigate to Dark Store',
                icon: Icons.storefront_outlined,
                style: DeliveryActionStyle.outline,
                onPressed: onNavigateStore,
              ),
            ] else ...[
              DeliveryActionButton(
                label: 'Scan Pickup QR',
                subtitle: 'Scan at the store to continue pickup',
                icon: Icons.qr_code_scanner_rounded,
                style: DeliveryActionStyle.accent,
                onPressed: onScanQr,
              ),
              const SizedBox(height: 8),
              DeliveryActionButton(
                label: 'Navigate to Dark Store',
                icon: Icons.storefront_outlined,
                style: DeliveryActionStyle.outline,
                onPressed: onNavigateStore,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8ECE9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _IconTile extends StatelessWidget {
  const _IconTile({
    required this.icon,
    required this.color,
    required this.bg,
  });

  final IconData icon;
  final Color color;
  final Color bg;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }
}
