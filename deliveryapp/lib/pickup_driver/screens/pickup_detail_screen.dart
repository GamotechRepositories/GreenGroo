import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../pickup_driver_service.dart';
import '../pickup_flow.dart';
import '../pickup_push_service.dart';
import '../widgets/pickup_items.dart';
import '../widgets/pickup_ui.dart';
import 'farmer_qr_scan_screen.dart';
import 'pickup_batch_screen.dart';

const _maxPhotos = 4;
const _maxPhotoChars = 2500000;

/// One pickup order, step by step — mirrors vendor `DriverPickupPage`.
class PickupDetailScreen extends StatefulWidget {
  const PickupDetailScreen({super.key, required this.pickupId, this.initialQr});

  final String pickupId;

  /// Farmer QR already scanned from the home screen; verified once loaded.
  final String? initialQr;

  @override
  State<PickupDetailScreen> createState() => _PickupDetailScreenState();
}

class _PickupDetailScreenState extends State<PickupDetailScreen> {
  final _svc = PickupDriverService.instance;
  final _qrController = TextEditingController();

  Map<String, dynamic>? _pickup;
  String _error = '';
  bool _busy = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load().then((_) {
      final qr = widget.initialQr?.trim() ?? '';
      if (qr.isNotEmpty && mounted && _pickup != null) _verifyQr(qr);
    });
    _timer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (!_busy) _load(silent: true);
    });
    PickupPushService.instance.refreshTick.addListener(_onPush);
  }

  void _onPush() {
    if (!_busy) _load(silent: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    PickupPushService.instance.refreshTick.removeListener(_onPush);
    _qrController.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    try {
      final p = await _svc.getPickup(widget.pickupId);
      if (!mounted) return;
      setState(() {
        _pickup = p;
        if (!silent) _error = '';
      });
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      if (!silent || _pickup == null) {
        setState(() => _error = pickupErrorText(e));
      }
    }
  }

  Future<bool> _run(
    Future<Map<String, dynamic>> Function() fn,
    String okMessage,
  ) async {
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      final payload = await fn();
      if (!mounted) return false;
      final next = payload['status'] != null
          ? payload
          : (payload['pickup'] is Map
              ? Map<String, dynamic>.from(payload['pickup'] as Map)
              : payload);
      setState(() => _pickup = next.isEmpty ? _pickup : next);
      showPickupSnack(context, okMessage);
      return true;
    } catch (e) {
      if (!mounted) return false;
      if (await handlePickupAuthError(context, e)) return false;
      setState(() => _error = pickupErrorText(e));
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String get _id => str(_pickup?['id']).isNotEmpty
      ? str(_pickup!['id'])
      : widget.pickupId;

  Future<void> _reject() async {
    final reasonCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Reject this pickup?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'It will go back to the vendor to assign another driver.',
              style: pickupText(13, color: PickupColors.muted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLength: 300,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Reason (optional)',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reject',
                style: TextStyle(color: Color(0xFFDC2626))),
          ),
        ],
      ),
    );
    final reason = reasonCtrl.text.trim();
    reasonCtrl.dispose();
    if (confirmed != true || !mounted) return;
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await _svc.reject(_id, reason: reason);
      if (!mounted) return;
      showPickupSnack(context, 'Pickup rejected and sent back to the vendor.');
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      setState(() {
        _busy = false;
        _error = pickupErrorText(e);
      });
    }
  }

  Future<void> _verifyQr(String value) async {
    final v = value.trim();
    if (v.isEmpty) return;
    if (needsAcceptance(_pickup)) {
      final ok = await _run(() => _svc.accept(_id), 'Pickup accepted.');
      if (!ok || !mounted) return;
    }
    const steps = <String, (String, String)>{
      'DRIVER_ASSIGNED': ('start', 'Left for pickup.'),
      'PICKUP_SCHEDULED': ('start', 'Left for pickup.'),
      'DISPATCHED': ('arrive', 'Reached the farm.'),
      'DRIVER_ARRIVED': ('check', 'Order checked.'),
    };
    for (var i = 0; i < 3; i++) {
      final before = str(_pickup?['status']);
      final step = steps[before];
      if (step == null) break;
      final ok = await _run(
        () => switch (step.$1) {
          'start' => _svc.start(_id),
          'arrive' => _svc.arrive(_id),
          _ => _svc.checkOrder(_id),
        },
        step.$2,
      );
      if (!ok || !mounted) return;
      if (str(_pickup?['status']) == before) break;
    }
    final ok = await _run(
        () => _svc.verifyQr(_id, v), 'QR Verified Successfully');
    if (!ok || !mounted) return;
    _qrController.clear();
    await _showVerifiedItems();
  }

  Future<void> _showVerifiedItems() async {
    final p = _pickup;
    if (p == null) return;
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(ctx).height * 0.85),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Icon(Icons.verified_rounded,
                        color: PickupColors.brand, size: 28),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('QR verified — check the items',
                          style: pickupText(17, weight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${pickupOrderId(p)} · ${str(p['farmerName'])}\nMatch every item, grade and weight with the farmer before confirming.',
                  style: pickupText(12.5, color: PickupColors.muted),
                ),
                const SizedBox(height: 12),
                PickupItemsTable(pickup: p),
                const SizedBox(height: 16),
                PickupButton(
                  label: 'Items match — confirm pickup',
                  icon: Icons.photo_camera_outlined,
                  onPressed: () => Navigator.pop(ctx, true),
                ),
                const SizedBox(height: 8),
                PickupButton(
                  label: 'Later',
                  outlined: true,
                  onPressed: () => Navigator.pop(ctx, false),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (confirm == true && mounted) await _openConfirm();
  }

  Future<void> _scanQr() async {
    final value = await Navigator.of(context).push(pickupRoute<String>(
      FarmerQrScanScreen(orderLabel: pickupOrderId(_pickup ?? const {})),
    ));
    if (value != null && value.isNotEmpty && mounted) await _verifyQr(value);
  }

  Future<void> _openConfirm() async {
    final p = _pickup!;
    final photos = await showModalBottomSheet<List<String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ConfirmPickupSheet(pickup: p),
    );
    if (photos == null || photos.isEmpty || !mounted) return;
    await _run(() => _svc.confirm(_id, photos),
        'Pickup confirmed. Status is PICKED UP.');
  }

  Future<void> _call(String mobile) async {
    final uri = Uri(scheme: 'tel', path: mobile);
    if (!await launchUrl(uri) && mounted) {
      showPickupSnack(context, 'Could not open dialer', error: true);
    }
  }

  Future<void> _openMap(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null ||
        !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) showPickupSnack(context, 'Could not open map', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _pickup;
    return Scaffold(
      backgroundColor: PickupColors.page,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text(
          p == null ? 'Pickup' : 'Order ${pickupOrderId(p)}',
          style: pickupText(16, weight: FontWeight.w800),
        ),
      ),
      body: p == null
          ? Center(
              child: _error.isNotEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(20),
                      child: ErrorBanner(_error),
                    )
                  : const CircularProgressIndicator(
                      color: PickupColors.brand),
            )
          : RefreshIndicator(
              color: PickupColors.brand,
              onRefresh: _load,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                children: _content(p),
              ),
            ),
    );
  }

  List<Widget> _content(Map<String, dynamic> p) {
    final status = str(p['status']);
    final mustDecide = needsAcceptance(p);
    final canStart = !mustDecide &&
        (status == 'DRIVER_ASSIGNED' || status == 'PICKUP_SCHEDULED');
    final canArrive = status == 'DISPATCHED';
    final canCheck = status == 'DRIVER_ARRIVED';
    final canScan = !mustDecide && farmScanStatuses.contains(status);
    final canConfirm = status == 'QR_VERIFIED' &&
        p['qrVerified'] == true &&
        p['pickupConfirmed'] != true;
    final transit = canTransit(p);
    final canArriveCentre = status == 'IN_TRANSIT';
    final live = pickupLiveLabel(p);
    final next = driverNextStep(p);
    final batchId = str(p['collectionBatchId']);
    final mobile = str(p['farmerMobile']);
    final mapsUrl = str(p['mapsUrl']);
    final unit = str(p['unit']);
    final photos = (p['confirmationPhotos'] is List)
        ? (p['confirmationPhotos'] as List).map(str).where((s) => s.isNotEmpty).toList()
        : <String>[];
    const gap = SizedBox(height: 14);

    return [
      Align(alignment: Alignment.centerLeft, child: StatusChip(live)),
      const SizedBox(height: 8),
      Text(
        '${str(p['farmerName'])} · ${str(p['productName'])}',
        style: pickupText(14, color: PickupColors.muted),
      ),
      if (_error.isNotEmpty) ...[gap, ErrorBanner(_error)],
      if (mustDecide) ...[
        gap,
        PickupCard(
          color: const Color(0xFFFFF7ED),
          borderColor: const Color(0xFFFB923C),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('New pickup assigned to you',
                  style: pickupText(16, weight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(
                'Check the details and items below, then accept to start this pickup or reject to send it back to the vendor.',
                style: pickupText(12.5, color: PickupColors.muted),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: PickupButton(
                      label: 'Reject',
                      icon: Icons.close_rounded,
                      outlined: true,
                      onPressed: _busy ? null : _reject,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: PickupButton(
                      label: 'Accept',
                      icon: Icons.check_rounded,
                      busy: _busy,
                      onPressed: () => _run(() => _svc.accept(_id),
                          'Pickup accepted. Tap "Left for pickup" when you leave.'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
      gap,
      PickupCard(
        color: PickupColors.brandSoft,
        borderColor: PickupColors.brand,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('YOUR CURRENT STATUS',
                style: pickupText(10,
                    weight: FontWeight.w800, color: PickupColors.brand)),
            const SizedBox(height: 4),
            Text(live, style: pickupText(17, weight: FontWeight.w800)),
            if (next != null) ...[
              const SizedBox(height: 4),
              Text('Next: ${next.label}',
                  style: pickupText(12.5,
                      weight: FontWeight.w700, color: PickupColors.brand)),
            ],
            const SizedBox(height: 4),
            Text(
              'Update the step below so farmer, manager and vendor can see what you are doing.',
              style: pickupText(12, color: PickupColors.muted),
            ),
            const SizedBox(height: 12),
            if (batchId.isNotEmpty) ...[
              Row(
                children: [
                  Text('Lot / Batch ID  ',
                      style: pickupText(11.5, color: PickupColors.muted)),
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).push(
                        pickupRoute<void>(PickupBatchScreen(batchId: batchId)),
                      ),
                      child: Text(
                        batchId,
                        overflow: TextOverflow.ellipsis,
                        style: pickupText(12.5,
                            weight: FontWeight.w800,
                            color: PickupColors.brand),
                      ),
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.copy_rounded,
                        size: 18, color: PickupColors.brand),
                    onPressed: () => _copy(batchId),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              PickupButton(
                label: 'Show batch QR',
                icon: Icons.qr_code_2_rounded,
                onPressed: () =>
                    showBatchQr(context, batchId: batchId, record: p),
              ),
              const SizedBox(height: 8),
            ],
            PickupButton(
              label: 'Show order QR',
              icon: Icons.qr_code_rounded,
              outlined: true,
              onPressed: () => showOrderQr(context, p),
            ),
          ],
        ),
      ),
      gap,
      PickupCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionTitle('Pickup progress'),
            PickupTimelineView(status: status),
          ],
        ),
      ),
      gap,
      PickupCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionTitle('Pickup details'),
            InfoGrid([
              InfoItem('Order ID', pickupOrderId(p), copy: true),
              InfoItem('Farmer Name', str(p['farmerName'])),
              InfoItem('Farmer Location', str(p['farmerLocation'])),
              InfoItem('Product', str(p['productName'])),
              InfoItem('Quantity', pickupQuantity(p)),
              InfoItem('Package Count', str(p['packageCount'])),
              InfoItem('Pickup Date/Time', pickupWhenText(p)),
              InfoItem(
                'Pickup Instructions',
                str(p['pickupInstructions']).isNotEmpty
                    ? str(p['pickupInstructions'])
                    : 'Follow farm access and packing notes.',
              ),
            ]),
            if (mobile.isNotEmpty || mapsUrl.isNotEmpty) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  if (mobile.isNotEmpty)
                    Expanded(
                      child: PickupButton(
                        label: 'Call Farmer',
                        icon: Icons.call_rounded,
                        outlined: true,
                        onPressed: () => _call(mobile),
                      ),
                    ),
                  if (mobile.isNotEmpty && mapsUrl.isNotEmpty)
                    const SizedBox(width: 10),
                  if (mapsUrl.isNotEmpty)
                    Expanded(
                      child: PickupButton(
                        label: 'View Location',
                        icon: Icons.map_outlined,
                        outlined: true,
                        onPressed: () => _openMap(mapsUrl),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
      gap,
      PickupCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionTitle('Items to collect'),
            if (canScan) ...[
              Text(
                'Check each item, grade and weight with the farmer, then scan the Farmer QR.',
                style: pickupText(12, color: PickupColors.muted),
              ),
              const SizedBox(height: 8),
            ],
            PickupItemsTable(pickup: p),
          ],
        ),
      ),
      if (canStart) ...[
        gap,
        PickupButton(
          label: 'Left for pickup — On the way',
          icon: Icons.local_shipping_outlined,
          busy: _busy,
          onPressed: () => _run(() => _svc.start(_id),
              'Left for pickup. Status is On the way to farm.'),
        ),
      ],
      if (canArrive) ...[
        gap,
        PickupButton(
          label: 'Reached the farm',
          icon: Icons.agriculture_outlined,
          busy: _busy,
          onPressed: () =>
              _run(() => _svc.arrive(_id), 'Reached the farm.'),
        ),
      ],
      if (status == 'DRIVER_ARRIVED' ||
          status == 'ORDER_VERIFIED' ||
          status == 'QR_VERIFIED') ...[
        gap,
        Text('Driver has arrived at pickup location.',
            style: pickupText(13.5,
                weight: FontWeight.w700, color: PickupColors.brand)),
      ],
      if (canCheck ||
          const {
            'ORDER_VERIFIED',
            'QR_VERIFIED',
            'PICKED_UP',
            'IN_TRANSIT',
            'ARRIVED_AT_CENTRE'
          }.contains(status)) ...[
        gap,
        PickupCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle('Order verification'),
              InfoGrid([
                InfoItem('Order ID', pickupOrderId(p), copy: true),
                InfoItem('Farmer Name', str(p['farmerName'])),
                InfoItem('Product Name', str(p['productName'])),
                InfoItem('Variety', str(p['variety'])),
                InfoItem('Grade', str(p['grade'])),
                InfoItem('Ordered Quantity',
                    '${str(p['orderedQuantity'])} $unit'.trim()),
                InfoItem('Packed Quantity',
                    '${str(p['packedQuantity'])} $unit'.trim()),
                InfoItem('Package Count', str(p['packageCount'])),
                InfoItem('Pickup Location', str(p['farmerLocation'])),
              ]),
              if (canCheck) ...[
                const SizedBox(height: 14),
                PickupButton(
                  label: 'Check Order',
                  icon: Icons.fact_check_outlined,
                  busy: _busy,
                  onPressed: () => _run(() => _svc.checkOrder(_id),
                      'Order checked. Scan Farmer QR next.'),
                ),
              ],
            ],
          ),
        ),
      ],
      if (canScan) ...[
        gap,
        PickupCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle('Scan Farmer QR'),
              Text(
                status == 'ORDER_VERIFIED'
                    ? 'Scan the QR shown by the farmer to verify this order.'
                    : 'At the farm? Scanning the Farmer QR marks you as reached, checks the order and verifies the QR in one step.',
                style: pickupText(12, color: PickupColors.muted),
              ),
              const SizedBox(height: 10),
              PickupButton(
                label: 'Open camera & scan',
                icon: Icons.qr_code_scanner_rounded,
                busy: _busy,
                onPressed: _scanQr,
              ),
              const SizedBox(height: 12),
              Text('Or paste the scanned Farmer QR value:',
                  style: pickupText(12, color: PickupColors.muted)),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _qrController,
                      enabled: !_busy,
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: 'Paste Farmer QR',
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 100,
                    child: PickupButton(
                      label: 'Verify',
                      busy: _busy,
                      onPressed: () => _verifyQr(_qrController.text),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
      if (const {'QR_VERIFIED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_CENTRE'}
          .contains(status)) ...[
        gap,
        PickupCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle('Order summary'),
              InfoGrid([
                InfoItem('Order ID', pickupOrderId(p), copy: true),
                InfoItem('Farmer', str(p['farmerName'])),
                InfoItem('Product', str(p['productName'])),
                InfoItem('Quantity', pickupQuantity(p)),
                InfoItem('Package Count', str(p['packageCount'])),
                InfoItem('Driver', str(p['driverName'])),
                InfoItem('Vehicle Number', str(p['vehicleNumber'])),
                if (batchId.isNotEmpty)
                  InfoItem('Lot / Batch ID', batchId, copy: true),
              ]),
              if (canConfirm) ...[
                const SizedBox(height: 14),
                PickupButton(
                  label: 'Confirm order pickup',
                  icon: Icons.photo_camera_outlined,
                  busy: _busy,
                  onPressed: _openConfirm,
                ),
              ],
              if (p['pickupConfirmed'] == true) ...[
                const SizedBox(height: 12),
                Text('Pickup confirmed from farmer.',
                    style: pickupText(13.5,
                        weight: FontWeight.w700, color: PickupColors.brand)),
              ],
              if (photos.isNotEmpty) ...[
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 6,
                  crossAxisSpacing: 6,
                  children: [for (final src in photos) PhotoThumb(src)],
                ),
              ],
            ],
          ),
        ),
      ],
      if (transit) ...[
        gap,
        PickupButton(
          label: 'On the way to centre',
          icon: Icons.local_shipping_outlined,
          busy: _busy,
          onPressed: () =>
              _run(() => _svc.transit(_id), 'On the way to centre.'),
        ),
      ],
      if (canArriveCentre) ...[
        gap,
        PickupButton(
          label: 'Reached collection centre',
          icon: Icons.warehouse_outlined,
          busy: _busy,
          onPressed: () =>
              _run(() => _svc.arriveCentre(_id), 'At collection centre.'),
        ),
      ],
      if (status == 'ARRIVED_AT_CENTRE') ...[
        gap,
        Text('At collection centre. Waiting for centre receiving.',
            style: pickupText(13.5,
                weight: FontWeight.w700, color: PickupColors.brand)),
      ],
      if (isPickupFinished(p)) ...[
        gap,
        Text('Received at collection centre.',
            style: pickupText(13.5,
                weight: FontWeight.w700, color: PickupColors.brand)),
      ],
    ];
  }

  void _copy(String value) {
    Clipboard.setData(ClipboardData(text: value));
    showPickupSnack(context, 'Copied $value');
  }
}

/// Thumbnail for a data-URL or http photo.
class PhotoThumb extends StatelessWidget {
  const PhotoThumb(this.src, {super.key, this.onRemove});

  final String src;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    Widget image;
    if (src.startsWith('data:image/')) {
      final comma = src.indexOf(',');
      try {
        image = Image.memory(base64Decode(src.substring(comma + 1)),
            fit: BoxFit.cover);
      } catch (_) {
        image = const ColoredBox(color: PickupColors.page);
      }
    } else {
      image = Image.network(src,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) =>
              const ColoredBox(color: PickupColors.page));
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Stack(
        fit: StackFit.expand,
        children: [
          image,
          if (onRemove != null)
            Positioned(
              top: 2,
              right: 2,
              child: InkWell(
                onTap: onRemove,
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(3),
                  child: const Icon(Icons.close, size: 14, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// "Confirm Pickup" sheet: summary + 1–4 photos. Pops with data-URL photos.
class _ConfirmPickupSheet extends StatefulWidget {
  const _ConfirmPickupSheet({required this.pickup});
  final Map<String, dynamic> pickup;

  @override
  State<_ConfirmPickupSheet> createState() => _ConfirmPickupSheetState();
}

class _ConfirmPickupSheetState extends State<_ConfirmPickupSheet> {
  final _picker = ImagePicker();
  final List<String> _photos = [];
  bool _picking = false;

  Future<void> _add(ImageSource source) async {
    if (_photos.length >= _maxPhotos || _picking) return;
    setState(() => _picking = true);
    try {
      final file = await _picker.pickImage(
        source: source,
        imageQuality: 72,
        maxWidth: 1280,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      final lower = file.name.toLowerCase();
      final mime = file.mimeType ??
          (lower.endsWith('.png')
              ? 'image/png'
              : lower.endsWith('.webp')
                  ? 'image/webp'
                  : 'image/jpeg');
      final dataUrl = 'data:$mime;base64,${base64Encode(bytes)}';
      if (dataUrl.length >= _maxPhotoChars) {
        if (mounted) {
          showPickupSnack(context, 'Photo is too large. Try again.',
              error: true);
        }
        return;
      }
      if (mounted) setState(() => _photos.add(dataUrl));
    } catch (e) {
      if (mounted) {
        showPickupSnack(context, 'Could not get photo: ${pickupErrorText(e)}',
            error: true);
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.pickup;
    final full = _photos.length >= _maxPhotos;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            20, 16, 20, 16 + MediaQuery.viewInsetsOf(context).bottom),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Confirm Pickup',
                  style: pickupText(17, weight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('Confirm that you have received this order from the farmer?',
                  style: pickupText(13, color: PickupColors.muted)),
              const SizedBox(height: 14),
              InfoGrid([
                InfoItem('Order ID', pickupOrderId(p)),
                InfoItem('Farmer', str(p['farmerName'])),
                InfoItem('Product', str(p['productName'])),
                InfoItem('Quantity',
                    '${str(p['packedQuantity'])} ${str(p['unit'])}'.trim()),
                InfoItem('Package Count', str(p['packageCount'])),
                InfoItem('Driver', str(p['driverName'])),
                InfoItem('Vehicle Number', str(p['vehicleNumber'])),
              ]),
              const SizedBox(height: 16),
              Text('Pickup photos (${_photos.length}/$_maxPhotos)',
                  style: pickupText(13, weight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text('Take a live photo of the goods (at least 1, up to 4).',
                  style: pickupText(12, color: PickupColors.muted)),
              const SizedBox(height: 10),
              if (_photos.isNotEmpty) ...[
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 6,
                  crossAxisSpacing: 6,
                  children: [
                    for (var i = 0; i < _photos.length; i++)
                      PhotoThumb(
                        _photos[i],
                        onRemove: () => setState(() => _photos.removeAt(i)),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
              ],
              Row(
                children: [
                  Expanded(
                    child: PickupButton(
                      label: 'Take photo',
                      icon: Icons.photo_camera_outlined,
                      outlined: true,
                      busy: _picking,
                      onPressed: full ? null : () => _add(ImageSource.camera),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: PickupButton(
                      label: 'Gallery',
                      icon: Icons.photo_library_outlined,
                      outlined: true,
                      onPressed: full || _picking
                          ? null
                          : () => _add(ImageSource.gallery),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: PickupButton(
                      label: 'Cancel',
                      outlined: true,
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: PickupButton(
                      label: 'Confirm Pickup',
                      onPressed: _photos.isEmpty
                          ? null
                          : () => Navigator.pop(context, List<String>.from(_photos)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
