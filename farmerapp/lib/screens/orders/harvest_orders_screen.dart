import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import 'order_detail_screen.dart';

class HarvestOrdersScreen extends StatefulWidget {
  const HarvestOrdersScreen({super.key});

  @override
  State<HarvestOrdersScreen> createState() => _HarvestOrdersScreenState();
}

class _HarvestOrdersScreenState extends State<HarvestOrdersScreen> {
  String _selectedProduct = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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

  String _shortDate(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final s = raw.trim();
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

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allOrders = FarmerState().orders;

        // Filter all completed/harvested orders
        final completedOrders = allOrders.where((o) {
          final s = o.status.toUpperCase();
          return s.contains('COMPLET') || s.contains('DELIVER') || s.contains('PAID') || s.contains('HARVEST');
        }).toList();

        // Also extract unique product names
        final productNames = <String>{};
        for (final o in completedOrders) {
          final name = o.productName.isNotEmpty ? o.productName : o.cropName;
          if (name.isNotEmpty) productNames.add(name);
        }

        // Apply product & search filter
        final filteredList = completedOrders.where((o) {
          final name = o.productName.isNotEmpty ? o.productName : o.cropName;
          if (_selectedProduct != 'ALL' && name != _selectedProduct) {
            return false;
          }
          if (_searchQuery.trim().isNotEmpty) {
            final q = _searchQuery.toLowerCase().trim();
            final hay = '${o.productName} ${o.cropName} ${o.variety} ${o.orderCode} ${o.id}'.toLowerCase();
            if (!hay.contains(q)) return false;
          }
          return true;
        }).toList();

        // Calculate summary statistics
        final totalHarvestQty = filteredList.fold<double>(0.0, (sum, o) => sum + (o.quantity > 0 ? o.quantity : o.orderedQuantity));
        final totalHarvestValue = filteredList.fold<double>(0.0, (sum, o) => sum + (o.totalAmount > 0 ? o.totalAmount : (o.quantity * o.rate)));

        return Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF1F2937)),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Harvest Orders (काढणी ऑर्डर्स)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                ),
                Text(
                  'All Completed Orders & Harvest Records',
                  style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Summary Stats Bar
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'COMPLETED ORDERS',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF065F46), letterSpacing: 0.3),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${filteredList.length} Orders',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                            ),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 28, color: const Color(0xFFA7F3D0)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'TOTAL HARVEST',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF065F46), letterSpacing: 0.3),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${totalHarvestQty.toStringAsFixed(0)} Kg',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                            ),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 28, color: const Color(0xFFA7F3D0)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'TOTAL VALUE',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF065F46), letterSpacing: 0.3),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '₹${totalHarvestValue.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 2. Filter & Search Row
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      // Search TextField
                      TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: const TextStyle(fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Search produce, order ID, variety...',
                          hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                          prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 16),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                          ),
                        ),
                      ),
                      if (productNames.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _ProductChip(
                                label: 'All (${completedOrders.length})',
                                isSelected: _selectedProduct == 'ALL',
                                onSelected: () => setState(() => _selectedProduct = 'ALL'),
                              ),
                              ...productNames.map((p) {
                                final count = completedOrders.where((o) => (o.productName.isNotEmpty ? o.productName : o.cropName) == p).length;
                                return _ProductChip(
                                  label: '$p ($count)',
                                  isSelected: _selectedProduct == p,
                                  onSelected: () => setState(() => _selectedProduct = p),
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 3. Harvest Orders List
                if (filteredList.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F0EA),
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: const Icon(Icons.check_circle_outline, size: 40, color: Color(0xFF217346)),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'No completed harvest orders found',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1F2937)),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Completed orders will be listed here.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredList.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = filteredList[index];
                      return _CompletedHarvestCard(
                        order: order,
                        onCopy: _copyToClipboard,
                        shortDate: _shortDate,
                        formatTime: _formatTime12h,
                      );
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ProductChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  const _ProductChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: onSelected,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF217346) : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? const Color(0xFF217346) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : const Color(0xFF374151),
            ),
          ),
        ),
      ),
    );
  }
}

class _CompletedHarvestCard extends StatelessWidget {
  final FarmerOrderItem order;
  final void Function(String, String) onCopy;
  final String Function(String?) shortDate;
  final String Function(String?) formatTime;

  const _CompletedHarvestCard({
    required this.order,
    required this.onCopy,
    required this.shortDate,
    required this.formatTime,
  });

  @override
  Widget build(BuildContext context) {
    // Build Grade rows
    final gradeRows = <Map<String, dynamic>>[];
    if (order.gradeAQty > 0) {
      gradeRows.add({
        'label': 'Grade A',
        'qty': order.gradeAQty,
        'rate': order.gradeARate > 0 ? order.gradeARate : order.rate,
        'bg': const Color(0xFFECFDF5),
        'text': const Color(0xFF065F46),
      });
    }
    if (order.gradeBQty > 0) {
      gradeRows.add({
        'label': 'Grade B',
        'qty': order.gradeBQty,
        'rate': order.gradeBRate > 0 ? order.gradeBRate : (order.rate * 0.4).roundToDouble(),
        'bg': const Color(0xFFEFF6FF),
        'text': const Color(0xFF1E40AF),
      });
    }
    if (order.gradeCQty > 0) {
      gradeRows.add({
        'label': 'Grade C',
        'qty': order.gradeCQty,
        'rate': order.gradeCRate,
        'bg': const Color(0xFFFFFBEB),
        'text': const Color(0xFF92400E),
      });
    }

    if (gradeRows.isEmpty) {
      gradeRows.add({
        'label': 'Grade A',
        'qty': order.quantity,
        'rate': order.rate > 0 ? order.rate : 30.0,
        'bg': const Color(0xFFECFDF5),
        'text': const Color(0xFF065F46),
      });
    }

    final totalQty = order.quantity > 0 ? order.quantity : order.orderedQuantity;
    final totalVal = order.totalAmount > 0 ? order.totalAmount : (totalQty * (order.rate > 0 ? order.rate : 30));

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
          // Row 1: Left (Product Name & Variety) | Center (Order ID) | Right (Status)
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

              // Center: Order ID Badge (tappable to copy)
              Expanded(
                flex: 5,
                child: Center(
                  child: InkWell(
                    onTap: () => onCopy(order.orderCode, 'Order ID'),
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(5),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Text(
                  'Completed',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Row 2: Schedule (Order Date, Pickup Date, Pickup Slot)
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
                        'HARVEST / ORDER',
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
                          shortDate(order.createdAt.isNotEmpty ? order.createdAt : order.pickupDate),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
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
                          shortDate(order.pickupDate),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
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
                          formatTime(order.pickupSlot),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Row 3: Grade Table
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                Container(
                  color: const Color(0xFFE8F0EA),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  child: const Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text('GRADE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text('QTY', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text('RATE', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, thickness: 1, color: Color(0xFFC5D4C8)),
                ...gradeRows.map((g) {
                  final label = g['label'] as String;
                  final qty = g['qty'] as double;
                  final rate = g['rate'] as double;
                  final bg = g['bg'] as Color;

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: bg,
                      border: const Border(bottom: BorderSide(color: Color(0xFFE5E7EB), width: 0.5)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            qty > 0 ? '${qty.toStringAsFixed(0)} ${order.unit}' : '—',
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
                            rate > 0 ? '₹${rate.toStringAsFixed(0)}' : '—',
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

          // Row 4: Total Summary & View Details Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TOTAL DISPATCHED',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)),
                  ),
                  Text(
                    '${totalQty.toStringAsFixed(0)} ${order.unit} (₹${totalVal.toStringAsFixed(0)})',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF217346)),
                  ),
                ],
              ),
              SizedBox(
                height: 34,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1F2937),
                    side: const BorderSide(color: Color(0xFFD4D4D4)),
                    backgroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
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
                  child: const Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
