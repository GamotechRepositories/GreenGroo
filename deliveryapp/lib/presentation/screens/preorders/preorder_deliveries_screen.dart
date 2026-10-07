import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/socket_service.dart';
import '../../../utils/map_navigation.dart';
import '../active_delivery/pickup_qr_scan_screen.dart';
import '../fulltime/fulltime_widgets.dart';

/// Every pre-order the Delivery Manager assigned to this rider. The rider scans the QR on
/// each bag at the store to see that customer's address; once an order is delivered its
/// customer phone and address disappear from the list.
class PreOrderDeliveriesScreen extends StatefulWidget {
  const PreOrderDeliveriesScreen({super.key});

  @override
  State<PreOrderDeliveriesScreen> createState() => _PreOrderDeliveriesScreenState();
}

class _PreOrderDeliveriesScreenState extends State<PreOrderDeliveriesScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _store;
  Map<String, dynamic> _summary = const {};
  List<Map<String, dynamic>> _orders = const [];
  StreamSubscription<Map<String, dynamic>>? _deliverySub;
  Timer? _refreshDebounce;

  @override
  void initState() {
    super.initState();
    _load();
    _deliverySub = SocketService.instance.onActiveDeliveryUpdated.listen((_) {
      _refreshDebounce?.cancel();
      _refreshDebounce = Timer(const Duration(milliseconds: 400), () {
        if (mounted) _load(silent: true);
      });
    });
  }

  @override
  void dispose() {
    _deliverySub?.cancel();
    _refreshDebounce?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    final data = await OrderService.instance.fetchPreOrders();
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (data == null) {
        if (!silent) _error = 'Could not load your pre-orders.';
        return;
      }
      _error = null;
      _store = data['store'] is Map ? Map<String, dynamic>.from(data['store'] as Map) : null;
      _summary = data['summary'] is Map ? Map<String, dynamic>.from(data['summary'] as Map) : const {};
      _orders = (data['orders'] as List? ?? const [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    });
  }

  Future<void> _scanBags() async {
    final unlocked = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => const PickupQrScanScreen(orderId: '', orderNumber: '', preOrderBatch: true),
      ),
    );
    if (mounted) {
      await _load(silent: true);
      if (unlocked == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Addresses unlocked for the scanned orders.'),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    }
  }

  Future<void> _deliver(Map<String, dynamic> order) async {
    await Navigator.pushNamed(context, AppRoutes.activeDelivery, arguments: order['id']?.toString());
    if (mounted) _load(silent: true);
  }

  Future<void> _call(String phone) async {
    if (phone.isEmpty) return;
    await launchUrl(Uri(scheme: 'tel', path: phone));
  }

  Future<void> _navigate(Map<String, dynamic> order) async {
    await openMapsNavigation(
      destLat: (order['customerLat'] as num?)?.toDouble(),
      destLng: (order['customerLng'] as num?)?.toDouble(),
      fallbackAddress: order['customerAddress']?.toString() ?? '',
    );
  }

  int _n(String key) => (_summary[key] as num?)?.toInt() ?? 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: fullTimeAppBar('Pre-order deliveries', onRefresh: _load),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? FtErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(onRefresh: _load, child: _content()),
    );
  }

  Widget _content() {
    final toScan = _orders.where((o) => o['status'] == 'assigned').toList();
    final onTheWay = _orders
        .where((o) => o['status'] == 'out_for_delivery' || o['status'] == 'pickup_verified')
        .toList();
    final done = _orders.where((o) => o['delivered'] == true || o['failed'] == true).toList();
    final total = _n('total');
    final delivered = _n('delivered');

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        FtSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                total == 0
                    ? 'No pre-orders assigned'
                    : '$total pre-order${total == 1 ? '' : 's'} assigned to you',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              if (_store != null) ...[
                const SizedBox(height: 2),
                Text(
                  'Collect at ${_store!['name'] ?? 'the dark store'}'
                  '${(_store!['address'] ?? '').toString().isNotEmpty ? ' · ${_store!['address']}' : ''}',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
              if (total > 0) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: total == 0 ? 0 : delivered / total,
                    minHeight: 8,
                    backgroundColor: AppColors.border,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$delivered delivered · ${_n('outForDelivery')} on the way · ${_n('toScan')} to scan'
                  '${_n('failed') > 0 ? ' · ${_n('failed')} failed' : ''}',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                'Pre-orders are salary-based — no per-km amount is added to your wallet.',
                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
        if (toScan.isNotEmpty) ...[
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton.icon(
              onPressed: _scanBags,
              icon: const Icon(Icons.qr_code_scanner_rounded),
              label: Text('Scan order QRs (${toScan.length} left)'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            ),
          ),
          const SizedBox(height: 14),
        ],
        if (total == 0)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 36),
            child: Center(
              child: Text(
                'You will get a notification when your Delivery Manager assigns pre-orders to you.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted),
              ),
            ),
          ),
        if (onTheWay.isNotEmpty) ...[
          _SectionTitle('Out for delivery (${onTheWay.length})'),
          ...onTheWay.map(
            (o) => _UnlockedTile(
              order: o,
              onCall: () => _call(o['customerPhone']?.toString() ?? ''),
              onNavigate: () => _navigate(o),
              onDeliver: () => _deliver(o),
            ),
          ),
        ],
        if (toScan.isNotEmpty) ...[
          _SectionTitle('At the store — scan to see address (${toScan.length})'),
          ...toScan.map((o) => _LockedTile(order: o)),
        ],
        if (done.isNotEmpty) ...[
          _SectionTitle('Finished today (${done.length})'),
          ...done.map((o) => _DoneTile(order: o)),
        ],
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 6, 2, 8),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

String _paymentLine(Map<String, dynamic> o) {
  final amount = (o['amountToCollect'] as num?) ?? 0;
  if (o['paymentStatus'] == 'paid_online' || amount <= 0) return 'Paid online';
  return 'Collect ${formatRupees(amount)} cash';
}

class _OrderHeader extends StatelessWidget {
  const _OrderHeader({required this.order, required this.status, required this.statusColor});
  final Map<String, dynamic> order;
  final String status;
  final Color statusColor;

  @override
  Widget build(BuildContext context) {
    final slot = (order['preOrderSlot'] ?? '').toString();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '#${order['orderNumber'] ?? ''}',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Text(
              status,
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: statusColor),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          [
            if (slot.isNotEmpty) 'Slot $slot',
            '${order['itemCount'] ?? 0} items',
            _paymentLine(order),
          ].join(' · '),
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
        ),
      ],
    );
  }
}

class _LockedTile extends StatelessWidget {
  const _LockedTile({required this.order});
  final Map<String, dynamic> order;

  @override
  Widget build(BuildContext context) {
    return FtSectionCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _OrderHeader(order: order, status: 'Scan QR', statusColor: AppColors.warning),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.lock_outline_rounded, size: 16, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Scan the QR on this order\'s bag to see the customer\'s address and number.',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _UnlockedTile extends StatelessWidget {
  const _UnlockedTile({
    required this.order,
    required this.onCall,
    required this.onNavigate,
    required this.onDeliver,
  });
  final Map<String, dynamic> order;
  final VoidCallback onCall;
  final VoidCallback onNavigate;
  final VoidCallback onDeliver;

  @override
  Widget build(BuildContext context) {
    final name = order['customerName']?.toString() ?? '';
    final phone = order['customerPhone']?.toString() ?? '';
    final address = order['customerAddress']?.toString() ?? '';
    return FtSectionCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _OrderHeader(order: order, status: 'Out for delivery', statusColor: AppColors.primary),
          const SizedBox(height: 10),
          Text(
            name.isEmpty ? 'Customer' : name,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          if (phone.isNotEmpty)
            Text(phone, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
          if (address.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(address, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              if (phone.isNotEmpty) ...[
                OutlinedButton.icon(
                  onPressed: onCall,
                  icon: const Icon(Icons.call_rounded, size: 16),
                  label: const Text('Call'),
                ),
                const SizedBox(width: 8),
              ],
              OutlinedButton.icon(
                onPressed: onNavigate,
                icon: const Icon(Icons.navigation_rounded, size: 16),
                label: const Text('Map'),
              ),
              const Spacer(),
              FilledButton(
                onPressed: onDeliver,
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text('Deliver'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DoneTile extends StatelessWidget {
  const _DoneTile({required this.order});
  final Map<String, dynamic> order;

  @override
  Widget build(BuildContext context) {
    final failed = order['failed'] == true;
    final at = DateTime.tryParse(order['deliveredAt']?.toString() ?? '')?.toLocal();
    final time = at == null
        ? ''
        : ' at ${at.hour % 12 == 0 ? 12 : at.hour % 12}:${at.minute.toString().padLeft(2, '0')} ${at.hour < 12 ? 'AM' : 'PM'}';
    return Opacity(
      opacity: 0.75,
      child: FtSectionCard(
        padding: const EdgeInsets.all(14),
        child: _OrderHeader(
          order: order,
          status: failed ? 'Failed' : 'Delivered$time',
          statusColor: failed ? AppColors.error : AppColors.success,
        ),
      ),
    );
  }
}
