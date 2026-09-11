import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/utils/image_upload_utils.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/socket_service.dart';
import '../../../utils/map_navigation.dart';
import '../../widgets/buttons/primary_button.dart';
import 'pickup_qr_scan_screen.dart';
import 'order_items_screen.dart';

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
    final photo = await _pickCameraPhoto();
    if (photo == null || !mounted) return;

    final sent = await _showPhotoSendSheet(
      photo: photo,
      title: 'Item Proof',
      subtitle: 'Send this photo to the manager for approval.',
      sendLabel: 'Send to Manager',
      onSend: (dataUrl) => OrderService.instance.submitPickupProof(_delivery!.id, dataUrl),
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
      final uploaded = await _captureAndUploadDeliveryProof();
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
    final uploaded = await _captureAndUploadDeliveryProof();
    if (uploaded != true || !mounted) return;
    await _loadDelivery();
    if (!mounted) return;
    await _startCompleteFlow();
  }

  Future<XFile?> _pickCameraPhoto() async {
    try {
      return await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 75,
        maxWidth: 1600,
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open camera. Check permissions.')),
        );
      }
      return null;
    }
  }

  Future<bool?> _captureAndUploadDeliveryProof() async {
    if (_delivery == null) return false;
    final photo = await _pickCameraPhoto();
    if (photo == null || !mounted) return false;

    return _showPhotoSendSheet(
      photo: photo,
      title: 'Delivery Proof',
      subtitle: 'Send this photo, then enter the customer OTP.',
      sendLabel: 'Send Photo',
      onSend: (dataUrl) async {
        final result = await OrderService.instance.uploadDeliveryProof(_delivery!.id, dataUrl);
        return result.success;
      },
    );
  }

  Future<bool?> _showPhotoSendSheet({
    required XFile photo,
    required String title,
    required String subtitle,
    required String sendLabel,
    required Future<bool> Function(String dataUrl) onSend,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        var submitting = false;
        XFile current = photo;
        return StatefulBuilder(
          builder: (context, setModal) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD1D5DB),
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      title,
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280)),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.file(
                        File(current.path),
                        height: 220,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: submitting
                                ? null
                                : () async {
                                    final next = await _pickCameraPhoto();
                                    if (next != null) setModal(() => current = next);
                                  },
                            child: const Text('Retake'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          flex: 2,
                          child: FilledButton(
                            onPressed: submitting
                                ? null
                                : () async {
                                    setModal(() => submitting = true);
                                    final dataUrl = await imageFileToBase64DataUrl(current);
                                    final ok = await onSend(dataUrl);
                                    if (!context.mounted) return;
                                    if (ok) {
                                      Navigator.pop(context, true);
                                    } else {
                                      setModal(() => submitting = false);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Could not send photo. Try again.'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF126B43),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: submitting
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(sendLabel),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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

  static const _kForest = Color(0xFF126B43);
  static const _kPageBg = Color(0xFFF3F6F4);

  String _fmtCountdown(DateTime? ends) {
    final left = ends?.difference(DateTime.now());
    if (left == null || left.isNegative) return '0:00';
    return '${left.inMinutes}:${(left.inSeconds % 60).toString().padLeft(2, '0')}';
  }

  String _fmtClock([DateTime? t]) {
    final local = (t ?? DateTime.now()).toLocal();
    final h = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final m = local.minute.toString().padLeft(2, '0');
    final ap = local.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $ap';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: _kPageBg,
        body: Center(child: CircularProgressIndicator(color: _kForest)),
      );
    }

    if (_delivery == null) {
      return Scaffold(
        backgroundColor: _kPageBg,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.local_shipping_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  'No Active Delivery',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Stay online on the home screen to receive automated round-robin order assignments.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(color: Colors.grey),
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
    final searching = !pickupQrReady && !qrScanned;
    final countdown = _fmtCountdown(windowEnds);
    final itemsTotal = d.itemsTotal > 0
        ? d.itemsTotal
        : d.items.fold<int>(0, (s, raw) {
            final item = raw is Map ? raw : <String, dynamic>{};
            final qty = (item['quantity'] as num?)?.toInt() ?? 0;
            final price = (item['price'] as num?)?.toInt() ?? 0;
            return s + qty * price;
          });

    String headerStatus;
    if (isUnlocked) {
      headerStatus = 'Out for Delivery';
    } else if (proofPending) {
      headerStatus = 'Awaiting Approval';
    } else if (qrScanned) {
      headerStatus = 'Item Proof';
    } else if (searching) {
      headerStatus = 'Waiting for Pickup';
    } else {
      headerStatus = 'Waiting for Pickup';
    }

    return Scaffold(
      backgroundColor: _kPageBg,
      body: Column(
        children: [
          _OrderDetailsHeader(
            orderNumber: d.orderNumber,
            statusLabel: headerStatus,
            onBack: () => Navigator.pop(context),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
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
                  _StoreInfoCard(
                    storeName: d.darkStoreName,
                    address: d.darkStoreAddress,
                    onCall: () => _callStore(d.darkStorePhone),
                    infoText: isUnlocked
                        ? 'Pickup verified. Customer address is unlocked.'
                        : proofPending
                            ? 'Item photo sent. Manager is reviewing — address unlocks after approval.'
                            : qrScanned
                                ? 'QR scanned. Capture item photo and send to manager.'
                                : 'At the store, ask the manager to open Show Pickup QR, then scan it below.',
                  ),
                  const SizedBox(height: 12),
                  _OrderQrCard(
                    orderNumber: d.orderNumber,
                    placedAtLabel: _fmtClock(),
                    totalItems: totalItems,
                    searching: searching,
                    countdown: countdown,
                    qrScanned: qrScanned,
                    proofPending: proofPending,
                    isUnlocked: isUnlocked,
                    onScanQr: () {
                      if (!pickupQrReady || searching) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Pickup QR unlocks in $countdown — go to the dark store meanwhile.',
                            ),
                          ),
                        );
                        return;
                      }
                      _openPickupQrScanner();
                    },
                  ),
                  const SizedBox(height: 12),
                  _CustomerAddressCard(
                    address: isUnlocked
                        ? d.customerAddress
                        : (d.customerAddress.isNotEmpty &&
                                !d.customerAddress.toLowerCase().contains('unlock')
                            ? d.customerAddress
                            : 'Address unlocks after pickup QR + manager approval'),
                    canOpenMap: isUnlocked,
                    onViewMap: () => _navigateToCustomer(d),
                  ),
                  const SizedBox(height: 12),
                  _OrderItemsSummaryCard(
                    totalItems: totalItems,
                    itemsTotal: itemsTotal,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => OrderItemsScreen(
                            orderNumber: d.orderNumber,
                            items: d.items,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  _OrderTimelineCard(
                    assignedTime: _fmtClock(),
                    waitingTime: searching || !qrScanned ? _fmtClock() : _fmtClock(),
                    pickedUp: qrScanned || isUnlocked,
                    delivered: false,
                  ),
                ],
              ),
            ),
          ),
          if (!isUnlocked && !proofPending && !(needsProof || qrScanned))
            // Scan QR lives on the Pickup QR row — no duplicate bottom button.
            const SizedBox.shrink()
          else
            _BottomActions(
              isUnlocked: isUnlocked,
              proofPending: proofPending,
              customerNavStarted: _customerNavStarted,
              otpVerified: d.customerOtpVerified,
              onItemProof: _openItemProofCapture,
              onNavigateCustomer: _onNavigateCustomerTap,
              onCaptureProof: _captureDeliveryProofThenOtp,
              onComplete: _startCompleteFlow,
              onFailed: isUnlocked ? _markDeliveryFailed : null,
              hasDeliveryProof: d.deliveryProofImageUrl.trim().isNotEmpty,
            ),
        ],
      ),
    );
  }
}

// ─── Design-matched UI ───────────────────────────────────────────────────────

class _OrderDetailsHeader extends StatelessWidget {
  const _OrderDetailsHeader({
    required this.orderNumber,
    required this.statusLabel,
    required this.onBack,
  });

  final String orderNumber;
  final String statusLabel;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(8, top + 6, 16, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF126B43),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(22)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                Text(
                  'Order Details',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '#$orderNumber',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF126B43)),
                const SizedBox(width: 5),
                Text(
                  statusLabel,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF126B43),
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

class _StoreInfoCard extends StatelessWidget {
  const _StoreInfoCard({
    required this.storeName,
    required this.address,
    required this.onCall,
    required this.infoText,
  });

  final String storeName;
  final String address;
  final VoidCallback onCall;
  final String infoText;

  @override
  Widget build(BuildContext context) {
    return _WhiteCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.storefront_outlined, color: Color(0xFF126B43)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'PICKUP DARK STORE',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                          color: const Color(0xFF126B43),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      storeName,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        height: 1.35,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 1,
                height: 56,
                margin: const EdgeInsets.only(left: 4, right: 12),
                color: const Color(0xFFE5E7EB),
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
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.phone_rounded, color: Color(0xFF126B43), size: 20),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Call Store',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF126B43),
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
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF059669)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    infoText,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      height: 1.4,
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

class _OrderQrCard extends StatelessWidget {
  const _OrderQrCard({
    required this.orderNumber,
    required this.placedAtLabel,
    required this.totalItems,
    required this.searching,
    required this.countdown,
    required this.qrScanned,
    required this.proofPending,
    required this.isUnlocked,
    required this.onScanQr,
  });

  final String orderNumber;
  final String placedAtLabel;
  final int totalItems;
  final bool searching;
  final String countdown;
  final bool qrScanned;
  final bool proofPending;
  final bool isUnlocked;
  final VoidCallback onScanQr;

  @override
  Widget build(BuildContext context) {
    final pickupStatus = isUnlocked
        ? 'Pickup verified — customer address unlocked'
        : proofPending
            ? 'Item photo sent — waiting for manager'
            : qrScanned
                ? 'QR scanned — take item proof below'
                : 'Scan QR at the store to start';

    return _WhiteCard(
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF126B43), size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order #$orderNumber',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Placed at $placedAtLabel • $totalItems Items',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              if (searching)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3FF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.search_rounded, size: 13, color: Color(0xFF7C3AED)),
                      const SizedBox(width: 4),
                      Text(
                        'Same-route search ($countdown min)',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF7C3AED),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  qrScanned || isUnlocked
                      ? Icons.check_circle_outline_rounded
                      : Icons.inventory_2_outlined,
                  color: const Color(0xFF126B43),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pickup QR',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    Text(
                      pickupStatus,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              if (!qrScanned && !isUnlocked) ...[
                const SizedBox(width: 8),
                _ScanQrPillButton(onTap: onScanQr),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// Compact forest-green Scan QR control matching the Order Details mockup.
class _ScanQrPillButton extends StatelessWidget {
  const _ScanQrPillButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF126B43),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 6),
              Text(
                'Scan QR',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrimaryActionBtn extends StatelessWidget {
  const _PrimaryActionBtn({
    required this.label,
    required this.icon,
    required this.enabled,
    required this.onTap,
    this.showChevron = false,
  });

  final String label;
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: enabled ? onTap : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF126B43),
          disabledBackgroundColor: const Color(0xFF9CA3AF),
          foregroundColor: Colors.white,
          disabledForegroundColor: Colors.white70,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            if (showChevron) ...[
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, size: 22),
            ],
          ],
        ),
      ),
    );
  }
}

class _CustomerAddressCard extends StatelessWidget {
  const _CustomerAddressCard({
    required this.address,
    required this.canOpenMap,
    required this.onViewMap,
  });

  final String address;
  final bool canOpenMap;
  final VoidCallback onViewMap;

  @override
  Widget build(BuildContext context) {
    return _WhiteCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFFDBEAFE),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.location_on_rounded, color: Color(0xFF2563EB), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Customer Address',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  address,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    height: 1.4,
                    color: const Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: canOpenMap ? onViewMap : null,
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF126B43),
              side: BorderSide(
                color: canOpenMap ? const Color(0xFF86EFAC) : const Color(0xFFE5E7EB),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            ),
            icon: const Icon(Icons.map_outlined, size: 16),
            label: Text(
              'View on Map',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderItemsSummaryCard extends StatelessWidget {
  const _OrderItemsSummaryCard({
    required this.totalItems,
    required this.itemsTotal,
    required this.onTap,
  });

  final int totalItems;
  final int itemsTotal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: _WhiteCard(
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(Icons.format_list_bulleted_rounded, size: 18, color: Color(0xFF126B43)),
                  const SizedBox(width: 8),
                  Text(
                    'Order Items',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '$totalItems Items',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF126B43),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 52,
                      height: 52,
                      color: const Color(0xFFF3F4F6),
                      child: const Icon(Icons.shopping_bag_rounded, color: Color(0xFF6B7280), size: 26),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Grocery Pack',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$totalItems items • ₹$itemsTotal',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderTimelineCard extends StatelessWidget {
  const _OrderTimelineCard({
    required this.assignedTime,
    required this.waitingTime,
    required this.pickedUp,
    required this.delivered,
  });

  final String assignedTime;
  final String waitingTime;
  final bool pickedUp;
  final bool delivered;

  @override
  Widget build(BuildContext context) {
    return _WhiteCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 18, color: Color(0xFF126B43)),
              const SizedBox(width: 8),
              Text(
                'Order Timeline',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _TimelineStep(
            title: 'Order Assigned',
            subtitle: 'You have been assigned a new order',
            trailing: assignedTime,
            done: true,
            active: false,
            isLast: false,
          ),
          _TimelineStep(
            title: 'Waiting for Pickup',
            subtitle: 'Go to the store and scan the pickup QR.',
            trailing: waitingTime,
            done: pickedUp,
            active: !pickedUp,
            isLast: false,
          ),
          _TimelineStep(
            title: 'Picked Up',
            subtitle: null,
            trailing: pickedUp ? waitingTime : 'Pending',
            done: false,
            active: false,
            isLast: false,
            pending: !pickedUp,
          ),
          _TimelineStep(
            title: 'Delivered',
            subtitle: null,
            trailing: 'Pending',
            done: delivered,
            active: false,
            isLast: true,
            pending: true,
          ),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    required this.trailing,
    required this.done,
    required this.active,
    required this.isLast,
    this.subtitle,
    this.pending = false,
  });

  final String title;
  final String? subtitle;
  final String trailing;
  final bool done;
  final bool active;
  final bool isLast;
  final bool pending;

  @override
  Widget build(BuildContext context) {
    final green = const Color(0xFF126B43);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: done || active ? green : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: done || active ? green : const Color(0xFFD1D5DB),
                      width: 2,
                    ),
                  ),
                  child: done
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: done ? green : const Color(0xFFE5E7EB),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: pending ? const Color(0xFF9CA3AF) : const Color(0xFF111827),
                          ),
                        ),
                        if (subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            subtitle!,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Text(
                    trailing,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: pending ? const Color(0xFF9CA3AF) : const Color(0xFF374151),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
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
    return _WhiteCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Suggested route · ${stops.length} deliveries',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF111827),
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
                    color: selected ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAF9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: selected ? const Color(0xFF126B43) : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor:
                            selected ? const Color(0xFF126B43) : const Color(0xFF94A3B8),
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
                        child: Text(
                          '#${s.orderNumber} · ${s.customerName}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
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

class _BottomActions extends StatelessWidget {
  const _BottomActions({
    required this.isUnlocked,
    required this.proofPending,
    required this.customerNavStarted,
    required this.otpVerified,
    required this.onItemProof,
    required this.onNavigateCustomer,
    required this.onCaptureProof,
    required this.onComplete,
    this.onFailed,
    this.hasDeliveryProof = false,
  });

  final bool isUnlocked;
  final bool proofPending;
  final bool customerNavStarted;
  final bool otpVerified;
  final VoidCallback onItemProof;
  final VoidCallback onNavigateCustomer;
  final VoidCallback onCaptureProof;
  final VoidCallback onComplete;
  final VoidCallback? onFailed;
  final bool hasDeliveryProof;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    String label;
    IconData icon;
    VoidCallback? onTap;
    if (!isUnlocked) {
      if (proofPending) {
        label = 'Waiting for Manager';
        icon = Icons.hourglass_top_rounded;
        onTap = null;
      } else {
        label = 'Take Item Proof';
        icon = Icons.camera_alt_rounded;
        onTap = onItemProof;
      }
    } else if (!hasDeliveryProof && !customerNavStarted) {
      label = 'Navigate to Customer';
      icon = Icons.navigation_rounded;
      onTap = onNavigateCustomer;
    } else if (!hasDeliveryProof) {
      label = 'Capture Delivery Proof';
      icon = Icons.photo_camera_outlined;
      onTap = onCaptureProof;
    } else if (!otpVerified) {
      label = 'Enter OTP & Complete';
      icon = Icons.pin_outlined;
      onTap = onComplete;
    } else {
      label = 'Complete Delivery';
      icon = Icons.check_circle_outline_rounded;
      onTap = onComplete;
    }

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottom),
      color: Colors.white,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PrimaryActionBtn(
            label: label,
            icon: icon,
            enabled: onTap != null,
            onTap: onTap ?? () {},
            showChevron: true,
          ),
          if (isUnlocked &&
              onFailed != null &&
              (customerNavStarted || hasDeliveryProof)) ...[
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
                child: Text(
                  'Delivery Failed',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WhiteCard extends StatelessWidget {
  const _WhiteCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}
