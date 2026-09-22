import 'package:flutter/material.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';

class EarningReportScreen extends StatelessWidget {
  final FarmerOrderItem order;
  final double rate;
  final String unit;
  final String productTitle;

  const EarningReportScreen({
    super.key,
    required this.order,
    required this.rate,
    required this.unit,
    required this.productTitle,
  });

  String _formatCurrency(double val) {
    final intVal = val.round();
    final str = intVal.toString();
    final reg = RegExp(r'(\d+?)(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (Match m) => '${m[1]},');
  }

  String _formatShortDate(String raw) {
    if (raw.isEmpty) return '07/09/2026';
    if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(raw)) {
      try {
        final dt = DateTime.parse(raw);
        return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
      } catch (_) {}
    }
    return raw;
  }

  @override
  Widget build(BuildContext context) {
    final profile = FarmerState().profile;
    final isPaid = order.paymentStatus.toUpperCase() == 'PAID' || order.status == 'Completed';

    final double effectiveRate = order.rate > 0 ? order.rate : (rate > 0 ? rate : 30.0);
    final double gAQty = order.gradeAQty;
    final double gARate = order.gradeARate > 0 ? order.gradeARate : effectiveRate;
    final double gBQty = order.gradeBQty;
    final double gBRate = order.gradeBRate > 0 ? order.gradeBRate : ((effectiveRate * 0.4).roundToDouble() > 0 ? (effectiveRate * 0.4).roundToDouble() : 12.0);
    final double gCQty = order.gradeCQty;
    final double gCRate = order.gradeCRate;
    final double rejQty = order.rejectedQuantity;

    final double gAAmt = order.gradeAAmt;
    final double gBAmt = order.gradeBAmt;
    final double totalNetAmt = order.effectiveTotalAmount;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Invoice · INV-${order.orderCode}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF217346), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Invoice INV-${order.orderCode} link copied to clipboard!'),
                  backgroundColor: const Color(0xFF217346),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined, color: Color(0xFF217346), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Downloaded INV-${order.orderCode}.pdf successfully'),
                  backgroundColor: const Color(0xFF217346),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Breadcrumb row
              InkWell(
                onTap: () => Navigator.pop(context),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.arrow_back, size: 13, color: Color(0xFF217346)),
                      const SizedBox(width: 4),
                      const Text(
                        'Back to Earning Statement',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF217346)),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '› ${order.orderCode}',
                        style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Quality Status Timeline Card
              _buildQualityTimeline(isPaid),
              const SizedBox(height: 12),

              // 3. Unified Procurement & Settlement Invoice Card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // A. Header Banner
                    _buildInvoiceHeader(isPaid),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // B. Parties Info (Farmer & Collection Centre)
                    _buildPartiesInfo(profile),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // C. Produce & Order Specifications
                    _buildProduceSpecs(),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // D. Grade-Wise Quality Settlement & Valuation Table
                    _buildGradeSettlementTable(
                      gAQty: gAQty,
                      gARate: gARate,
                      gAAmt: gAAmt,
                      gBQty: gBQty,
                      gBRate: gBRate,
                      gBAmt: gBAmt,
                      gCQty: gCQty,
                      gCRate: gCRate,
                      rejQty: rejQty,
                      totalNetAmt: totalNetAmt,
                    ),
                    const SizedBox(height: 14),

                    // E. Payment & Settlement Status Card
                    _buildPaymentStatusSection(totalNetAmt, isPaid),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // F. Quality Parameters Summary
                    _buildQualityParameters(),
                    const SizedBox(height: 14),

                    // G. Verified Digital Seal & Signatures
                    _buildVerifiedStamp(profile),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 4. Action Buttons Footer
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF374151),
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.share_outlined, size: 16, color: Color(0xFF475569)),
                      label: const Text('Share Receipt', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Invoice ${order.orderCode} shared!'),
                            backgroundColor: const Color(0xFF217346),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.download_outlined, size: 16),
                      label: const Text('Download PDF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Downloaded PDF for ${order.orderCode}'),
                            backgroundColor: const Color(0xFF217346),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  // --- 1. Quality Status Timeline ---
  Widget _buildQualityTimeline(bool isPaid) {
    final steps = [
      {'label': 'Received', 'done': true},
      {'label': 'Quality Check', 'done': true},
      {'label': 'Grading', 'done': true},
      {'label': 'Grading Done', 'done': true},
      {'label': isPaid ? 'Payment Paid' : 'Payment Pending', 'done': isPaid},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: steps.asMap().entries.map((entry) {
          final idx = entry.key;
          final step = entry.value;
          final bool done = step['done'] as bool;
          final bool isLast = idx == steps.length - 1;

          return Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 2.5,
                        color: idx == 0 ? Colors.transparent : (done ? const Color(0xFF217346) : const Color(0xFFC9E4D3)),
                      ),
                    ),
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: done ? const Color(0xFF217346) : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: done ? const Color(0xFF217346) : const Color(0xFFC9E4D3),
                          width: 2.5,
                        ),
                      ),
                      child: done
                          ? const Center(child: Icon(Icons.check, size: 9, color: Colors.white))
                          : null,
                    ),
                    Expanded(
                      child: Container(
                        height: 2.5,
                        color: isLast ? Colors.transparent : (done ? const Color(0xFF217346) : const Color(0xFFC9E4D3)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  step['label'] as String,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 8.5,
                    fontWeight: done ? FontWeight.bold : FontWeight.w500,
                    color: done ? const Color(0xFF15803D) : const Color(0xFF94A3B8),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- 2. Invoice Header ---
  Widget _buildInvoiceHeader(bool isPaid) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Left: Logo & Company Name
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF064E3B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Text('🌿', style: TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'GreenGroo Agri Network',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                    Text(
                      'PRODUCE PROCUREMENT & SETTLEMENT',
                      style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF065F46), letterSpacing: 0.2),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Right: Invoice No & Date
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'INV-${order.orderCode}',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, fontFamily: 'monospace', color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 1),
            Text(
              'Date: ${_formatShortDate(order.pickupDate)}',
              style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
            ),
            const SizedBox(height: 3),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: isPaid ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isPaid ? const Color(0xFF86EFAC) : const Color(0xFFFDE68A)),
              ),
              child: Text(
                isPaid ? '✓ Paid' : '⏳ Pending',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w900,
                  color: isPaid ? const Color(0xFF166534) : const Color(0xFF92400E),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // --- 3. Parties Info (Farmer & Collection Centre) ---
  Widget _buildPartiesInfo(FarmerProfile profile) {
    final farmerName = profile.fullName.isNotEmpty ? profile.fullName : 'Farmer Nitin';
    final farmerId = profile.id.isNotEmpty ? profile.id : 'FARM-8942';
    final mobile = profile.mobile.isNotEmpty ? profile.mobile : '+91 98223 45678';
    final location = '${profile.village.isNotEmpty ? profile.village : "Baramati"}, ${profile.district.isNotEmpty ? profile.district : "Pune"}';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Farmer Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.only(bottom: 3),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: const Row(
                  children: [
                    Text('👨‍🌾', style: TextStyle(fontSize: 11)),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Farmer (Supplier / Payee)',
                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF065F46), letterSpacing: 0.2),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 5),
              _buildInfoRow('Farmer Name', farmerName),
              _buildInfoRow('Farmer ID', farmerId),
              _buildInfoRow('Mobile Number', mobile),
              _buildInfoRow('Village / Location', location),
            ],
          ),
        ),

        Container(width: 1, height: 85, color: const Color(0xFFE2E8F0), margin: const EdgeInsets.symmetric(horizontal: 8)),

        // Collection Centre Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.only(bottom: 3),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: const Row(
                  children: [
                    Text('🏬', style: TextStyle(fontSize: 11)),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Collection Centre (Received At)',
                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF065F46), letterSpacing: 0.2),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 5),
              _buildInfoRow('Centre Name', 'Main Collection Centre'),
              _buildInfoRow('Centre ID', 'CC-SNG-01'),
              _buildInfoRow('Inspected By', 'Quality Officer'),
              _buildInfoRow('Weighbridge Status', 'Verified on Scale'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(fontSize: 8.0, fontWeight: FontWeight.w800, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 0.5),
          Text(
            value,
            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // --- 4. Produce & Order Specifications ---
  Widget _buildProduceSpecs() {
    final crop = order.cropName.isNotEmpty ? order.cropName : (order.productName.isNotEmpty ? order.productName : productTitle);
    final varName = order.variety.isNotEmpty ? order.variety : 'Pusa Purple Long';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'PRODUCE & ORDER SPECIFICATIONS',
              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 0.3),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Batch: ${order.orderCode}',
                style: const TextStyle(fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF475569)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Table(
          columnWidths: const {
            0: FlexColumnWidth(1),
            1: FlexColumnWidth(1),
          },
          children: [
            TableRow(
              children: [
                _buildSpecCell('Produce / Crop', crop),
                _buildSpecCell('Variety', varName),
              ],
            ),
            TableRow(
              children: [
                _buildSpecCell('Ordered Quantity', '${order.orderedQuantity.toStringAsFixed(0)} $unit'),
                _buildSpecCell('Received Quantity', '${order.receivedQuantity.toStringAsFixed(0)} $unit', isGreen: true),
              ],
            ),
            TableRow(
              children: [
                _buildSpecCell('Pickup Date & Time', '${order.pickupDate} · ${order.pickupSlot}'),
                _buildSpecCell('Received Date & Time', '${order.pickupDate} · 7:15 AM'),
              ],
            ),
            TableRow(
              children: [
                _buildSpecCell('Quality Status', order.qualityStatus.isNotEmpty ? order.qualityStatus : 'ORDER_COMPLETED', isGreen: true),
                _buildSpecCell('Lot / Batch ID', order.orderCode),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSpecCell(String label, String value, {bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.0, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
          const SizedBox(height: 1),
          Text(
            value,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.bold,
              color: isGreen ? const Color(0xFF15803D) : const Color(0xFF0F172A),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // --- 5. Grade-Wise Quality Settlement & Valuation Table ---
  Widget _buildGradeSettlementTable({
    required double gAQty,
    required double gARate,
    required double gAAmt,
    required double gBQty,
    required double gBRate,
    required double gBAmt,
    required double gCQty,
    required double gCRate,
    required double rejQty,
    required double totalNetAmt,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'GRADE-WISE QUALITY SETTLEMENT & VALUATION',
          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 0.3),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFCBD5E1), width: 1),
            borderRadius: BorderRadius.circular(6),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              // Header
              Container(
                color: const Color(0xFF1E293B),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                child: Row(
                  children: [
                    const Expanded(flex: 3, child: Text('Grade / Item', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('Ordered Qty', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('Rejected Qty', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('Final Qty', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                    Expanded(flex: 2, child: Text('Rate / $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                    const Expanded(flex: 3, child: Text('Total Amount (₹)', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.white))),
                  ],
                ),
              ),

              // Grade A Row: Ordered - Rejected = Final Qty
              _buildGradeTableRow(
                'Grade A',
                '${(gAQty + order.gradeARejected).toStringAsFixed(0)} $unit',
                '${order.gradeARejected > 0 ? order.gradeARejected.toStringAsFixed(0) : '0'} $unit',
                '${gAQty.toStringAsFixed(0)} $unit',
                '₹ ${gARate.toStringAsFixed(0)}',
                '₹ ${_formatCurrency(gAAmt)}',
                const Color(0xFF065F46),
                false,
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Grade B Row: Ordered - Rejected = Final Qty
              _buildGradeTableRow(
                'Grade B',
                '${(gBQty + order.gradeBRejected).toStringAsFixed(0)} $unit',
                '${order.gradeBRejected > 0 ? order.gradeBRejected.toStringAsFixed(0) : '0'} $unit',
                '${gBQty.toStringAsFixed(0)} $unit',
                '₹ ${gBRate.toStringAsFixed(0)}',
                '₹ ${_formatCurrency(gBAmt)}',
                const Color(0xFF1E40AF),
                true,
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Grade C Row: Ordered - Rejected = Final Qty
              _buildGradeTableRow(
                'Grade C',
                '${(gCQty + order.gradeCRejected) > 0 ? (gCQty + order.gradeCRejected).toStringAsFixed(0) : '0'} $unit',
                '${order.gradeCRejected > 0 ? order.gradeCRejected.toStringAsFixed(0) : '0'} $unit',
                '${gCQty > 0 ? gCQty.toStringAsFixed(0) : '0'} $unit',
                gCRate > 0 ? '₹ ${gCRate.toStringAsFixed(0)}' : '—',
                '₹ ${_formatCurrency(order.gradeCAmt)}',
                const Color(0xFF92400E),
                false,
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Rejected Row: Ordered (10) - Rejected (10) = Final (0)
              _buildGradeTableRow(
                'Rejected',
                '${rejQty > 0 ? rejQty.toStringAsFixed(0) : '0'} $unit',
                '${rejQty > 0 ? rejQty.toStringAsFixed(0) : '0'} $unit',
                '0 $unit',
                '—',
                '₹ 0',
                const Color(0xFFDC2626),
                true,
              ),

              // Footer Settlement Row: Total Ordered (290) - Total Rejected (10) = Total Final Qty (280)
              Container(
                color: const Color(0xFFECFDF5),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 7),
                child: Row(
                  children: [
                    const Expanded(flex: 3, child: Text('Total Settlement', style: TextStyle(fontSize: 9.0, fontWeight: FontWeight.w900, color: Color(0xFF064E3B)))),
                    Expanded(flex: 2, child: Text('${order.orderedQuantity.toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)))),
                    Expanded(flex: 2, child: Text('${rejQty.toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)))),
                    Expanded(flex: 2, child: Text('${(order.orderedQuantity - rejQty).clamp(0, 99999).toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFF065F46)))),
                    const Expanded(flex: 2, child: Text('—', textAlign: TextAlign.right, style: TextStyle(fontSize: 9.0, color: Color(0xFF94A3B8)))),
                    Expanded(flex: 3, child: Text('₹ ${_formatCurrency(totalNetAmt)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Color(0xFF064E3B)))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGradeTableRow(String grade, String ordered, String rejected, String accepted, String rate, String amt, Color color, bool isAlt) {
    return Container(
      color: isAlt ? const Color(0xFFF8FAFC) : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5.5),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text(grade, style: TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: color)),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text(ordered, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, color: Color(0xFF334155)))),
          Expanded(
            flex: 2,
            child: Text(
              rejected,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: rejected != '0 $unit' && rejected != '—' ? FontWeight.bold : FontWeight.normal,
                color: rejected != '0 $unit' && rejected != '—' ? const Color(0xFFDC2626) : const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(flex: 2, child: Text(accepted, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)))),
          Expanded(flex: 2, child: Text(rate, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, color: Color(0xFF475569)))),
          Expanded(flex: 3, child: Text(amt, textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFF065F46)))),
        ],
      ),
    );
  }

  // --- 6. Payment & Settlement Status Section ---
  Widget _buildPaymentStatusSection(double totalNetAmt, bool isPaid) {
    final txnId = order.transactionId.isNotEmpty ? order.transactionId : 'TXN-GGC-${order.orderCode}';
    final settlementDate = _formatShortDate(order.pickupDate);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PAYMENT & SETTLEMENT STATUS',
                style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF065F46), letterSpacing: 0.3),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Status: ', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                  Text(
                    isPaid ? 'PAID' : 'PENDING',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w900,
                      color: isPaid ? const Color(0xFF166534) : const Color(0xFFB45309),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Table(
            columnWidths: const {
              0: FlexColumnWidth(1),
              1: FlexColumnWidth(1),
            },
            children: [
              TableRow(
                children: [
                  _buildPaymentCell('Net Payable Amount', '₹ ${_formatCurrency(totalNetAmt)}', isBigGreen: true),
                  _buildPaymentCell('Payment Method', isPaid ? 'Direct Bank Transfer (IMPS)' : 'Direct Bank Transfer (Pending)'),
                ],
              ),
              TableRow(
                children: [
                  _buildPaymentCell('Transaction ID / UTR', txnId, isMono: true),
                  _buildPaymentCell('Settlement Date', settlementDate),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Notes: Quality settlement processed and credited to farmer bank account.',
            style: TextStyle(fontSize: 8.5, color: Color(0xFF64748B), fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCell(String label, String value, {bool isBigGreen = false, bool isMono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.0, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
          const SizedBox(height: 1),
          Text(
            value,
            style: TextStyle(
              fontSize: isBigGreen ? 15 : 9.5,
              fontFamily: isMono ? 'monospace' : null,
              fontWeight: FontWeight.w900,
              color: isBigGreen ? const Color(0xFF065F46) : const Color(0xFF0F172A),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // --- 7. Quality Parameters Summary ---
  Widget _buildQualityParameters() {
    const params = [
      {'label': 'Freshness', 'val': 'Excellent (98%)'},
      {'label': 'Size', 'val': 'Uniform (45-55mm)'},
      {'label': 'Moisture', 'val': 'Normal (< 12%)'},
      {'label': 'Damage', 'val': 'None (0%)'},
      {'label': 'Cleanliness', 'val': 'Clean & Sorted'},
      {'label': 'Overall', 'val': 'Grade A Superior'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'QUALITY INSPECTION PARAMETERS & REMARKS',
          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 0.3),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 5,
          children: params.map((p) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(5),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 9, color: Color(0xFF475569)),
                  children: [
                    TextSpan(text: '${p['label']}: ', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                    TextSpan(text: p['val']!, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // --- 8. Signatures, Verified Stamp & Official Footer ---
  Widget _buildVerifiedStamp(FarmerProfile profile) {
    final farmerName = profile.fullName.isNotEmpty ? profile.fullName : 'Farmer Nitin';

    return Column(
      children: [
        // Verified Seal Pill & Digital Desk
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified, size: 14, color: Color(0xFF166534)),
                  SizedBox(width: 4),
                  Text(
                    'Verified Quality Seal · GreenGroo Agri',
                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                  ),
                ],
              ),
            ),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('Digitally Signed by Quality Desk', style: TextStyle(fontSize: 8, color: Color(0xFF94A3B8))),
                Text('GreenGroo Hub Sangamner', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Signatures Grid
        Row(
          children: [
            Expanded(
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Container(height: 1, color: const Color(0xFFCBD5E1)),
                  const SizedBox(height: 3),
                  Text(
                    farmerName,
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const Text(
                    'Farmer Signature / Acknowledgment',
                    style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Container(height: 1, color: const Color(0xFFCBD5E1)),
                  const SizedBox(height: 3),
                  const Text(
                    'GreenGroo Sourcing Manager',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const Text(
                    'Authorized Signatory & Stamp',
                    style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Computer generated invoice disclaimer note
        const Text(
          'This is a computer-generated tax invoice & quality settlement slip from GreenGroo Logistics. For any inquiries, please contact your designated Collection Centre.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8), height: 1.2),
        ),
      ],
    );
  }
}
