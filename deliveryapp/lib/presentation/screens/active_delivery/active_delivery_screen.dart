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
import 'delivery_proof_capture_screen.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  const ActiveDeliveryScreen({super.key});

  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  ActiveDeliveryData? _delivery;
  List<ActiveDeliveryData> _deliveries = const [];
  bool _isLoading = true;
  bool _customerNavStarted = false;
  Timer? _refreshTimer;
  Timer? _tickTimer;
  StreamSubscription<Map<String, dynamic>>? _pickupSub;
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDelivery();
    _refreshTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadDelivery());
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final d = _delivery;
      if (d != null && !d.pickupQrUnlocked && !d.pickupQrScanned) {
        setState(() {});
        if (d.routeBatchWindowEndsAt != null &&
            !d.routeBatchWindowEndsAt!.isAfter(DateTime.now())) {
          _loadDelivery();
        }
      }
    });
    _pickupSub = SocketService.instance.onPickupVerified.listen((_) => _loadDelivery());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _tickTimer?.cancel();
    _pickupSub?.cancel();
    _otpController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadDelivery() async {
    final data = await OrderService.instance.fetchActiveDelivery();
    if (mounted) {
      final list = OrderService.instance.activeDeliveries;
      ActiveDeliveryData? selected = data;
      if (_delivery != null && list.isNotEmpty) {
        selected = list.cast<ActiveDeliveryData?>().firstWhere(
              (d) => d?.id == _delivery!.id,
              orElse: () => list.first,
            );
      }
      setState(() {
        _deliveries = list;
        _delivery = selected ?? data;
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

  Future<void> _startCompleteFlow() async {
    if (_delivery == null) return;

    final hasProof = (_delivery!.deliveryProofImageUrl).trim().isNotEmpty;
    if (!hasProof) {
      final uploaded = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => DeliveryProofCaptureScreen(
            orderId: _delivery!.id,
            orderNumber: _delivery!.orderNumber,
          ),
        ),
      );
      if (uploaded != true || !mounted) return;
      await _loadDelivery();
      if (!mounted) return;
    }

    if (!_delivery!.customerOtpVerified) {
      final otpOk = await _askCustomerOtp();
      if (!otpOk || !mounted) return;
      await _loadDelivery();
      if (!mounted || _delivery == null) return;
    }

    if (_delivery!.isPaidOnline ||
        _delivery!.isCashCollected ||
        _delivery!.amountToCollect <= 0) {
      await _askOptionalCommentThenFinish();
      return;
    }

    await _askPaymentMethodAndFinish();
  }

  Future<void> _onNavigateCustomerTap() async {
    if (_delivery == null) return;
    setState(() => _customerNavStarted = true);
    await _navigateToCustomer(_delivery!);
  }

  Future<void> _captureDeliveryProofThenOtp() async {
    if (_delivery == null) return;
    final uploaded = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => DeliveryProofCaptureScreen(
          orderId: _delivery!.id,
          orderNumber: _delivery!.orderNumber,
        ),
      ),
    );
    if (uploaded != true || !mounted) return;
    await _loadDelivery();
    if (!mounted) return;
    // Auto OTP after photo sent
    await _startCompleteFlow();
  }

  Future<void> _askOptionalCommentThenFinish() async {
    _commentController.clear();
    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Complete Delivery', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add an optional delivery note (customer received, left at door, etc.).',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _commentController,
              maxLines: 3,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Optional comment',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Skip & Complete'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Complete'),
          ),
        ],
      ),
    );
    if (proceed == true) {
      await _finishDelivery(
        otpAlreadyVerified: true,
        deliveryComment: _commentController.text.trim(),
      );
    }
  }

  Future<void> _markDeliveryFailed() async {
    if (_delivery == null) return;
    final reasonCtrl = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delivery Failed', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Reason / comment is required (customer not available, wrong address, refused, etc.).',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 4,
              maxLength: 800,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Why did delivery fail?',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, reasonCtrl.text.trim()),
            child: const Text('Submit Failed'),
          ),
        ],
      ),
    );
    reasonCtrl.dispose();
    if (reason == null) return;
    if (reason.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failure reason is required.'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    final result = await OrderService.instance.failDelivery(
      _delivery!.id,
      failureReason: reason,
    );
    if (!mounted) return;
    if (result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Delivery marked as failed. Manager has been notified.'),
          backgroundColor: Color(0xFFB45309),
        ),
      );
      final remaining = OrderService.instance.activeDeliveries;
      if (remaining.isEmpty) {
        Navigator.pop(context);
      } else {
        await _loadDelivery();
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Could not mark failed.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<bool> _askCustomerOtp() async {
    _otpController.clear();
    final otp = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Customer OTP', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ask the customer for the 4-digit Delivery OTP shown in their GreenGroo order screen.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
              decoration: InputDecoration(
                hintText: '••••',
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
            onPressed: () => Navigator.pop(ctx, _otpController.text.trim()),
            child: const Text('VERIFY OTP'),
          ),
        ],
      ),
    );

    if (otp == null || otp.isEmpty) return false;

    final result = await OrderService.instance.verifyCustomerOtp(_delivery!.id, otp);
    if (!result.success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.error ?? 'Incorrect OTP'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    }
    return true;
  }

  Future<void> _askPaymentMethodAndFinish() async {
    final d = _delivery!;
    final choice = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Collect ₹${d.amountToCollect} from customer',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              'Item total ₹${d.itemsTotal}  ·  Delivery fee ₹${d.deliveryFee}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(ctx, 'online'),
              icon: const Icon(Icons.qr_code_2_rounded),
              label: const Text('Online (Razorpay / UPI scan)'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFB45309),
                side: const BorderSide(color: Color(0xFFFBBF24)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(ctx, 'cash'),
              icon: const Icon(Icons.payments_outlined),
              label: const Text('Physical Cash (COD)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        ],
      ),
    );

    if (choice == null || !mounted) return;

    if (choice == 'online') {
      final pay = await OrderService.instance.confirmOnlinePayment(d.id);
      if (!pay.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(pay.error ?? 'Online payment failed'), backgroundColor: Colors.red),
          );
        }
        return;
      }
      await _askOptionalCommentThenFinish();
      return;
    }

    // Physical cash
    final cash = await OrderService.instance.confirmCashCollection(d.id);
    if (!cash.success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(cash.error ?? 'Cash confirmation failed'), backgroundColor: Colors.red),
        );
      }
      return;
    }

    final proceed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cash collected', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDBA74)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '⚠ Pay back to Dark Store Manager by end of day',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF9A3412),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Item total          ₹${d.itemsTotal}', style: const TextStyle(fontSize: 13)),
                  Text('Delivery fee     ₹${d.deliveryFee}', style: const TextStyle(fontSize: 13)),
                  const Divider(height: 16),
                  Text(
                    'Total to submit  ₹${d.amountToCollect}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF9A3412)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Order will be marked delivered. Keep this cash and submit it to your delivery manager before end of day.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('OK, COMPLETE ORDER'),
          ),
        ],
      ),
    );

    if (proceed == true) {
      await _askOptionalCommentThenFinish();
    }
  }

  Future<void> _finishDelivery({
    required bool otpAlreadyVerified,
    String? deliveryComment,
  }) async {
    if (_delivery == null) return;
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    // OTP already verified — send a placeholder so backend path that expects otp still works if needed
    final result = await OrderService.instance.completeDelivery(
      _delivery!.id,
      otpAlreadyVerified ? 'VERIFIED' : _otpController.text.trim(),
      deliveryComment: deliveryComment,
    );

    if (result.success) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Order delivered successfully!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
      final remaining = OrderService.instance.activeDeliveries;
      if (remaining.isEmpty) {
        nav.pop();
      } else {
        await _loadDelivery();
      }
    } else {
      messenger.showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Could not complete delivery.'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
    final pickupQrReady = d.pickupQrUnlocked || qrScanned;
    final windowEnds = d.routeBatchWindowEndsAt;

    String phaseSubtitle;
    if (isUnlocked) {
      phaseSubtitle = 'Phase 3: Out For Delivery';
    } else if (proofPending) {
      phaseSubtitle = 'Phase 2: Awaiting Manager Approval';
    } else if (qrScanned) {
      phaseSubtitle = 'Phase 2: Item Proof Required';
    } else if (!pickupQrReady) {
      phaseSubtitle = 'Waiting for same-route match (up to 5 min)';
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
    } else if (!pickupQrReady) {
      statusLabel = 'SAME-ROUTE SEARCH';
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
                    if (_deliveries.length > 1) ...[
                      _MultiStopBanner(
                        stops: _deliveries,
                        selectedId: d.id,
                        onSelect: (id) {
                          final next = _deliveries.firstWhere((e) => e.id == id);
                          setState(() => _delivery = next);
                        },
                      ),
                      const SizedBox(height: 12),
                    ],
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
                    if (!pickupQrReady && !qrScanned)
                      _SameRouteWaitCard(windowEndsAt: windowEnds)
                    else if (isUnlocked)
                      _UnlockedCustomerCard(
                        customerName: d.customerName,
                        customerAddress: d.customerAddress,
                        distanceKm: d.distanceKm,
                        stopLabel: _deliveries.length > 1
                            ? 'STOP ${_deliveries.indexOf(d) + 1}'
                            : null,
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
              pickupQrReady: pickupQrReady,
              windowEndsAt: windowEnds,
              customerNavStarted: _customerNavStarted,
              otpVerified: d.customerOtpVerified,
              onScanQr: _openPickupQrScanner,
              onItemProof: _openItemProofCapture,
              onNavigateCustomer: _onNavigateCustomerTap,
              onCaptureProof: _captureDeliveryProofThenOtp,
              onComplete: _startCompleteFlow,
              onFailed: isUnlocked ? _markDeliveryFailed : null,
              hasDeliveryProof: d.deliveryProofImageUrl.trim().isNotEmpty,
            ),
          ],
        ),
      ),
    );
  }
}

class _MultiStopBanner extends StatelessWidget {
  const _MultiStopBanner({
    required this.stops,
    required this.selectedId,
    required this.onSelect,
  });

  final List<ActiveDeliveryData> stops;
  final String selectedId;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Suggested route · ${stops.length} deliveries',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          ...List.generate(stops.length, (i) {
            final s = stops[i];
            final selected = s.id == selectedId;
            final dist = s.distanceKm != null
                ? '${s.distanceKm!.toStringAsFixed(1)} km'
                : '—';
            return Padding(
              padding: EdgeInsets.only(bottom: i == stops.length - 1 ? 0 : 8),
              child: InkWell(
                onTap: () => onSelect(s.id),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.primaryLight.withValues(alpha: 0.45)
                        : const Color(0xFFF8FAF9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected ? AppColors.primary : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: selected
                            ? AppColors.primary
                            : const Color(0xFF94A3B8),
                        child: Text(
                          '${i + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '#${s.orderNumber} · ${s.customerName}',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              s.customerAddressUnlocked
                                  ? s.customerAddress
                                  : (s.pickupQrScanned
                                      ? 'Address unlocks after manager approval'
                                      : 'Scan this order\'s QR at store'),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        dist,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
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

class _SameRouteWaitCard extends StatelessWidget {
  const _SameRouteWaitCard({this.windowEndsAt});

  final DateTime? windowEndsAt;

  @override
  Widget build(BuildContext context) {
    final left = windowEndsAt?.difference(DateTime.now());
    final mm = left == null || left.isNegative
        ? '0:00'
        : '${left.inMinutes}:${(left.inSeconds % 60).toString().padLeft(2, '0')}';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDD6FE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Same-route search · $mm',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF6D28D9),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Waiting for another nearby order. If one matches, both go to you and pickup QR unlocks. If not, QR unlocks when the timer ends. Customer address stays locked until QR + manager approval.',
            style: GoogleFonts.inter(
              fontSize: 12,
              height: 1.35,
              color: const Color(0xFF5B21B6),
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
    this.distanceKm,
    this.stopLabel,
  });

  final String customerName;
  final String customerAddress;
  final double? distanceKm;
  final String? stopLabel;

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
                      stopLabel != null ? '$stopLabel · DELIVER TO' : 'DELIVER TO',
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
              if (distanceKm != null)
                Text(
                  '${distanceKm!.toStringAsFixed(1)} km',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
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
    required this.pickupQrReady,
    this.windowEndsAt,
    required this.customerNavStarted,
    required this.otpVerified,
    required this.onScanQr,
    required this.onItemProof,
    required this.onNavigateCustomer,
    required this.onCaptureProof,
    required this.onComplete,
    this.onFailed,
    this.hasDeliveryProof = false,
  });

  final bool isUnlocked;
  final bool qrScanned;
  final bool needsProof;
  final bool proofPending;
  final bool pickupQrReady;
  final DateTime? windowEndsAt;
  final bool customerNavStarted;
  final bool otpVerified;
  final VoidCallback onScanQr;
  final VoidCallback onItemProof;
  final VoidCallback onNavigateCustomer;
  final VoidCallback onCaptureProof;
  final VoidCallback onComplete;
  final VoidCallback? onFailed;
  final bool hasDeliveryProof;

  @override
  Widget build(BuildContext context) {
    Widget primary;
    if (!isUnlocked) {
      if (proofPending) {
        primary = DeliveryActionButton(
          label: 'Waiting for Manager',
          subtitle: 'Item photo under review — address unlocks after approval',
          icon: Icons.hourglass_top_rounded,
          style: DeliveryActionStyle.outline,
          onPressed: null,
          showChevron: false,
        );
      } else if (needsProof || qrScanned) {
        primary = DeliveryActionButton(
          label: 'Take Item Proof & Send',
          subtitle: 'Camera opens — photo goes to manager for approval',
          icon: Icons.camera_alt_rounded,
          style: DeliveryActionStyle.accent,
          onPressed: onItemProof,
        );
      } else if (!pickupQrReady) {
        final left = windowEndsAt?.difference(DateTime.now());
        final mm = left == null || left.isNegative
            ? '0:00'
            : '${left.inMinutes}:${(left.inSeconds % 60).toString().padLeft(2, '0')}';
        primary = DeliveryActionButton(
          label: 'Searching same-route orders',
          subtitle: 'Pickup QR unlocks in $mm — go to dark store meanwhile',
          icon: Icons.hourglass_top_rounded,
          style: DeliveryActionStyle.outline,
          onPressed: null,
          showChevron: false,
        );
      } else {
        primary = DeliveryActionButton(
          label: 'Scan Pickup QR',
          subtitle: 'Scan this order QR at the dark store',
          icon: Icons.qr_code_scanner_rounded,
          style: DeliveryActionStyle.accent,
          onPressed: onScanQr,
        );
      }
    } else if (!hasDeliveryProof && !customerNavStarted) {
      primary = DeliveryActionButton(
        label: 'Navigate to Customer',
        subtitle: 'Opens map with customer address',
        icon: Icons.navigation_rounded,
        style: DeliveryActionStyle.accent,
        onPressed: onNavigateCustomer,
      );
    } else if (!hasDeliveryProof) {
      primary = DeliveryActionButton(
        label: 'Capture Delivery Proof',
        subtitle: 'Take photo at customer location, then enter OTP',
        icon: Icons.photo_camera_outlined,
        style: DeliveryActionStyle.accent,
        onPressed: onCaptureProof,
      );
    } else if (!otpVerified) {
      primary = DeliveryActionButton(
        label: 'Enter OTP & Complete',
        subtitle: 'Ask customer for delivery OTP, then finish',
        icon: Icons.pin_outlined,
        style: DeliveryActionStyle.accent,
        onPressed: onComplete,
      );
    } else {
      primary = DeliveryActionButton(
        label: 'Complete Delivery',
        subtitle: 'Optional comment, then mark delivered',
        icon: Icons.check_circle_outline_rounded,
        style: DeliveryActionStyle.accent,
        onPressed: onComplete,
      );
    }

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
            primary,
            if (isUnlocked && onFailed != null) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onFailed,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'Delivery Failed',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
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
