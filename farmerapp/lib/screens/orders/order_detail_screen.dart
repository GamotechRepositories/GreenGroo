import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'order_prepare_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool _isBusy = false;

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

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard'),
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF007A4D),
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
      bg = const Color(0xFFE0F2FE);
      text = const Color(0xFF0369A1);
      border = const Color(0xFFBAE6FD);
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: text),
      ),
    );
  }

  void _showAcceptDialog(FarmerOrderItem order) {
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

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
              backgroundColor: const Color(0xFF007A4D),
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
                    backgroundColor: const Color(0xFF007A4D),
                  ),
                );
                nav.pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => OrderPrepareScreen(orderId: order.id),
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

  void _showRejectDialog(FarmerOrderItem order) {
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
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
                  nav.pop();
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

  String _formatProductBusinessCode(FarmerOrderItem order) {
    if (order.productId.isNotEmpty) return order.productId;
    final cleanName = order.productName.split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final cleanVar = order.variety.split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    if (cleanName.isEmpty && cleanVar.isEmpty) return order.orderCode;
    final nameCode = cleanName.length >= 3 ? cleanName.substring(0, 3) : (cleanName.isNotEmpty ? cleanName : 'PRD');
    final varCode = cleanVar.length >= 3 ? cleanVar.substring(0, 3) : (cleanVar.isNotEmpty ? cleanVar : 'VAR');
    final numDigits = order.id.replaceAll(RegExp(r'[^0-9]'), '');
    final serial = numDigits.isNotEmpty ? numDigits.padLeft(5, '0') : '00000';
    final tail = serial.length > 5 ? serial.substring(serial.length - 5) : serial;
    return 'GGC-ART-VEG-$nameCode-$varCode-$tail';
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final orders = FarmerState().orders;
        final profile = FarmerState().profile;
        final order = orders.firstWhere(
          (o) => o.id == widget.orderId || o.orderCode == widget.orderId,
          orElse: () => FarmerOrderItem(
            id: widget.orderId,
            orderCode: widget.orderId,
            buyerName: '',
            buyerPhone: '',
            productName: '',
            variety: '',
            quantity: 0,
            unit: '',
            totalAmount: 0,
            status: '',
            pickupDate: '',
            pickupSlot: '',
            createdAt: '',
          ),
        );

        final s = order.status.toUpperCase();
        final canAccept = s.contains('NEW') || s.contains('CONFIRMED');
        final canReject = s.contains('NEW') || s.contains('CONFIRMED');
        final canPrepare = s.contains('ACCEPT') || s.contains('PREPAR') || s.contains('PACK');

        // Dynamic Grades rows matching web screenshot
        final grades = [
          if (order.gradeAQty > 0)
            {
              'grade': 'Grade A',
              'qty': order.gradeAQty,
              'rate': order.gradeARate > 0 ? order.gradeARate : order.rate,
              'amount': order.gradeAQty * (order.gradeARate > 0 ? order.gradeARate : order.rate),
            },
          if (order.gradeBQty > 0)
            {
              'grade': 'Grade B',
              'qty': order.gradeBQty,
              'rate': order.gradeBRate > 0 ? order.gradeBRate : ((order.rate * 0.4).roundToDouble() > 0 ? (order.rate * 0.4).roundToDouble() : 5.0),
              'amount': order.gradeBQty * (order.gradeBRate > 0 ? order.gradeBRate : ((order.rate * 0.4).roundToDouble() > 0 ? (order.rate * 0.4).roundToDouble() : 5.0)),
            },
          if (order.gradeCQty > 0)
            {
              'grade': 'Grade C',
              'qty': order.gradeCQty,
              'rate': order.gradeCRate > 0 ? order.gradeCRate : 2.0,
              'amount': order.gradeCQty * (order.gradeCRate > 0 ? order.gradeCRate : 2.0),
            },
        ];

        final double calculatedTotal = grades.fold(0.0, (sum, g) => sum + (g['amount'] as double));
        final double finalOrderValue = order.totalAmount > 0 ? order.totalAmount : calculatedTotal;
        final productBizId = _formatProductBusinessCode(order);
        final qrPayload = 'greengroo:order:${order.orderCode}';
        final farmerDisplayName = profile.fullName;

        return Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Status Badge & Back Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      InkWell(
                        onTap: () => Navigator.pop(context),
                        borderRadius: BorderRadius.circular(4),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Text(
                            '← Orders',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF217346),
                            ),
                          ),
                        ),
                      ),
                      _buildStatusBadge(order.status),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Heading: Big Product Title
                  Text(
                    order.productName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Order ID with copy icon
                  InkWell(
                    onTap: () => _copyToClipboard(order.orderCode, 'Order ID'),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          order.orderCode,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.copy_rounded, size: 14, color: Color(0xFF6B7280)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Card 1: Product Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Product',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          order.productName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        if (order.variety.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            'Variety: ${order.variety}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () => _copyToClipboard(productBizId, 'Product Code'),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                productBizId,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF059669),
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.copy_rounded, size: 13, color: Color(0xFF059669)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 4-Fact Grid (Order date, Pickup date, Pickup time, Total qty)
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 2.1,
                    children: [
                      _FactBox(label: 'Order date', value: _shortDate(order.createdAt)),
                      _FactBox(label: 'Pickup date', value: _shortDate(order.pickupDate)),
                      _FactBox(label: 'Pickup time', value: _formatTime12h(order.pickupSlot)),
                      _FactBox(label: 'Total qty', value: '${order.quantity.toStringAsFixed(0)} ${order.unit}'),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Card 2: Grades Table Card
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Text(
                            'Grades',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                        ),
                        // Table Header
                        Container(
                          color: const Color(0xFFF8FAF8),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: const Row(
                            children: [
                              Expanded(flex: 3, child: Text('Grade', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)))),
                              Expanded(flex: 2, child: Text('Qty', textAlign: TextAlign.right, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)))),
                              Expanded(flex: 2, child: Text('Rate', textAlign: TextAlign.right, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)))),
                              Expanded(flex: 3, child: Text('Amount', textAlign: TextAlign.right, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)))),
                            ],
                          ),
                        ),
                        const Divider(height: 1, color: Color(0xFFF3F4F6)),

                        // Table Rows
                        ...grades.map((g) {
                          final label = g['grade'] as String;
                          final qty = g['qty'] as double;
                          final rate = g['rate'] as double;
                          final amt = g['amount'] as double;

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                            decoration: const BoxDecoration(
                              border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6), width: 1)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: Text(
                                    label,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1F2937)),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    '${qty.toStringAsFixed(0)} ${order.unit}',
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    '₹${rate.toStringAsFixed(0)}/${order.unit}',
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                  ),
                                ),
                                Expanded(
                                  flex: 3,
                                  child: Text(
                                    '₹${amt.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),

                        // Table Footer (Order value)
                        Container(
                          color: const Color(0xFFF8FAF8),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Order value',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)),
                              ),
                              Text(
                                '₹${finalOrderValue.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
                                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Card 3: Order QR Card (Matching Screenshot 2)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order QR',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // QR Code Image
                              Container(
                                width: 175,
                                height: 175,
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(color: const Color(0xFFE5E7EB)),
                                ),
                                child: Image.network(
                                  'https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${Uri.encodeComponent(qrPayload)}',
                                  width: 165,
                                  height: 165,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) => const Center(
                                    child: Icon(Icons.qr_code_2_rounded, size: 140, color: Color(0xFF1F2937)),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                qrPayload,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$farmerDisplayName · ${order.productName}${order.variety.isNotEmpty ? " · ${order.variety}" : ""}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF6B7280),
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Scan to view full order',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stacked Action Buttons (Matching Screenshot 2)
                  if (canAccept) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF007A4D),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: _isBusy ? null : () => _showAcceptDialog(order),
                        child: const Text('Accept', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  if (canPrepare) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF007A4D),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OrderPrepareScreen(orderId: order.id),
                            ),
                          );
                        },
                        child: const Text('Prepare', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  if (canReject) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: _isBusy ? null : () => _showRejectDialog(order),
                        child: const Text('Reject', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0F172A),
                        side: const BorderSide(color: Color(0xFFD1D5DB)),
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Back', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
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
}

class _FactBox extends StatelessWidget {
  final String label;
  final String value;

  const _FactBox({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAF8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
          ),
        ],
      ),
    );
  }
}
