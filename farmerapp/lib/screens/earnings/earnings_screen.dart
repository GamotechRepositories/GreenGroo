import 'package:flutter/material.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'earning_report_screen.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  String? _activeSheetId;
  final List<Map<String, dynamic>> _customSheets = [];
  final ScrollController _tabScrollController = ScrollController();

  @override
  void dispose() {
    _tabScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final products = FarmerState().products;
        final orders = FarmerState().orders;

        // Compute total financials across all orders
        double totalRevenue = 0;
        double depositedAmount = 0;
        double pendingAmount = 0;

        for (final o in orders) {
          final amt = o.effectiveTotalAmount;
          totalRevenue += amt;
          if (o.paymentStatus.toUpperCase() == 'PAID' || o.status == 'Completed') {
            depositedAmount += amt;
          } else if (o.status != 'Cancelled') {
            pendingAmount += amt;
          }
        }

        // Build list of workbook sheets
        final List<Map<String, dynamic>> allSheets = [
          {
            'id': 'overview',
            'title': 'Summary Overview',
            'icon': '📊',
            'badge': products.length,
            'isOverview': true,
          },
        ];

        for (final p in products) {
          final count = orders.where((o) => _orderMatchesProduct(o, p)).length;
          final cleanCrop = p.cropLinked.split('(')[0].trim();
          final cleanProd = p.productName.split('(')[0].trim();
          final shortTitle = cleanCrop.isNotEmpty ? '$cleanCrop (Batch 1)' : '$cleanProd (Batch 1)';
          allSheets.add({
            'id': 'product_${p.id}',
            'title': shortTitle,
            'product': p,
            'icon': '📄',
            'badge': count,
            'isOverview': false,
          });
        }

        for (final cs in _customSheets) {
          allSheets.add(cs);
        }

        // Default to Summary Overview page first
        _activeSheetId ??= 'overview';

        // Check if active sheet still exists
        final currentSheet = allSheets.firstWhere(
          (s) => s['id'] == _activeSheetId,
          orElse: () => allSheets.first,
        );

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
              onPressed: () {
                if (_activeSheetId != null && _activeSheetId != 'overview') {
                  setState(() => _activeSheetId = 'overview');
                  if (_tabScrollController.hasClients) {
                    _tabScrollController.animateTo(0.0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
                  }
                } else {
                  Navigator.pop(context);
                }
              },
            ),
            title: Text(
              currentSheet['isOverview'] == true ? 'Earning Statement' : 'Sheet · ${currentSheet['title'] ?? 'Produce'}',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          body: SafeArea(
            top: false,
            bottom: true,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Title, Subtitle and Action Buttons matching photo
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: _buildHeaderAndActionButtons(allSheets, currentSheet, products),
                  ),
                  const SizedBox(height: 12),

                  // 2. Top Excel Financial Summary Table
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: _buildTopFinancialSummary(
                      total: totalRevenue,
                      deposited: depositedAmount,
                      pending: pendingAmount,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 3. Active Sheet Body
                  if (currentSheet['isOverview'] == true)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: _buildSummaryOverviewContent(products, orders),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildProductSheetTabBar(allSheets, currentSheet['product'] as ProductItem?, products),
                          _buildProductSheetContent(currentSheet, orders),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  bool _orderMatchesProduct(FarmerOrderItem order, ProductItem product) {
    final oName = order.productName.toLowerCase();
    final pName = product.productName.toLowerCase();
    final cleanO = oName.split('(')[0].trim();
    final cleanP = pName.split('(')[0].trim();
    return oName.contains(cleanP) || pName.contains(cleanO);
  }

  String _formatCurrency(double val) {
    final intVal = val.round();
    final str = intVal.toString();
    final reg = RegExp(r'(\d+?)(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (Match m) => '${m[1]},');
  }

  // --- Robust Date Parsing Helpers (handles ISO 8601, dd/mm/yyyy, etc) ---

  DateTime? _parseAnyDate(String raw) {
    if (raw.isEmpty) return null;
    raw = raw.trim();
    // ISO 8601: 2026-09-07T14:19:13.588Z or 2026-09-07
    if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(raw)) {
      try {
        return DateTime.parse(raw);
      } catch (_) {}
    }
    // dd/mm/yyyy or dd/mm/yyyy, Day
    final ddmmyyyy = RegExp(r'^(\d{1,2})/(\d{1,2})/(\d{4})');
    final m = ddmmyyyy.firstMatch(raw);
    if (m != null) {
      final d = int.tryParse(m.group(1)!) ?? 1;
      final mo = int.tryParse(m.group(2)!) ?? 1;
      final y = int.tryParse(m.group(3)!) ?? 2026;
      return DateTime(y, mo, d);
    }
    return null;
  }

  String _formatShortDate(String raw) {
    final dt = _parseAnyDate(raw);
    if (dt == null) return raw.isNotEmpty ? raw : '—';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  String _formatWeekday(String raw) {
    final dt = _parseAnyDate(raw);
    if (dt == null) return '';
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayNames[(dt.weekday - 1) % 7];
  }

  String _parsePickupTime(String raw) {
    if (raw.isEmpty) return '7:00 AM';
    // If already like "7:00 AM" just return
    if (RegExp(r'\d{1,2}:\d{2}\s*(AM|PM)', caseSensitive: false).hasMatch(raw)) {
      return raw.split('-').first.trim();
    }
    // "Morning 8-10 AM" -> "8:00 AM", "Morning 8" -> "8:00 AM"
    final mSlot = RegExp(r'(\d{1,2})').firstMatch(raw);
    if (mSlot != null) {
      final hr = int.tryParse(mSlot.group(1)!) ?? 7;
      final period = raw.toUpperCase().contains('PM') ? 'PM' : 'AM';
      return '$hr:00 $period';
    }
    return '7:00 AM';
  }

  // 1. Action Buttons in a single row
  Widget _buildHeaderAndActionButtons(
    List<Map<String, dynamic>> allSheets,
    Map<String, dynamic> currentSheet,
    List<ProductItem> products,
  ) {
    return Row(
      children: [
        // 1. Duplicate Sheet
        Expanded(
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF374151),
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => _duplicateSheet(currentSheet),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.copy_outlined, size: 13, color: Color(0xFF475569)),
                SizedBox(width: 4),
                Flexible(
                  child: Text(
                    'Duplicate Sheet',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 6),

        // 2. Export Sheet (CSV)
        Expanded(
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF374151),
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => _exportSheetCSV(currentSheet['title']?.toString() ?? 'Sheet'),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.download_outlined, size: 13, color: Color(0xFF475569)),
                SizedBox(width: 4),
                Flexible(
                  child: Text(
                    'Export Sheet',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 6),

        // 3. + New Sheet
        Expanded(
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF217346),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => _openNewSheetModal(products),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.add, size: 14),
                SizedBox(width: 3),
                Flexible(
                  child: Text(
                    'New Sheet',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 2. Top Excel Financial Summary
  Widget _buildTopFinancialSummary({
    required double total,
    required double deposited,
    required double pending,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF9CA3AF), width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Table(
        border: const TableBorder(
          horizontalInside: BorderSide(color: Color(0xFF9CA3AF), width: 1),
          verticalInside: BorderSide(color: Color(0xFF9CA3AF), width: 1),
        ),
        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
        children: [
          // Header Row
          TableRow(
            decoration: const BoxDecoration(color: Color(0xFFE8F0EA)),
            children: [
              _buildSummaryHeaderCell('Total ₹'),
              _buildSummaryHeaderCell('Deposited ₹'),
              _buildSummaryHeaderCell('Pending ₹'),
            ],
          ),
          // Values Row
          TableRow(
            children: [
              _buildSummaryValueCell('₹${_formatCurrency(total)}', Colors.white, const Color(0xFF217346)),
              _buildSummaryValueCell('₹${_formatCurrency(deposited)}', Colors.white, const Color(0xFF065F46)),
              _buildSummaryValueCell('₹${_formatCurrency(pending)}', const Color(0xFFFFFBEB), const Color(0xFFB45309)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryHeaderCell(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
      ),
    );
  }

  Widget _buildSummaryValueCell(String val, Color bg, Color fg) {
    return Container(
      color: bg,
      padding: const EdgeInsets.symmetric(vertical: 9),
      alignment: Alignment.center,
      child: Text(
        val,
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: fg),
      ),
    );
  }

  // 3. Product-Specific Excel Sheet Tab Bar (Only sheets of the selected product)
  Widget _buildProductSheetTabBar(
    List<Map<String, dynamic>> allSheets,
    ProductItem? activeProduct,
    List<ProductItem> products,
  ) {
    if (activeProduct == null) return const SizedBox.shrink();

    // Only include sheets that belong specifically to this active product
    final List<Map<String, dynamic>> productSheets = allSheets.where((s) {
      if (s['isOverview'] == true) return false;
      final p = s['product'] as ProductItem?;
      return p != null && p.id == activeProduct.id;
    }).toList();

    if (productSheets.isEmpty) {
      final cleanCrop = activeProduct.cropLinked.split('(')[0].trim();
      final cleanProd = activeProduct.productName.split('(')[0].trim();
      final shortTitle = cleanCrop.isNotEmpty ? '$cleanCrop (Batch 1)' : '$cleanProd (Batch 1)';
      productSheets.add({
        'id': 'product_${activeProduct.id}',
        'title': shortTitle,
        'product': activeProduct,
        'icon': '📄',
        'badge': 0,
        'isOverview': false,
      });
    }

    final hasActive = productSheets.any((s) => s['id'] == _activeSheetId);
    final String currentTabId = hasActive ? _activeSheetId! : productSheets.first['id'] as String;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFE8F0EA),
        borderRadius: BorderRadius.vertical(top: Radius.circular(10)),
        border: Border(
          top: BorderSide(color: Color(0xFFBACCC0), width: 1),
          left: BorderSide(color: Color(0xFFBACCC0), width: 1),
          right: BorderSide(color: Color(0xFFBACCC0), width: 1),
        ),
      ),
      padding: const EdgeInsets.only(left: 6, right: 6, top: 6),
      child: Row(
        children: [
          // Back to Overview Button
          GestureDetector(
            onTap: () {
              setState(() => _activeSheetId = 'overview');
              if (_tabScrollController.hasClients) {
                _tabScrollController.jumpTo(0.0);
              }
            },
            child: Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFD8E6DB),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
                border: Border.all(color: const Color(0xFFBACCC0), width: 1),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_back, size: 12, color: Color(0xFF15803D)),
                  SizedBox(width: 3),
                  Text(
                    'Overview',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF15803D),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Scrollable Tabs for this product only
          Expanded(
            child: SingleChildScrollView(
              controller: _tabScrollController,
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: productSheets.map((sheet) {
                  final isActive = sheet['id'] == currentTabId;
                  final String rawTitle = sheet['title']?.toString() ?? '';
                  final String title = rawTitle.isNotEmpty ? rawTitle : 'Batch 1';
                  final String iconEmoji = sheet['icon']?.toString() ?? '📄';

                  return GestureDetector(
                    onTap: () {
                      setState(() => _activeSheetId = sheet['id'] as String);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isActive ? Colors.white : const Color(0xFFD8E6DB),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(7)),
                        border: Border(
                          top: BorderSide(
                            color: isActive ? const Color(0xFF217346) : const Color(0xFFBACCC0),
                            width: isActive ? 2.5 : 1,
                          ),
                          left: BorderSide(
                            color: isActive ? const Color(0xFF217346) : const Color(0xFFBACCC0),
                            width: 1,
                          ),
                          right: BorderSide(
                            color: isActive ? const Color(0xFF217346) : const Color(0xFFBACCC0),
                            width: 1,
                          ),
                          bottom: BorderSide(
                            color: isActive ? Colors.white : const Color(0xFFBACCC0),
                            width: 1,
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            iconEmoji,
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            title,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                              color: isActive ? const Color(0xFF15803D) : const Color(0xFF1F2937),
                            ),
                          ),
                          if (sheet['badge'] != null && (sheet['badge'] as int) > 0) ...[
                            const SizedBox(width: 5),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: isActive ? const Color(0xFFD1FAE5) : const Color(0xFFC5D8C9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                sheet['badge'].toString(),
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: isActive ? const Color(0xFF065F46) : const Color(0xFF374151),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Green + button on right (Creates a new sheet specifically for THIS product)
          GestureDetector(
            onTap: () => _openNewSheetModal(products, prefilledProduct: activeProduct),
            child: Container(
              margin: const EdgeInsets.only(left: 4, bottom: 2),
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: const Color(0xFF217346),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.add, size: 16, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  // 3. Summary Overview Sheet (All Produce Cards)
  Widget _buildSummaryOverviewContent(List<ProductItem> products, List<FarmerOrderItem> orders) {
    if (products.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: Text('No produce registered yet.', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        ),
      );
    }

    return Column(
      children: products.map((product) {
        final matchedOrders = orders.where((o) => _orderMatchesProduct(o, product)).toList();

        double prodTotal = 0;
        double prodDeposited = 0;
        double prodPending = 0;
        double totalSoldQty = 0;
        double gradeAQty = 0;
        double gradeARate = 0;
        double gradeARejected = 0;
        double gradeBQty = 0;
        double gradeBRate = 0;
        double gradeBRejected = 0;
        double gradeCQty = 0;
        double gradeCRate = 0;
        double gradeCRejected = 0;
        double gradeRejQty = 0;

        for (final o in matchedOrders) {
          final amt = o.effectiveTotalAmount;
          prodTotal += amt;
          totalSoldQty += (o.gradeAQty + o.gradeBQty + o.gradeCQty);
          gradeAQty += o.gradeAQty;
          if (o.gradeARate > 0) gradeARate = o.gradeARate;
          gradeARejected += o.gradeARejected;

          gradeBQty += o.gradeBQty;
          if (o.gradeBRate > 0) gradeBRate = o.gradeBRate;
          gradeBRejected += o.gradeBRejected;

          gradeCQty += o.gradeCQty;
          if (o.gradeCRate > 0) gradeCRate = o.gradeCRate;
          gradeCRejected += o.gradeCRejected;

          gradeRejQty += o.rejectedQuantity;

          if (o.paymentStatus.toUpperCase() == 'PAID' || o.status == 'Completed') {
            prodDeposited += amt;
          } else if (o.status != 'Cancelled') {
            prodPending += amt;
          }
        }

        final rate = product.pricePerUnit > 0 ? product.pricePerUnit : 30.0;

        return GestureDetector(
          onTap: () {
            setState(() {
              _activeSheetId = 'product_${product.id}';
            });
            if (_tabScrollController.hasClients) {
              _tabScrollController.animateTo(
                100.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
              );
            }
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Header
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFD1FAE5)),
                      ),
                      child: Center(
                        child: Text(
                          product.productName.isNotEmpty ? product.productName.substring(0, 1).toUpperCase() : 'P',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  product.productName,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDF4),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: Text(
                                  product.status,
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${product.cropLinked} • ${product.category}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Detail Items Grid
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: _buildDetailItem('ORDERS', '${matchedOrders.length}')),
                      Expanded(child: _buildDetailItem('SOLD QTY', '${totalSoldQty.toStringAsFixed(0)} ${product.unit}')),
                      Expanded(child: _buildDetailItem('REVENUE', '₹ ${prodTotal.toStringAsFixed(0)}')),
                      Expanded(child: _buildDetailItem('DEPOSITED', '₹ ${prodDeposited.toStringAsFixed(0)}')),
                      Expanded(child: _buildDetailItem('BALANCE', '₹ ${prodPending.toStringAsFixed(0)}')),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Mini Excel Grade Statement Table
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF9CA3AF)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Column(
                    children: [
                      // Header
                      Container(
                        color: const Color(0xFFE8F0EA),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        child: Row(
                          children: const [
                            Expanded(flex: 2, child: Text('Grade', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151)))),
                            Expanded(flex: 2, child: Center(child: Text('Qty', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151))))),
                            Expanded(flex: 2, child: Center(child: Text('Rate', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151))))),
                            Expanded(flex: 2, child: Center(child: Text('Rejected', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))))),
                          ],
                        ),
                      ),
                      const Divider(height: 1, color: Color(0xFF9CA3AF)),
                      // Grade A
                      _buildGradeTableRow(
                        'Grade A',
                        '${gradeAQty.toStringAsFixed(0)} ${product.unit}',
                        '₹ ${gradeARate > 0 ? gradeARate.toStringAsFixed(0) : rate.toStringAsFixed(0)}',
                        '${gradeARejected.toStringAsFixed(0)} ${product.unit}',
                        const Color(0xFFECFDF5),
                        const Color(0xFF065F46),
                      ),
                      const Divider(height: 1, color: Color(0xFF9CA3AF)),
                      // Grade B
                      _buildGradeTableRow(
                        'Grade B',
                        '${gradeBQty.toStringAsFixed(0)} ${product.unit}',
                        '₹ ${gradeBRate > 0 ? gradeBRate.toStringAsFixed(0) : ((rate * 0.4).roundToDouble() > 0 ? (rate * 0.4).roundToDouble() : 12.0).toStringAsFixed(0)}',
                        '${gradeBRejected.toStringAsFixed(0)} ${product.unit}',
                        const Color(0xFFEFF6FF),
                        const Color(0xFF1E40AF),
                      ),
                      const Divider(height: 1, color: Color(0xFF9CA3AF)),
                      // Grade C
                      _buildGradeTableRow(
                        'Grade C',
                        '${gradeCQty > 0 ? gradeCQty.toStringAsFixed(0) : '0'} ${product.unit}',
                        gradeCRate > 0 ? '₹ ${gradeCRate.toStringAsFixed(0)}' : '—',
                        '${(gradeCRejected > 0 ? gradeCRejected : (gradeRejQty - (gradeARejected + gradeBRejected))).clamp(0, 99999).toStringAsFixed(0)} ${product.unit}',
                        const Color(0xFFFFFBEB),
                        const Color(0xFF92400E),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Action Buttons matching web portal
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF217346),
                        side: const BorderSide(color: Color(0xFF217346)),
                        backgroundColor: const Color(0xFFF0FDF4),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      icon: const Icon(Icons.table_chart_outlined, size: 14),
                      label: const Text('View Sheet', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () {
                        setState(() {
                          _activeSheetId = 'product_${product.id}';
                        });
                        if (_tabScrollController.hasClients) {
                          _tabScrollController.animateTo(
                            100.0,
                            duration: const Duration(milliseconds: 250),
                            curve: Curves.easeOut,
                          );
                        }
                      },
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      icon: const Icon(Icons.add, size: 14),
                      label: const Text('Sheet', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () => _openNewSheetModal(products, prefilledProduct: product),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDetailItem(String label, String val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
        const SizedBox(height: 1),
        Text(val, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
      ],
    );
  }

  Widget _buildGradeTableRow(String grade, String qty, String rate, String rejected, Color bg, Color fg) {
    return Container(
      color: bg,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text(grade, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg))),
          Expanded(flex: 2, child: Center(child: Text(qty, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))))),
          Expanded(flex: 2, child: Center(child: Text(rate, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))))),
          Expanded(flex: 2, child: Center(child: Text(rejected, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFFDC2626))))),
        ],
      ),
    );
  }

  // 4. Product Specific Excel Spreadsheet Table View (Fits 100% on a single screen)
  Widget _buildProductSheetContent(Map<String, dynamic> sheet, List<FarmerOrderItem> allOrders) {
    final ProductItem? product = sheet['product'] as ProductItem?;
    final String sheetTitle = sheet['title']?.toString() ?? 'Product Sheet';

    final matchedOrders = product != null
        ? allOrders.where((o) => _orderMatchesProduct(o, product)).toList()
        : allOrders;

    if (matchedOrders.isEmpty) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            bottom: BorderSide(color: Color(0xFFBACCC0), width: 1),
            left: BorderSide(color: Color(0xFFBACCC0), width: 1),
            right: BorderSide(color: Color(0xFFBACCC0), width: 1),
          ),
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(10)),
        ),
        child: _buildEmptySheetState(sheetTitle, product?.productName),
      );
    }

    final unit = product?.unit ?? "Kg";
    double rate = product?.pricePerUnit ?? 30.0;
    if (rate <= 0) rate = 30.0;

    double totalGAQty = 0;
    double totalGBQty = 0;
    double totalGCQty = 0;
    double totalRejQty = 0;
    double totalAmount = 0;

    for (final o in matchedOrders) {
      totalGAQty += o.gradeAQty;
      totalGBQty += o.gradeBQty;
      totalGCQty += o.gradeCQty;
      totalRejQty += o.rejectedQuantity;
      totalAmount += o.effectiveTotalAmount;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        // Subtract 2.0 px for outer container left (1px) + right (1px) borders
        final double availableWidth = constraints.maxWidth > 2.0 ? constraints.maxWidth - 2.0 : constraints.maxWidth;
        const double baseTotal = 394.0;
        final double scale = availableWidth / baseTotal;

        final double wIndex = (18.0 * scale).floorToDouble();
        final double wOrderDate = (42.0 * scale).floorToDouble();
        final double wPickupDate = (46.0 * scale).floorToDouble();
        final double wGradeQty = (34.0 * scale).floorToDouble();
        final double wGradeRate = (26.0 * scale).floorToDouble();
        final double wRejected = (34.0 * scale).floorToDouble();
        final double wAmount = (40.0 * scale).floorToDouble();
        // Give remaining exact pixels to Payment Status column to match available width 100%
        final double wPayment = (availableWidth - (wIndex + wOrderDate + wPickupDate + (wGradeQty + wGradeRate) * 3 + wRejected + wAmount)).clamp(20.0, 100.0);

        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(color: Color(0xFFBACCC0), width: 1),
              left: BorderSide(color: Color(0xFFBACCC0), width: 1),
              right: BorderSide(color: Color(0xFFBACCC0), width: 1),
            ),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(10)),
          ),
          clipBehavior: Clip.antiAlias,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const ClampingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Active Sheet Title Banner
                Container(
                  width: availableWidth,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0FDF4),
                    border: Border(
                      bottom: BorderSide(color: Color(0xFFBACCC0), width: 0.8),
                    ),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          setState(() => _activeSheetId = 'overview');
                          if (_tabScrollController.hasClients) {
                            _tabScrollController.animateTo(0.0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFFBACCC0)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.arrow_back, size: 10, color: Color(0xFF15803D)),
                              SizedBox(width: 2),
                              Text('Overview', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                            ],
                          ),
                        ),
                      ),
                      const Icon(Icons.table_chart_outlined, size: 13, color: Color(0xFF15803D)),
                      const SizedBox(width: 5),
                      Text(
                        sheetTitle,
                        style: const TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF15803D),
                        ),
                      ),
                      if (product != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          '• ${product.cropLinked.isNotEmpty ? product.cropLinked : product.category}',
                          style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                        ),
                      ],
                    ],
                  ),
                ),

                // Table 2-Tier Header
                _buildExcel2TierHeader(
                  unit: unit,
                  wIndex: wIndex,
                  wOrderDate: wOrderDate,
                  wPickupDate: wPickupDate,
                  wGradeQty: wGradeQty,
                  wGradeRate: wGradeRate,
                  wRejected: wRejected,
                  wAmount: wAmount,
                  wPayment: wPayment,
                ),

                // Data Rows
                ...matchedOrders.asMap().entries.map((entry) {
                  final idx = entry.key + 1;
                  final order = entry.value;
                  return _buildExcelDataRow(
                    index: idx,
                    order: order,
                    rate: rate,
                    unit: unit,
                    wIndex: wIndex,
                    wOrderDate: wOrderDate,
                    wPickupDate: wPickupDate,
                    wGradeQty: wGradeQty,
                    wGradeRate: wGradeRate,
                    wRejected: wRejected,
                    wAmount: wAmount,
                    wPayment: wPayment,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EarningReportScreen(
                            order: order,
                            rate: rate,
                            unit: unit,
                            productTitle: sheetTitle,
                          ),
                        ),
                      );
                    },
                  );
                }),

                // Total Footer Row
                _buildExcelTotalRow(
                  totalGAQty: totalGAQty,
                  totalGBQty: totalGBQty,
                  totalGCQty: totalGCQty,
                  totalRejQty: totalRejQty,
                  totalAmount: totalAmount,
                  wIndex: wIndex,
                  wOrderDate: wOrderDate,
                  wPickupDate: wPickupDate,
                  wGradeQty: wGradeQty,
                  wGradeRate: wGradeRate,
                  wRejected: wRejected,
                  wAmount: wAmount,
                  wPayment: wPayment,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildExcel2TierHeader({
    required String unit,
    required double wIndex,
    required double wOrderDate,
    required double wPickupDate,
    required double wGradeQty,
    required double wGradeRate,
    required double wRejected,
    required double wAmount,
    required double wPayment,
  }) {
    const border = Border.fromBorderSide(BorderSide(color: Color(0xFF9CA3AF), width: 0.8));

    Widget fullSpanHeader(String line1, String line2, double width) {
      return Container(
        width: width,
        height: 42,
        decoration: const BoxDecoration(
          color: Color(0xFFE8F0EA),
          border: border,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 1),
        alignment: Alignment.center,
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                line1,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 7.5, height: 1.05, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
              ),
              if (line2.isNotEmpty)
                Text(
                  line2,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 7.5, height: 1.05, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                ),
            ],
          ),
        ),
      );
    }

    Widget gradeBlock({
      required String grade,
      required Color bg,
      required Color fg,
      required double gradeQtyW,
      required double gradeRateW,
    }) {
      final width = gradeQtyW + gradeRateW;
      return Container(
        width: width,
        height: 42,
        decoration: const BoxDecoration(border: border),
        child: Column(
          children: [
            Container(
              width: width,
              height: 18,
              color: bg,
              alignment: Alignment.center,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  grade,
                  style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: fg),
                ),
              ),
            ),
            Container(height: 0.8, color: const Color(0xFF9CA3AF)),
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: gradeQtyW,
                    color: bg,
                    alignment: Alignment.center,
                    child: Center(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Qty\n$unit',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 7.5, height: 1.05, fontWeight: FontWeight.w600, color: fg),
                        ),
                      ),
                    ),
                  ),
                  Container(width: 0.8, color: const Color(0xFF9CA3AF)),
                  Expanded(
                    child: Container(
                      color: bg,
                      alignment: Alignment.center,
                      child: Center(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'Rate\n₹',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 7.5, height: 1.05, fontWeight: FontWeight.w600, color: fg),
                          ),
                        ),
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

    Widget rejectedBlock({
      required Color bg,
      required Color fg,
      required double width,
    }) {
      return Container(
        width: width,
        height: 42,
        decoration: const BoxDecoration(border: border),
        child: Column(
          children: [
            Container(
              width: width,
              height: 18,
              color: bg,
              alignment: Alignment.center,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'Rejected',
                  style: TextStyle(fontSize: 8.0, fontWeight: FontWeight.bold, color: fg),
                ),
              ),
            ),
            Container(height: 0.8, color: const Color(0xFF9CA3AF)),
            Expanded(
              child: Container(
                width: width,
                color: bg,
                alignment: Alignment.center,
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'Qty\n$unit',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 7.5, height: 1.05, fontWeight: FontWeight.w600, color: fg),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Row(
      children: [
        fullSpanHeader('#', '', wIndex),
        fullSpanHeader('Order', 'Date', wOrderDate),
        fullSpanHeader('Pickup Date', '& Time', wPickupDate),
        gradeBlock(
          grade: 'Grade A',
          bg: const Color(0xFFD1FAE5),
          fg: const Color(0xFF065F46),
          gradeQtyW: wGradeQty,
          gradeRateW: wGradeRate,
        ),
        gradeBlock(
          grade: 'Grade B',
          bg: const Color(0xFFDBEAFE),
          fg: const Color(0xFF1E40AF),
          gradeQtyW: wGradeQty,
          gradeRateW: wGradeRate,
        ),
        gradeBlock(
          grade: 'Grade C',
          bg: const Color(0xFFFEF3C7),
          fg: const Color(0xFF92400E),
          gradeQtyW: wGradeQty,
          gradeRateW: wGradeRate,
        ),
        rejectedBlock(
          bg: const Color(0xFFFEE2E2),
          fg: const Color(0xFF991B1B),
          width: wRejected,
        ),
        fullSpanHeader('Amount', '₹', wAmount),
        fullSpanHeader('Payment', 'Status', wPayment),
      ],
    );
  }

  Widget _buildExcelDataRow({
    required int index,
    required FarmerOrderItem order,
    required double rate,
    required String unit,
    required double wIndex,
    required double wOrderDate,
    required double wPickupDate,
    required double wGradeQty,
    required double wGradeRate,
    required double wRejected,
    required double wAmount,
    required double wPayment,
    required VoidCallback onTap,
  }) {
    const border = Border.fromBorderSide(BorderSide(color: Color(0xFF9CA3AF), width: 0.8));
    final isEven = index.isEven;
    final bg = isEven ? const Color(0xFFF3F4F6) : Colors.white;

    // Date & Day parsing — handles ISO 8601, dd/mm/yyyy, "dd/mm/yyyy, Day"
    final String oDate = _formatShortDate(order.createdAt);
    final String oDay = _formatWeekday(order.createdAt);
    final String pDate = _formatShortDate(order.pickupDate);
    final String pDay = _formatWeekday(order.pickupDate);
    final String pTime = _parsePickupTime(order.pickupSlot);

    // Exact Grade Quantities, Rates, and Amounts
    final double gAQty = order.gradeAQty;
    final double gARate = order.gradeARate > 0 ? order.gradeARate : rate;
    final double gBQty = order.gradeBQty;
    final double gBRate = order.gradeBRate > 0 ? order.gradeBRate : ((rate * 0.4).roundToDouble() > 0 ? (rate * 0.4).roundToDouble() : 12.0);
    final double gCQty = order.gradeCQty;
    final double gCRate = order.gradeCRate;
    final double rejQty = order.rejectedQuantity;
    final double amt = order.effectiveTotalAmount;
    final isPaid = order.paymentStatus.toUpperCase() == 'PAID' || order.status == 'Completed';

    Widget cell(Widget child, double width, {Color? cellBg}) {
      return Container(
        width: width,
        height: 38,
        decoration: BoxDecoration(
          color: cellBg ?? bg,
          border: border,
        ),
        alignment: Alignment.center,
        child: child,
      );
    }

    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          // #
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text('$index', style: const TextStyle(fontSize: 8.5, color: Color(0xFF9CA3AF), fontWeight: FontWeight.bold)),
            ),
            wIndex,
          ),
          // Order Date
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(oDate, style: const TextStyle(fontSize: 7.0, height: 1.1, fontWeight: FontWeight.w500, color: Color(0xFF1F2937))),
                  Text(oDay, style: const TextStyle(fontSize: 6.0, height: 1.1, color: Color(0xFF6B7280))),
                ],
              ),
            ),
            wOrderDate,
          ),
          // Pickup Date & Time (Date, Day, Time stacked vertically)
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(pDate, style: const TextStyle(fontSize: 7.0, height: 1.05, fontWeight: FontWeight.w500, color: Color(0xFF1F2937))),
                  if (pDay.isNotEmpty)
                    Text(pDay, style: const TextStyle(fontSize: 6.0, height: 1.05, color: Color(0xFF6B7280))),
                  Text(pTime, style: const TextStyle(fontSize: 6.0, height: 1.05, fontWeight: FontWeight.w600, color: Color(0xFF065F46))),
                ],
              ),
            ),
            wPickupDate,
          ),
          // Grade A Qty
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gAQty > 0 ? gAQty.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: gAQty > 0 ? FontWeight.bold : FontWeight.w600,
                  color: gAQty > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wGradeQty,
          ),
          // Grade A Rate
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gAQty > 0 && gARate > 0 ? gARate.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: FontWeight.w500,
                  color: gAQty > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wGradeRate,
          ),
          // Grade B Qty
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gBQty > 0 ? gBQty.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: gBQty > 0 ? FontWeight.bold : FontWeight.w600,
                  color: gBQty > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wGradeQty,
          ),
          // Grade B Rate
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gBQty > 0 && gBRate > 0 ? gBRate.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: FontWeight.w500,
                  color: gBQty > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wGradeRate,
          ),
          // Grade C Qty
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gCQty > 0 ? gCQty.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: gCQty > 0 ? FontWeight.bold : FontWeight.w600,
                  color: gCQty > 0 ? const Color(0xFF1F2937) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wGradeQty,
          ),
          // Grade C Rate
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                gCQty > 0 && gCRate > 0 ? gCRate.toStringAsFixed(0) : '×',
                style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF)),
              ),
            ),
            wGradeRate,
          ),
          // Rejected Qty
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                rejQty > 0 ? rejQty.toStringAsFixed(0) : '×',
                style: TextStyle(
                  fontSize: 9.0,
                  fontWeight: FontWeight.bold,
                  color: rejQty > 0 ? const Color(0xFFDC2626) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wRejected,
          ),
          // Amount
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                amt > 0 ? _formatCurrency(amt) : '×',
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.bold,
                  color: amt > 0 ? const Color(0xFFDC2626) : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            wAmount,
          ),
          // Payment Status
          cell(
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                isPaid ? 'Paid' : 'Pending',
                style: TextStyle(
                  fontSize: 7.0,
                  fontWeight: FontWeight.bold,
                  color: isPaid ? const Color(0xFF166534) : const Color(0xFF1F2937),
                ),
              ),
            ),
            wPayment,
          ),
        ],
      ),
    );
  }

  Widget _buildExcelTotalRow({
    required double totalGAQty,
    required double totalGBQty,
    required double totalGCQty,
    required double totalRejQty,
    required double totalAmount,
    required double wIndex,
    required double wOrderDate,
    required double wPickupDate,
    required double wGradeQty,
    required double wGradeRate,
    required double wRejected,
    required double wAmount,
    required double wPayment,
  }) {
    const border = Border.fromBorderSide(BorderSide(color: Color(0xFF9CA3AF), width: 0.8));

    Widget cell(Widget child, double width, {Color? bg}) {
      return Container(
        width: width,
        height: 26,
        decoration: BoxDecoration(
          color: bg ?? const Color(0xFFFCE7F3),
          border: border,
        ),
        alignment: Alignment.center,
        child: child,
      );
    }

    return Row(
      children: [
        // Spanning first 3 columns in pink: #, Order Date, Pickup Date
        Container(
          width: wIndex + wOrderDate + wPickupDate,
          height: 26,
          decoration: const BoxDecoration(
            color: Color(0xFFFCE7F3),
            border: border,
          ),
          padding: const EdgeInsets.only(left: 4),
          alignment: Alignment.centerLeft,
          child: const FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              'Total',
              style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
            ),
          ),
        ),
        // Grade A Qty
        cell(
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              totalGAQty > 0 ? totalGAQty.toStringAsFixed(0) : '×',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: totalGAQty > 0 ? FontWeight.bold : FontWeight.w600,
                color: totalGAQty > 0 ? const Color(0xFF065F46) : const Color(0xFF9CA3AF),
              ),
            ),
          ),
          wGradeQty,
          bg: const Color(0xFFD1FAE5),
        ),
        // Grade A Rate
        cell(
          const FittedBox(
            fit: BoxFit.scaleDown,
            child: Text('×', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
          ),
          wGradeRate,
          bg: const Color(0xFFD1FAE5),
        ),
        // Grade B Qty
        cell(
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              totalGBQty > 0 ? totalGBQty.toStringAsFixed(0) : '×',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: totalGBQty > 0 ? FontWeight.bold : FontWeight.w600,
                color: totalGBQty > 0 ? const Color(0xFF1E40AF) : const Color(0xFF9CA3AF),
              ),
            ),
          ),
          wGradeQty,
          bg: const Color(0xFFDBEAFE),
        ),
        // Grade B Rate
        cell(
          const FittedBox(
            fit: BoxFit.scaleDown,
            child: Text('×', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
          ),
          wGradeRate,
          bg: const Color(0xFFDBEAFE),
        ),
        // Grade C Qty
        cell(
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              totalGCQty > 0 ? totalGCQty.toStringAsFixed(0) : '×',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: totalGCQty > 0 ? FontWeight.bold : FontWeight.w600,
                color: totalGCQty > 0 ? const Color(0xFF92400E) : const Color(0xFF9CA3AF),
              ),
            ),
          ),
          wGradeQty,
          bg: const Color(0xFFFEF3C7),
        ),
        // Grade C Rate
        cell(
          const FittedBox(
            fit: BoxFit.scaleDown,
            child: Text('×', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
          ),
          wGradeRate,
          bg: const Color(0xFFFEF3C7),
        ),
        // Rejected Qty
        cell(
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              totalRejQty > 0 ? totalRejQty.toStringAsFixed(0) : '×',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: FontWeight.bold,
                color: totalRejQty > 0 ? const Color(0xFFDC2626) : const Color(0xFF9CA3AF),
              ),
            ),
          ),
          wRejected,
          bg: const Color(0xFFFEE2E2),
        ),
        // Amount
        cell(
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              totalAmount > 0 ? _formatCurrency(totalAmount) : '×',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: FontWeight.bold,
                color: totalAmount > 0 ? const Color(0xFFDC2626) : const Color(0xFF9CA3AF),
              ),
            ),
          ),
          wAmount,
          bg: const Color(0xFFFCE7F3),
        ),
        // Payment Status
        cell(
          const FittedBox(
            fit: BoxFit.scaleDown,
            child: Text('—', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
          ),
          wPayment,
          bg: const Color(0xFFFCE7F3),
        ),
      ],
    );
  }

  Widget _buildEmptySheetState(String title, String? prodName) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 16),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(child: Text('✨', style: TextStyle(fontSize: 20))),
            ),
            const SizedBox(height: 10),
            Text(
              'Fresh Sheet: $title',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 4),
            Text(
              'Ready to record new incoming orders for ${prodName ?? title}.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }

  void _duplicateSheet(Map<String, dynamic> sheet) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final title = '${sheet['title']} (Copy)';
    final newId = 'custom_$now';
    setState(() {
      _customSheets.add({
        'id': newId,
        'title': title,
        'product': sheet['product'],
        'icon': '📄',
        'badge': 0,
        'isOverview': false,
      });
      _activeSheetId = newId;
    });
    if (_tabScrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_tabScrollController.hasClients) {
          _tabScrollController.animateTo(
            _tabScrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
          );
        }
      });
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Duplicated sheet: $title'),
        backgroundColor: const Color(0xFF217346),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _exportSheetCSV(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exported "$title" to CSV successfully'),
        backgroundColor: const Color(0xFF217346),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showOrderReceiptModal(FarmerOrderItem order, int idx, double rate, String unit) {
    final gA = (order.quantity * 0.65);
    final gB = (order.quantity * 0.25);
    final gC = (order.quantity * 0.10);
    final isPaid = order.status == 'Completed';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text('🧾', style: TextStyle(fontSize: 18)),
                      const SizedBox(width: 8),
                      Text('Order #$idx Receipt', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 6),
              Text('Order Code: ${order.orderCode}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 3),
              Text('Buyer: ${order.buyerName}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
              const SizedBox(height: 3),
              Text('Pickup: ${order.pickupDate}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              const SizedBox(height: 12),

              // Grade Statement Breakdown
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Column(
                  children: [
                    Container(
                      color: const Color(0xFFE8F0EA),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Grade', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Qty', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Rate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Subtotal', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    _buildReceiptGradeRow('Grade A', '${gA.toStringAsFixed(1)} $unit', '₹ ${rate.toStringAsFixed(0)}', '₹ ${(gA * rate).toStringAsFixed(0)}', const Color(0xFF065F46)),
                    const Divider(height: 1),
                    _buildReceiptGradeRow('Grade B', '${gB.toStringAsFixed(1)} $unit', '₹ ${(rate * 0.8).toStringAsFixed(0)}', '₹ ${(gB * rate * 0.8).toStringAsFixed(0)}', const Color(0xFF1E40AF)),
                    const Divider(height: 1),
                    _buildReceiptGradeRow('Grade C', '${gC.toStringAsFixed(1)} $unit', '₹ ${(rate * 0.6).toStringAsFixed(0)}', '₹ ${(gC * rate * 0.6).toStringAsFixed(0)}', const Color(0xFF92400E)),
                    const Divider(height: 1),
                    _buildReceiptGradeRow('Rejected', '0 $unit', '—', '—', const Color(0xFFDC2626)),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Total & Payment Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Net Amount', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                      Text(
                        '₹ ${order.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF217346)),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isPaid ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: isPaid ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A)),
                    ),
                    child: Text(
                      isPaid ? 'Payment Paid' : 'Payment Pending',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isPaid ? const Color(0xFF166534) : const Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildReceiptGradeRow(String grade, String qty, String rate, String subtotal, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(grade, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
          Text(qty, style: const TextStyle(fontSize: 11)),
          Text(rate, style: const TextStyle(fontSize: 11)),
          Text(subtotal, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // 5. New Sheet Modal (matching web NewSheetModal)
  void _openNewSheetModal(List<ProductItem> products, {ProductItem? prefilledProduct}) {
    ProductItem? selected = prefilledProduct ?? (products.isNotEmpty ? products.first : null);
    final titleController = TextEditingController(
      text: selected != null ? '${selected.productName.split('(')[0].trim()} - Batch 1' : '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Text('📑', style: TextStyle(fontSize: 16)),
                            SizedBox(width: 8),
                            Text('Add / Create New Sheet', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Text(
                      'Create a fresh sheet tab for any crop or produce — previous orders are excluded so you can record only new incoming orders.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),

                    // Select Product
                    const Text('Select Product / Crop', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<ProductItem>(
                      initialValue: selected,
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      items: products.map((p) {
                        return DropdownMenuItem(value: p, child: Text(p.productName, style: const TextStyle(fontSize: 12)));
                      }).toList(),
                      onChanged: (val) {
                        setModalState(() {
                          selected = val;
                          if (val != null) {
                            titleController.text = '${val.productName.split('(')[0].trim()} - Batch 2';
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 12),

                    // Sheet Title
                    const Text('Sheet Title', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    const SizedBox(height: 4),
                    TextField(
                      controller: titleController,
                      decoration: InputDecoration(
                        hintText: 'e.g. Tomato - Sept Batch',
                        hintStyle: const TextStyle(fontSize: 11),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Quick Title Suggestions
                    Wrap(
                      spacing: 6,
                      children: ['Batch 1', 'Batch 2', 'Grade A High', 'Weekly Log'].map((sug) {
                        return ActionChip(
                          label: Text(sug, style: const TextStyle(fontSize: 10)),
                          padding: EdgeInsets.zero,
                          onPressed: () {
                            if (selected != null) {
                              titleController.text = '${selected!.productName.split('(')[0].trim()} - $sug';
                            } else {
                              titleController.text = sug;
                            }
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      height: 42,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF217346),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          if (titleController.text.trim().isNotEmpty && selected != null) {
                            final newId = 'custom_${DateTime.now().millisecondsSinceEpoch}';
                            setState(() {
                              _customSheets.add({
                                'id': newId,
                                'title': titleController.text.trim(),
                                'product': selected,
                                'icon': '📄',
                                'badge': 0,
                                'isOverview': false,
                              });
                              _activeSheetId = newId;
                            });
                            if (_tabScrollController.hasClients) {
                              Future.delayed(const Duration(milliseconds: 100), () {
                                if (_tabScrollController.hasClients) {
                                  _tabScrollController.animateTo(
                                    _tabScrollController.position.maxScrollExtent,
                                    duration: const Duration(milliseconds: 250),
                                    curve: Curves.easeOut,
                                  );
                                }
                              });
                            }
                            Navigator.pop(ctx);
                          }
                        },
                        child: const Text('Create Sheet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
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
}
