import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/skeleton_loader.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import 'harvest_orders_screen.dart';
import 'order_detail_screen.dart';
import 'order_prepare_screen.dart';
import '../main_shell.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const List<Map<String, String>> _tabs = [
    {'key': 'all', 'label': 'All Orders', 'marathi': 'सर्व'},
    {'key': 'new', 'label': 'New Orders', 'marathi': 'नवीन'},
    {'key': 'accepted', 'label': 'Accepted', 'marathi': 'स्वीकारलेले'},
    {'key': 'preparing', 'label': 'Preparing', 'marathi': 'तयारी'},
    {'key': 'ready', 'label': 'Ready for Pickup', 'marathi': 'पिकअप तयार'},
    {'key': 'completed', 'label': 'Completed', 'marathi': 'पूर्ण'},
    {'key': 'rejected', 'label': 'Rejected', 'marathi': 'नाकारलेले'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool _matchesFilter(FarmerOrderItem order, String filterKey) {
    final s = order.status.toUpperCase();
    if (s == 'DELETED' || s == 'DELETED_ORDER') return false;
    if (filterKey == 'all') return true;
    switch (filterKey) {
      case 'new':
        return s == 'NEW' || s.contains('NEW') || s.contains('CONFIRMED');
      case 'accepted':
        return s == 'ACCEPTED' || s == 'ACCEPT';
      case 'preparing':
        return s == 'PREPARING' || s == 'PACKING' || s.contains('PREPAR') || s.contains('PACK');
      case 'ready':
        return s.contains('READY') || s.contains('DRIVER') || s.contains('DISPATCH') || s == 'ORDER_VERIFIED' || s == 'QR_VERIFIED';
      case 'completed':
        return s.contains('COMPLET') ||
            s.contains('DELIVER') ||
            s.contains('TRANSIT') ||
            s.contains('CENTRE') ||
            s.contains('CENTER') ||
            s.contains('RECEIV') ||
            s == 'PICKED_UP';
      case 'rejected':
        return s.contains('REJECT') || s.contains('CANCEL');
      default:
        return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allOrders = FarmerState().orders.where((order) {
          final status = order.status.trim().toUpperCase();
          return status != 'DELETED' && status != 'DELETED_ORDER';
        }).toList();

        return Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.menu, color: Color(0xFF217346)),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text(
              'Farmer Orders (ऑर्डर्स)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
            ),
            actions: [
              TextButton.icon(
                icon: const Icon(Icons.assignment_outlined, size: 16, color: Color(0xFF217346)),
                label: const Text(
                  'Harvest Batches',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF217346)),
                ),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const HarvestOrdersScreen()));
                },
              ),
              const SizedBox(width: 4),
            ],
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: const Color(0xFF217346),
              unselectedLabelColor: const Color(0xFF6B7280),
              indicatorColor: const Color(0xFF217346),
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              tabs: _tabs.map((tab) {
                final count = allOrders.where((o) => _matchesFilter(o, tab['key']!)).length;
                return Tab(
                  text: '${tab['label']} ($count)',
                );
              }).toList(),
            ),
          ),
          body: SafeArea(
            child: TabBarView(
              controller: _tabController,
              children: _tabs.map((tab) {
                final filtered = allOrders.where((o) => _matchesFilter(o, tab['key']!)).toList();

                if (filtered.isEmpty) {
                  if (allOrders.isEmpty && !FarmerState().ordersReady) {
                    return const OrderListSkeleton();
                  }
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F0EA),
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: const Icon(Icons.shopping_bag_outlined, size: 40, color: Color(0xFF217346)),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'No ${tab['label']?.toLowerCase()}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1F2937)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Orders in this status will appear here.',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final order = filtered[index];
                    return _OrderMobileCard(order: order);
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

class _OrderMobileCard extends StatefulWidget {
  final FarmerOrderItem order;

  const _OrderMobileCard({required this.order});

  @override
  State<_OrderMobileCard> createState() => _OrderMobileCardState();
}

class _OrderMobileCardState extends State<_OrderMobileCard> {
  bool _isBusy = false;

  String _shortDate(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final s = raw.trim();
    // If format is like "07/09/2026, Monday", extract the date part first
    final clean = s.contains(',') ? s.split(',')[0].trim() : s;
    if (RegExp(r'^\d{1,2}/\d{1,2}/\d{2,4}$').hasMatch(clean)) {
      return clean;
    }
    if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(clean)) {
      final parts = clean.substring(0, 10).split('-');
      return '${parts[2]}/${parts[1]}/${parts[0]}';
    }
    final d = DateTime.tryParse(clean);
    if (d != null) {
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    }
    return clean;
  }

  String _formatTime12h(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final s = raw.trim();
    if (s.toLowerCase().contains('am') || s.toLowerCase().contains('pm')) {
      return s.toUpperCase();
    }
    final match = RegExp(r'^(\d{1,2}):(\d{2})(?::\d{2})?$').firstMatch(s);
    if (match != null) {
      int hour = int.tryParse(match.group(1)!) ?? 0;
      final min = match.group(2)!;
      final period = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour == 0) hour = 12;
      return '$hour:$min $period';
    }
    return s;
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard'),
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF217346),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final s = status.toUpperCase();
    Color bg;
    Color text;
    Color border;
    String label;

    if (s.contains('NEW') || s.contains('CONFIRMED')) {
      bg = const Color(0xFFFEF3C7);
      text = const Color(0xFF92400E);
      border = const Color(0xFFFDE68A);
      label = 'New';
    } else if (s.contains('ACCEPT')) {
      bg = const Color(0xFFD1FAE5);
      text = const Color(0xFF065F46);
      border = const Color(0xFFA7F3D0);
      label = 'Accepted';
    } else if (s.contains('PREPAR') || s.contains('PACK')) {
      bg = const Color(0xFFDBEAFE);
      text = const Color(0xFF1E40AF);
      border = const Color(0xFFBFDBFE);
      label = 'Preparing';
    } else if (s.contains('READY')) {
      bg = const Color(0xFFE0E7FF);
      text = const Color(0xFF3730A3);
      border = const Color(0xFFC7D2FE);
      label = 'Ready for Pickup';
    } else if (s.contains('COMPLET') || s.contains('DELIVER') || s.contains('PAID')) {
      bg = const Color(0xFFD1FAE5);
      text = const Color(0xFF065F46);
      border = const Color(0xFFA7F3D0);
      label = 'Completed';
    } else if (s.contains('REJECT') || s.contains('CANCEL')) {
      bg = const Color(0xFFFEE2E2);
      text = const Color(0xFF991B1B);
      border = const Color(0xFFFECACA);
      label = 'Rejected';
    } else {
      bg = const Color(0xFFF3F4F6);
      text = const Color(0xFF374151);
      border = const Color(0xFFE5E7EB);
      label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: text),
      ),
    );
  }

  void _showAcceptDialog() {
    final order = widget.order;
    final messenger = ScaffoldMessenger.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Accept order?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Text(
          'Confirm acceptance of this ${order.productName} order (${order.quantity.toStringAsFixed(0)} ${order.unit})?',
          style: const TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.muted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF217346),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isBusy = true);
              try {
                await FarmerState().acceptOrder(order.id);
                if (!mounted) return;
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('तुम्ही ${order.quantity.toStringAsFixed(0)} ${order.unit} ${order.productName} चा order स्वीकारला आहात'),
                    backgroundColor: const Color(0xFF217346),
                  ),
                );
              } catch (e) {
                if (!mounted) return;
                messenger.showSnackBar(
                  SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                );
              } finally {
                if (mounted) setState(() => _isBusy = false);
              }
            },
            child: const Text('Confirm Accept'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog() {
    final order = widget.order;
    final messenger = ScaffoldMessenger.of(context);
    String selectedReason = 'Stock Unavailable';
    final reasons = [
      'Stock Unavailable',
      'Quality Issue',
      'Pickup Issue',
      'Quantity Mismatch',
      'Other',
    ];
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Reject Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Rejection reason *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFFD4D4D4)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: selectedReason,
                      items: reasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedReason = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  selectedReason == 'Other' ? 'Other reason *' : 'Optional note',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: noteController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: selectedReason == 'Other' ? 'Enter the reason...' : 'Add any additional note...',
                    hintStyle: const TextStyle(fontSize: 12, color: AppColors.muted),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.all(10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD4D4D4))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD4D4D4))),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.muted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                if (selectedReason == 'Other' && noteController.text.trim().isEmpty) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Please enter the other reason')),
                  );
                  return;
                }
                Navigator.pop(ctx);
                setState(() => _isBusy = true);
                try {
                  await FarmerState().rejectOrder(
                    order.id,
                    reason: selectedReason,
                    note: noteController.text.trim(),
                  );
                  if (!mounted) return;
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Order rejected'), backgroundColor: Color(0xFFDC2626)),
                  );
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                  );
                } finally {
                  if (mounted) setState(() => _isBusy = false);
                }
              },
              child: const Text('Confirm Reject'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final s = order.status.toUpperCase();
    final canAccept = s.contains('NEW') || s.contains('CONFIRMED');
    final canReject = s.contains('NEW') || s.contains('CONFIRMED');
    final canPrepare = s.contains('ACCEPT') || s.contains('PREPAR') || s.contains('PACK');

    // Same grade lines as the order View screen.
    double cardQty(double graded, double shown) => graded > 0 ? graded : shown;
    double cardRate(double graded, double shown, [double fallback = 0]) {
      if (graded > 0) return graded;
      if (shown > 0) return shown;
      return fallback;
    }

    final gradeAQty = cardQty(order.gradeAQty, order.shownAQty);
    final gradeBQty = cardQty(order.gradeBQty, order.shownBQty);
    final gradeCQty = cardQty(order.gradeCQty, order.shownCQty);
    final gradeRows = <Map<String, dynamic>>[
      {
        'label': 'Grade A',
        'qty': gradeAQty > 0 ? gradeAQty : (gradeBQty <= 0 && gradeCQty <= 0 ? order.quantity : 0),
        'rate': cardRate(order.gradeARate, order.shownARate, order.rate),
        'bg': const Color(0xFFECFDF5),
        'head': const Color(0xFFD1FAE5),
        'border': const Color(0xFFA7F3D0),
        'text': const Color(0xFF065F46),
      },
      {
        'label': 'Grade B',
        'qty': gradeBQty,
        'rate': cardRate(order.gradeBRate, order.shownBRate),
        'bg': const Color(0xFFEFF6FF),
        'head': const Color(0xFFDBEAFE),
        'border': const Color(0xFFBFDBFE),
        'text': const Color(0xFF1E40AF),
      },
      {
        'label': 'Grade C',
        'qty': gradeCQty,
        'rate': cardRate(order.gradeCRate, order.shownCRate),
        'bg': const Color(0xFFFFFBEB),
        'head': const Color(0xFFFEF3C7),
        'border': const Color(0xFFFDE68A),
        'text': const Color(0xFF92400E),
      },
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Single Row: Left (Product Name & Variety) | Center (Order ID) | Right (Status Badge)
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left: Product Name & Variety
              Expanded(
                flex: 4,
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: order.productName.isNotEmpty ? order.productName : 'Product',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      if (order.variety.isNotEmpty)
                        TextSpan(
                          text: ' · ${order.variety}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                    ],
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: 4),

              // Center: Full Order ID Badge (tappable to copy)
              Expanded(
                flex: 5,
                child: Center(
                  child: InkWell(
                    onTap: () => _copyToClipboard(order.orderCode, 'Order ID'),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                order.orderCode,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF065F46),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 3),
                          const Icon(Icons.copy_rounded, size: 10, color: Color(0xFF065F46)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),

              // Right: Status Badge
              _buildStatusBadge(order.status),
            ],
          ),
          const SizedBox(height: 8),

          // Row 3: Structured Schedule Details (Order Date, Pickup Date, Pickup Time)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ORDER DATE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7280),
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _shortDate(order.createdAt.isNotEmpty ? order.createdAt : order.pickupDate),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 24, color: const Color(0xFFE5E7EB)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PICKUP DATE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7280),
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _shortDate(order.pickupDate),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 24, color: const Color(0xFFE5E7EB)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PICKUP TIME',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7280),
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _formatTime12h(order.pickupSlot),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Row 4: Grade Breakdown Table (Exact Excel design from web OrdersPage.jsx)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                // Table header
                Container(
                  color: const Color(0xFFE8F0EA),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  child: const Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(
                          'GRADE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'QTY',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'RATE',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, thickness: 1, color: Color(0xFFC5D4C8)),

                // Table Rows
                ...gradeRows.map((g) {
                  final label = g['label'] as String;
                  final qty = g['qty'] as double;
                  final rate = g['rate'] as double;
                  final bg = g['bg'] as Color;

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: bg,
                      border: const Border(
                        bottom: BorderSide(color: Color(0xFFE5E7EB), width: 0.5),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Text(
                            label,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            qty > 0 ? '${qty.toStringAsFixed(0)} ${order.unit}' : '0 ${order.unit}',
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: qty > 0 ? const Color(0xFF217346) : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            qty > 0 && rate > 0 ? '₹${rate.toStringAsFixed(0)}' : '—',
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: rate > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Row 5: Action buttons (View, Accept, Reject, Prep)
          Row(
            children: [
              // View Button
              Expanded(
                child: SizedBox(
                  height: 36,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF1F2937),
                      side: const BorderSide(color: Color(0xFFD4D4D4)),
                      backgroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(orderId: order.id),
                        ),
                      );
                    },
                    child: const Text(
                      'View',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),

              // Accept Button (if new)
              if (canAccept) ...[
                const SizedBox(width: 6),
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      onPressed: _isBusy ? null : _showAcceptDialog,
                      child: const Text(
                        'Accept',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],

              // Reject Button (if new)
              if (canReject) ...[
                const SizedBox(width: 6),
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFDC2626),
                        side: const BorderSide(color: Color(0xFFFECACA)),
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      onPressed: _isBusy ? null : _showRejectDialog,
                      child: const Text(
                        'Reject',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],

              // Prep Button (if accepted / preparing / packing)
              if (canPrepare) ...[
                const SizedBox(width: 6),
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF217346),
                        side: const BorderSide(color: Color(0xFF217346)),
                        backgroundColor: const Color(0xFFECFDF5),
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => OrderPrepareScreen(orderId: order.id),
                          ),
                        );
                      },
                      child: const Text(
                        'Prep',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
