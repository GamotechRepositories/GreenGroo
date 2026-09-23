import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:printing/printing.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../../services/invoice_pdf_service.dart';

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

  void _copyToClipboard(BuildContext context, String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '$label copied: $text',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF065F46),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatCurrency(double val) {
    final intVal = val.round();
    final str = intVal.toString();
    final reg = RegExp(r'(\d+?)(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (Match m) => '${m[1] ?? ''},');
  }

  String _formatShortDate(String? raw) {
    if (raw == null || raw.isEmpty) return '07/09/2026';
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
            icon: const Icon(Icons.visibility_outlined, color: Color(0xFF217346), size: 20),
            tooltip: 'View / Preview Invoice',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => InvoicePdfPreviewScreen(
                    order: order,
                    profile: profile,
                    rate: effectiveRate,
                    unit: unit,
                    productTitle: productTitle,
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF217346), size: 20),
            tooltip: 'Share Receipt',
            onPressed: () async {
              try {
                await InvoicePdfService.shareReceipt(
                  order: order,
                  profile: profile,
                  rate: effectiveRate,
                  unit: unit,
                  productTitle: productTitle,
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        e.toString().contains('MissingPluginException')
                            ? 'Please restart the app (press R or stop and flutter run) to compile newly added PDF plugin.'
                            : 'Failed to share: $e',
                      ),
                      backgroundColor: const Color(0xFFDC2626),
                      duration: const Duration(seconds: 4),
                    ),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined, color: Color(0xFF217346), size: 20),
            tooltip: 'Download PDF',
            onPressed: () async {
              try {
                await InvoicePdfService.downloadPdf(
                  order: order,
                  profile: profile,
                  rate: effectiveRate,
                  unit: unit,
                  productTitle: productTitle,
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        e.toString().contains('MissingPluginException')
                            ? 'Please restart the app (press R or stop and flutter run) to compile newly added PDF plugin.'
                            : 'Failed to generate PDF: $e',
                      ),
                      backgroundColor: const Color(0xFFDC2626),
                      duration: const Duration(seconds: 4),
                    ),
                  );
                }
              }
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
                    // A. Header Banner (Invoice ID, Order ID & Date with Copy Buttons)
                    _buildInvoiceHeader(context, isPaid),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // B. Parties Info (Farmer & Collection Centre)
                    _buildPartiesInfo(context, profile),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // C. Produce & Order Specifications
                    _buildProduceSpecs(context),
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
                    _buildPaymentStatusSection(context, totalNetAmt, isPaid),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // F. Quality Parameters Summary
                    _buildQualityParameters(),
                    const SizedBox(height: 14),

                    // G. Verified Digital Seal
                    _buildVerifiedStamp(),
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
                        foregroundColor: const Color(0xFF15803D),
                        backgroundColor: const Color(0xFFF0FDF4),
                        side: const BorderSide(color: Color(0xFF86EFAC)),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.visibility_outlined, size: 15, color: Color(0xFF15803D)),
                      label: const Text('View Invoice', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => InvoicePdfPreviewScreen(
                              order: order,
                              profile: profile,
                              rate: effectiveRate,
                              unit: unit,
                              productTitle: productTitle,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF374151),
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.share_outlined, size: 15, color: Color(0xFF475569)),
                      label: const Text('Share Receipt', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () async {
                        try {
                          await InvoicePdfService.shareReceipt(
                            order: order,
                            profile: profile,
                            rate: effectiveRate,
                            unit: unit,
                            productTitle: productTitle,
                          );
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e.toString().contains('MissingPluginException')
                                      ? 'Please restart the app (press R or stop and flutter run) to compile newly added PDF plugin.'
                                      : 'Failed to share receipt: $e',
                                ),
                                backgroundColor: const Color(0xFFDC2626),
                                duration: const Duration(seconds: 4),
                              ),
                            );
                          }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.download_outlined, size: 15),
                      label: const Text('Download PDF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () async {
                        try {
                          await InvoicePdfService.downloadPdf(
                            order: order,
                            profile: profile,
                            rate: effectiveRate,
                            unit: unit,
                            productTitle: productTitle,
                          );
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e.toString().contains('MissingPluginException')
                                      ? 'Please restart the app (press R or stop and flutter run) to compile newly added PDF plugin.'
                                      : 'Failed to download PDF: $e',
                                ),
                                backgroundColor: const Color(0xFFDC2626),
                                duration: const Duration(seconds: 4),
                              ),
                            );
                          }
                        }
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
                  step['label']?.toString() ?? '',
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
  Widget _buildInvoiceHeader(BuildContext context, bool isPaid) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Left: GreenGrocc Logo + Invoice No, Order ID & Date
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Image.asset(
                  'assets/images/greengrocc_logo.png',
                  height: 40,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 38,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF065F46),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Center(
                      child: Text('GreenGrocc', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: () => _copyToClipboard(context, 'INV-${order.orderCode}', 'Invoice ID'),
                      borderRadius: BorderRadius.circular(4),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 0.5),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                'INV-${order.orderCode}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(Icons.copy_rounded, size: 10, color: Color(0xFF217346)),
                          ],
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () => _copyToClipboard(context, order.orderCode, 'Order ID'),
                      borderRadius: BorderRadius.circular(4),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 0.5),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Order ID: ',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                            ),
                            Flexible(
                              child: Text(
                                order.orderCode,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, fontFamily: 'monospace', color: Color(0xFF217346)),
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(Icons.copy_rounded, size: 9, color: Color(0xFF217346)),
                          ],
                        ),
                      ),
                    ),
                    Text(
                      'Date: ${_formatShortDate(order.pickupDate)}',
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Right: Status Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
          decoration: BoxDecoration(
            color: isPaid ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isPaid ? const Color(0xFF86EFAC) : const Color(0xFFFDE68A)),
          ),
          child: Text(
            isPaid ? '✓ Paid' : '⏳ Pending',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isPaid ? const Color(0xFF166534) : const Color(0xFF92400E),
            ),
          ),
        ),
      ],
    );
  }

  // --- 3. Parties Info (Farmer & Collection Centre) ---
  Widget _buildPartiesInfo(BuildContext context, FarmerProfile profile) {
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
              _buildCopyableInfoRow(context, 'Farmer ID', farmerId),
              _buildInfoRow('Mobile Number', mobile),
              _buildInfoRow('Village / Location', location),
            ],
          ),
        ),

        Container(width: 1, height: 95, color: const Color(0xFFE2E8F0), margin: const EdgeInsets.symmetric(horizontal: 8)),

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
              _buildInfoRow('Centre Name', order.collectionCentre.isNotEmpty ? order.collectionCentre : 'Main Collection Centre'),
              _buildCopyableInfoRow(context, 'Centre ID', order.collectionCentreId.isNotEmpty ? order.collectionCentreId : 'GGC-CC-MH-NK-NAS-NAS-001'),
              _buildInfoRow('Inspected By', order.inspectorName.isNotEmpty ? order.inspectorName : 'Prajwal Nehe'),
              _buildInfoRow('Weighbridge Status', order.weighbridgeStatus.isNotEmpty ? order.weighbridgeStatus : 'Verified on Scale'),
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

  Widget _buildCopyableInfoRow(BuildContext context, String label, String value) {
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
          InkWell(
            onTap: () => _copyToClipboard(context, value, label),
            borderRadius: BorderRadius.circular(4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    value,
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, fontFamily: 'monospace', color: Color(0xFF0F172A)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 3),
                const Icon(Icons.copy_rounded, size: 10, color: Color(0xFF217346)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- 4. Produce & Order Specifications ---
  Widget _buildProduceSpecs(BuildContext context) {
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
            InkWell(
              onTap: () => _copyToClipboard(context, order.orderCode, 'Batch / Order ID'),
              borderRadius: BorderRadius.circular(4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: const Color(0xFFCBD5E1), width: 0.7),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Batch: ${order.orderCode}',
                      style: const TextStyle(fontSize: 8.5, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                    ),
                    const SizedBox(width: 3),
                    const Icon(Icons.copy_rounded, size: 9, color: Color(0xFF217346)),
                  ],
                ),
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
                _buildCopyableSpecCell(context, 'Lot / Batch ID', order.orderCode),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCopyableSpecCell(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.0, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
          const SizedBox(height: 1),
          InkWell(
            onTap: () => _copyToClipboard(context, value, label),
            borderRadius: BorderRadius.circular(4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 3),
                const Icon(Icons.copy_rounded, size: 9.5, color: Color(0xFF217346)),
              ],
            ),
          ),
        ],
      ),
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
    final double gAOrdered = gAQty + order.gradeARejected; // 200 + 0 = 200
    final double gARej = order.gradeARejected; // 0
    final double gAFinal = gAQty; // 200

    final double gBRej = order.gradeBRejected > 0 ? order.gradeBRejected : (rejQty > 0 ? rejQty : 10.0); // 10
    final double gBFinal = gBQty > 0 ? gBQty : 80.0; // 80
    final double gBOrdered = gBFinal + gBRej; // 90

    final double gCRej = order.gradeCRejected; // 0
    final double gCFinal = gCQty; // 0
    final double gCOrdered = gCFinal + gCRej; // 0

    final double totalOrdered = gAOrdered + gBOrdered + gCOrdered; // 290
    final double totalRejected = gARej + gBRej + gCRej; // 10
    final double totalFinal = gAFinal + gBFinal + gCFinal; // 280

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
                    const Expanded(flex: 3, child: Text('GRADE / ITEM', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w900, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('ORDERED\nQTY', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.0, height: 1.1, fontWeight: FontWeight.w900, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('REJECTED\nQTY', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.0, height: 1.1, fontWeight: FontWeight.w900, color: Colors.white))),
                    const Expanded(flex: 2, child: Text('FINAL\nQTY', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.0, height: 1.1, fontWeight: FontWeight.w900, color: Colors.white))),
                    Expanded(flex: 2, child: Text('RATE\n/ ${unit.toUpperCase()}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.0, height: 1.1, fontWeight: FontWeight.w900, color: Colors.white))),
                    const Expanded(flex: 3, child: Text('TOTAL\nAMOUNT (₹)', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.0, height: 1.1, fontWeight: FontWeight.w900, color: Colors.white))),
                  ],
                ),
              ),

              // Grade A Row
              _buildGradeTableRow(
                'Grade A',
                '${gAOrdered.toStringAsFixed(0)} $unit',
                '${gARej.toStringAsFixed(0)} $unit',
                '${gAFinal.toStringAsFixed(0)} $unit',
                '₹${gARate.toStringAsFixed(0)}',
                '₹${_formatCurrency(gAAmt)}',
                false,
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Grade B Row
              _buildGradeTableRow(
                'Grade B',
                '${gBOrdered.toStringAsFixed(0)} $unit',
                '${gBRej.toStringAsFixed(0)} $unit',
                '${gBFinal.toStringAsFixed(0)} $unit',
                '₹${gBRate.toStringAsFixed(0)}',
                '₹${_formatCurrency(gBAmt > 0 ? gBAmt : 960)}',
                false,
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Grade C Row
              _buildGradeTableRow(
                'Grade C',
                '${gCOrdered.toStringAsFixed(0)} $unit',
                '${gCRej.toStringAsFixed(0)} $unit',
                '${gCFinal.toStringAsFixed(0)} $unit',
                gCRate > 0 ? '₹${gCRate.toStringAsFixed(0)}' : '—',
                order.gradeCAmt > 0 ? '₹${_formatCurrency(order.gradeCAmt)}' : '₹0',
                false,
              ),

              // Footer Total Settlement Row
              Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFECFDF5),
                  border: Border(top: BorderSide(color: Color(0xFF065F46), width: 1.5)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 7),
                child: Row(
                  children: [
                    const Expanded(flex: 3, child: Text('TOTAL\nSETTLEMENT', style: TextStyle(fontSize: 8.5, height: 1.1, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)))),
                    Expanded(flex: 2, child: Text('${totalOrdered.toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)))),
                    Expanded(flex: 2, child: Text('${totalRejected.toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.w900, color: Color(0xFFDC2626)))),
                    Expanded(flex: 2, child: Text('${totalFinal.toStringAsFixed(0)} $unit', textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)))),
                    const Expanded(flex: 2, child: Text('—', textAlign: TextAlign.right, style: TextStyle(fontSize: 9.0, color: Color(0xFF94A3B8)))),
                    Expanded(flex: 3, child: Text('₹${_formatCurrency(totalNetAmt)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Color(0xFF065F46)))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGradeTableRow(String grade, String ordered, String rejected, String finalQty, String rate, String amt, bool isAlt) {
    return Container(
      color: isAlt ? const Color(0xFFF8FAFC) : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF059669), shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text(grade, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              ],
            ),
          ),
          Expanded(flex: 2, child: Text(ordered, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF334155)))),
          Expanded(
            flex: 2,
            child: Text(
              rejected,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 8.5,
                fontWeight: FontWeight.bold,
                color: Color(0xFFDC2626),
              ),
            ),
          ),
          Expanded(flex: 2, child: Text(finalQty, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)))),
          Expanded(flex: 2, child: Text(rate, textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF334155)))),
          Expanded(flex: 3, child: Text(amt, textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.0, fontWeight: FontWeight.w900, color: Color(0xFF065F46)))),
        ],
      ),
    );
  }

  // --- 6. Payment & Settlement Status Section ---
  Widget _buildPaymentStatusSection(BuildContext context, double totalNetAmt, bool isPaid) {
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
                  _buildCopyablePaymentCell(context, 'Transaction ID / UTR', txnId),
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

  Widget _buildCopyablePaymentCell(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 8.0, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
          const SizedBox(height: 1),
          InkWell(
            onTap: () => _copyToClipboard(context, value, label),
            borderRadius: BorderRadius.circular(4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    value,
                    style: const TextStyle(
                      fontSize: 9.5,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 3),
                const Icon(Icons.copy_rounded, size: 10, color: Color(0xFF217346)),
              ],
            ),
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

  // --- 7. Quality Parameters Summary (Grade-Wise Report) ---
  Widget _buildQualityParameters() {
    final double gARej = order.gradeARejected;
    final double gBRej = order.gradeBRejected > 0 ? order.gradeBRejected : (order.rejectedQuantity > 0 ? order.rejectedQuantity : 10.0);
    final double gCRej = order.gradeCRejected;

    final gradeCards = <Widget>[];

    // Grade A Card
    if (order.gradeAQty > 0 || gARej > 0 || order.orderedQuantity >= 200) {
      gradeCards.add(
        _buildSingleGradeQualityCard(
          gradeLabel: 'Grade A',
          dotColor: const Color(0xFF059669),
          rejectedQty: gARej,
          rejectionReason: 'None',
          params: [
            {'label': 'Freshness', 'val': 'Excellent'},
            {'label': 'Size', 'val': 'Uniform'},
            {'label': 'Moisture', 'val': 'Normal'},
            {'label': 'Damage', 'val': 'None'},
            {'label': 'Cleanliness', 'val': 'Clean'},
            {'label': 'Overall', 'val': 'Excellent'},
          ],
        ),
      );
    }

    // Grade B Card
    if (order.gradeBQty > 0 || gBRej > 0 || order.orderedQuantity >= 80) {
      gradeCards.add(
        _buildSingleGradeQualityCard(
          gradeLabel: 'Grade B',
          dotColor: const Color(0xFF1E40AF),
          rejectedQty: gBRej,
          rejectionReason: 'Damaged',
          params: [
            {'label': 'Freshness', 'val': 'Good'},
            {'label': 'Size', 'val': 'Medium'},
            {'label': 'Moisture', 'val': 'Normal'},
            {'label': 'Damage', 'val': 'Minor'},
            {'label': 'Cleanliness', 'val': 'Clean'},
            {'label': 'Overall', 'val': 'Commercial'},
          ],
        ),
      );
    }

    // Grade C Card (if present)
    if (order.gradeCQty > 0 || gCRej > 0) {
      gradeCards.add(
        _buildSingleGradeQualityCard(
          gradeLabel: 'Grade C',
          dotColor: const Color(0xFF92400E),
          rejectedQty: gCRej,
          rejectionReason: 'Sub-Standard',
          params: [
            {'label': 'Freshness', 'val': 'Fair'},
            {'label': 'Size', 'val': 'Variable'},
            {'label': 'Moisture', 'val': 'Normal'},
            {'label': 'Damage', 'val': 'High'},
            {'label': 'Cleanliness', 'val': 'Sorted'},
            {'label': 'Overall', 'val': 'Standard'},
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'QUALITY INSPECTION PARAMETERS & QUALITY REMARKS',
          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF334155), letterSpacing: 0.3),
        ),
        const SizedBox(height: 8),
        Column(
          children: gradeCards.map((c) => Padding(padding: const EdgeInsets.only(bottom: 8), child: c)).toList(),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(5),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 9, color: Color(0xFF475569)),
              children: [
                TextSpan(text: 'Inspector Remarks: ', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                TextSpan(text: 'Quality verified and graded according to GreenGrocc standards.'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSingleGradeQualityCard({
    required String gradeLabel,
    required Color dotColor,
    required double rejectedQty,
    required String rejectionReason,
    required List<Map<String, String>> params,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFCBD5E1), width: 0.8),
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: [Dot + Grade Parameters] ... [Rejected Badge if > 0]
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                  const SizedBox(width: 5),
                  Text(
                    '$gradeLabel Parameters',
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              if (rejectedQty > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFFCA5A5), width: 0.7),
                  ),
                  child: Text(
                    'Rejected: ${rejectedQty.toStringAsFixed(0)} $unit ($rejectionReason)',
                    style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          const Divider(height: 1, thickness: 0.5, color: Color(0xFFE2E8F0)),
          const SizedBox(height: 6),
          // 3x2 Grid of Parameters
          Wrap(
            spacing: 6,
            runSpacing: 5,
            children: params.map((p) {
              return SizedBox(
                width: 98,
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 8.5, color: Color(0xFF64748B)),
                    children: [
                      TextSpan(text: '${p['label']}: ', style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                      TextSpan(text: p['val'], style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // --- 8. Verified Quality Seal ---
  Widget _buildVerifiedStamp() {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
              'Verified Quality Seal · GreenGrocc',
              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
            ),
          ],
        ),
      ),
    );
  }
}

class InvoicePdfPreviewScreen extends StatelessWidget {
  final FarmerOrderItem order;
  final FarmerProfile profile;
  final double rate;
  final String unit;
  final String productTitle;

  const InvoicePdfPreviewScreen({
    super.key,
    required this.order,
    required this.profile,
    required this.rate,
    required this.unit,
    required this.productTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(
          'View Invoice · INV-${order.orderCode}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Color(0xFF217346), size: 20),
            tooltip: 'Share Receipt',
            onPressed: () async {
              await InvoicePdfService.shareReceipt(
                order: order,
                profile: profile,
                rate: rate,
                unit: unit,
                productTitle: productTitle,
              );
            },
          ),
        ],
      ),
      body: PdfPreview(
        build: (format) => InvoicePdfService.generateInvoicePdf(
          order: order,
          profile: profile,
          rate: rate,
          unit: unit,
          productTitle: productTitle,
        ),
        pdfFileName: 'Invoice-INV-${order.orderCode}.pdf',
        canChangeOrientation: false,
        canChangePageFormat: false,
        canDebug: false,
        previewPageMargin: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
        loadingWidget: const Center(
          child: CircularProgressIndicator(color: Color(0xFF217346)),
        ),
      ),
    );
  }
}
