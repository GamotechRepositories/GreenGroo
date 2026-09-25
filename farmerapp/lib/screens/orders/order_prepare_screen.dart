import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';

class OrderPrepareScreen extends StatefulWidget {
  final String orderId;

  const OrderPrepareScreen({super.key, required this.orderId});

  @override
  State<OrderPrepareScreen> createState() => _OrderPrepareScreenState();
}

class _OrderPrepareScreenState extends State<OrderPrepareScreen> {
  final _packedQtyCtrl = TextEditingController();
  final _packageCountCtrl = TextEditingController();
  final _packageWeightCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _packageType = 'Crate';
  final List<String> _packageTypes = ['Crate', 'Box', 'Gunny Bag', 'Pouch', 'Carton', 'Other'];
  DateTime _packingDate = DateTime.now();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final orders = FarmerState().orders;
    final order = orders.firstWhere(
      (o) => o.id == widget.orderId || o.orderCode == widget.orderId,
      orElse: () => FarmerOrderItem(
        id: widget.orderId,
        orderCode: widget.orderId,
        buyerName: '',
        buyerPhone: '',
        productName: '',
        quantity: 0,
        unit: 'Kg',
        totalAmount: 0,
        status: '',
        pickupDate: '',
        pickupSlot: '',
        createdAt: '',
      ),
    );

    _packedQtyCtrl.text = order.quantity.toStringAsFixed(0);
    _packageCountCtrl.text = (order.quantity / 20).ceil().toString();
    _packageWeightCtrl.text = '20';
  }

  @override
  void dispose() {
    _packedQtyCtrl.dispose();
    _packageCountCtrl.dispose();
    _packageWeightCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectPackingDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _packingDate,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF217346),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2937),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _packingDate = picked);
    }
  }

  Future<void> _markReady(FarmerOrderItem order) async {
    setState(() => _isSaving = true);
    try {
      final packedQty = double.tryParse(_packedQtyCtrl.text) ?? order.quantity;
      final packageCount = int.tryParse(_packageCountCtrl.text) ?? 1;
      final packageWeight = double.tryParse(_packageWeightCtrl.text) ?? 0.0;
      final packingDateStr = '${_packingDate.year}-${_packingDate.month.toString().padLeft(2, '0')}-${_packingDate.day.toString().padLeft(2, '0')}';

      await FarmerState().packOrder(
        order.id,
        packedQuantity: packedQty,
        packageCount: packageCount,
        packageType: _packageType,
        packageWeight: packageWeight,
        packingDate: packingDateStr,
        notes: _notesCtrl.text.trim(),
      );

      await FarmerState().readyOrder(order.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order marked ready for pickup! (पिकअपसाठी तयार)'),
            backgroundColor: Color(0xFF217346),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final orders = FarmerState().orders;
        final order = orders.firstWhere(
          (o) => o.id == widget.orderId || o.orderCode == widget.orderId,
          orElse: () => FarmerOrderItem(
            id: widget.orderId,
            orderCode: widget.orderId,
            buyerName: '',
            buyerPhone: '',
            productName: '',
            quantity: 0,
            unit: 'Kg',
            totalAmount: 0,
            status: '',
            pickupDate: '',
            pickupSlot: '',
            createdAt: '',
          ),
        );

        final packingDateFormatted = '${_packingDate.day.toString().padLeft(2, '0')}/${_packingDate.month.toString().padLeft(2, '0')}/${_packingDate.year}';

        return Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF217346)),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'Order Preparation',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
            ),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary Card
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF8FAF8),
                            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                            border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Order Info', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                              Text(
                                order.orderCode,
                                style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF217346)),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            children: [
                              _SummaryRow(label: 'Product', value: '${order.productName}${order.variety.isNotEmpty ? " (${order.variety})" : ""}'),
                              const SizedBox(height: 8),
                              _SummaryRow(label: 'Ordered Quantity', value: '${order.quantity.toStringAsFixed(0)} ${order.unit}'),
                              const SizedBox(height: 8),
                              _SummaryRow(label: 'Pickup Slot', value: '${order.pickupDate} • ${order.pickupSlot}'),
                              const SizedBox(height: 8),
                              _SummaryRow(label: 'Buyer', value: order.buyerName),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Packing Details Form Panel
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF8FAF8),
                            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                            border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
                          ),
                          child: const Text('Packing & Lot Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Packed Qty & Package Count
                              Row(
                                children: [
                                  Expanded(
                                    child: _FormField(
                                      label: 'Packed Quantity (${order.unit}) *',
                                      controller: _packedQtyCtrl,
                                      keyboardType: TextInputType.number,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: _FormField(
                                      label: 'Number of Packages *',
                                      controller: _packageCountCtrl,
                                      keyboardType: TextInputType.number,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Package Type & Weight
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Package Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
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
                                              value: _packageType,
                                              items: _packageTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 13)))).toList(),
                                              onChanged: (val) {
                                                if (val != null) setState(() => _packageType = val);
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: _FormField(
                                      label: 'Per Package (${order.unit})',
                                      controller: _packageWeightCtrl,
                                      keyboardType: TextInputType.number,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Packing Date Picker
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Packing Date', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                                  const SizedBox(height: 6),
                                  InkWell(
                                    onTap: () => _selectPackingDate(context),
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        border: Border.all(color: const Color(0xFFD4D4D4)),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(packingDateFormatted, style: const TextStyle(fontSize: 13, color: Color(0xFF1F2937))),
                                          const Icon(Icons.calendar_today, size: 16, color: Color(0xFF217346)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Notes
                              _FormField(
                                label: 'Packing Notes (Optional)',
                                controller: _notesCtrl,
                                maxLines: 2,
                                hintText: 'e.g. Graded into 15 crates with moisture wrapping',
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF374151),
                            side: const BorderSide(color: Color(0xFFD1D5DB)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Back', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF217346),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: _isSaving
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.check_circle_outline, size: 18),
                          label: Text(
                            _isSaving ? 'Saving...' : 'Mark Ready for Pickup',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          onPressed: _isSaving ? null : () => _markReady(order),
                        ),
                      ),
                    ],
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

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
      ],
    );
  }
}

class _FormField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final int maxLines;
  final String? hintText;

  const _FormField({
    required this.label,
    required this.controller,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
    this.hintText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: const TextStyle(fontSize: 13, color: Color(0xFF1F2937)),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(fontSize: 12, color: AppColors.muted),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD4D4D4))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD4D4D4))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF217346), width: 1.5)),
          ),
        ),
      ],
    );
  }
}
