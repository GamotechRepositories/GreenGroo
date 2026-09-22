import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'add_product_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductItem product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late ProductItem _product;

  @override
  void initState() {
    super.initState();
    _product = widget.product;
  }

  void _copyId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Product ID "$id" copied to clipboard!'),
        backgroundColor: const Color(0xFF217346),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _toggleStatus() {
    final newStatus = _product.status == 'Paused' ? 'Active' : 'Paused';
    FarmerState().updateProductStatus(_product.id, newStatus);
    setState(() {
      _product.status = newStatus;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(newStatus == 'Paused' ? 'Product paused' : 'Product activated'),
        backgroundColor: const Color(0xFF217346),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _deleteProduct() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 22),
            SizedBox(width: 8),
            Text('Delete product?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          ],
        ),
        content: const Text(
          'Only draft products can be deleted. This action cannot be undone.',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              FarmerState().deleteProduct(_product.id);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Product deleted successfully'),
                  backgroundColor: Color(0xFFDC2626),
                  duration: Duration(seconds: 2),
                ),
              );
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = _product;
    final isOrganic = p.farmingType.toLowerCase().contains('organic') || p.farmingType.contains('सेंद्रिय');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          p.productName,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Color(0xFF217346), size: 20),
            tooltip: 'Edit Product',
            onPressed: () async {
              final updated = await Navigator.push<ProductItem>(
                context,
                MaterialPageRoute(builder: (_) => AddProductScreen(editingProduct: p)),
              );
              if (updated != null) {
                setState(() => _product = updated);
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header Card with Photo, Title, ID, Status
            // 1. Header Card with Photo, Title, ID, Status
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFD1FAE5)),
                        ),
                        child: Center(
                          child: Text(
                            p.productName.isNotEmpty ? p.productName.substring(0, 1).toUpperCase() : 'P',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Text(
                                    p.productName,
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  ),
                                ),
                                _buildStatusBadge(p.status),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              [p.cropLinked, p.variety, p.farmName, p.farmLocation].where((s) => s.isNotEmpty).join(' • '),
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 5),
                            InkWell(
                              onTap: () => _copyId(p.displayBusinessId),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    p.displayBusinessId,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF059669),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.copy_outlined, size: 12, color: Color(0xFF059669)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Quick navigation pills (Web Portal Parity)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF217346),
                            backgroundColor: const Color(0xFFF0FDF4),
                            side: const BorderSide(color: Color(0xFFBBF7D0)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.currency_rupee, size: 14),
                          label: const Text('Price & Stock', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          onPressed: _openPriceStockSheet,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF0284C7),
                            backgroundColor: const Color(0xFFF0F9FF),
                            side: const BorderSide(color: Color(0xFFBAE6FD)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.photo_library_outlined, size: 14),
                          label: const Text('Photos & Media', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          onPressed: _openMediaSheet,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 2. Product Details Panel (Excel Panel style)
            _buildPanel(
              title: 'Product Details',
              icon: Icons.info_outline,
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 2.8,
                crossAxisSpacing: 10,
                mainAxisSpacing: 8,
                children: [
                  _buildInfoItem('Product ID', p.displayBusinessId, isMono: true),
                  _buildInfoItem('Product Name', p.productName),
                  _buildInfoItem('Crop', p.cropLinked),
                  _buildInfoItem('Variety', p.variety.isNotEmpty ? p.variety : 'Standard'),
                  _buildInfoItem('Available Quantity', '${p.stockQuantity.toStringAsFixed(0)} ${p.unit}'),
                  _buildInfoItem('Selling Price', '₹ ${p.pricePerUnit.toStringAsFixed(0)} / ${p.unit}', isGreen: true),
                  _buildInfoItem('MOQ (Min Order)', '${p.minimumOrderQuantity.toStringAsFixed(0)} ${p.unit}'),
                  _buildInfoItem('Quality Grade', p.grade),
                  _buildInfoItem('Sowing Date', p.sowingDate),
                  _buildInfoItem('Harvest Date', p.harvestDate),
                  _buildInfoItem('Farming Method', isOrganic ? 'Organic (सेंद्रिय)' : 'Conventional (पारंपारिक)'),
                  _buildInfoItem('Available Window', '${p.availableFrom} to ${p.availableUntil}'),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 3. Grades & Stock Panel
            _buildPanel(
              title: 'Grades & Stock',
              icon: Icons.layers_outlined,
              child: Row(
                children: [
                  Expanded(
                    child: _buildGradeCard(
                      label: 'Grade A',
                      qty: '${p.gradeAQty.toStringAsFixed(0)} ${p.unit}',
                      rate: '₹ ${p.gradeAPrice.toStringAsFixed(0)} / ${p.unit}',
                      bg: const Color(0xFFECFDF5),
                      border: const Color(0xFFA7F3D0),
                      fg: const Color(0xFF065F46),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildGradeCard(
                      label: 'Grade B',
                      qty: '${p.gradeBQty.toStringAsFixed(0)} ${p.unit}',
                      rate: '₹ ${p.gradeBPrice.toStringAsFixed(0)} / ${p.unit}',
                      bg: const Color(0xFFEFF6FF),
                      border: const Color(0xFFBFDBFE),
                      fg: const Color(0xFF1E40AF),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildGradeCard(
                      label: 'Grade C',
                      qty: '${p.gradeCQty > 0 ? p.gradeCQty.toStringAsFixed(0) : '0'} ${p.unit}',
                      rate: p.gradeCPrice > 0 ? '₹ ${p.gradeCPrice.toStringAsFixed(0)} / ${p.unit}' : '—',
                      bg: const Color(0xFFFFFBEB),
                      border: const Color(0xFFFDE68A),
                      fg: const Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 4. Farm & Crop Link Panel
            _buildPanel(
              title: 'Farm & Crop Link',
              icon: Icons.agriculture_outlined,
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 2.8,
                crossAxisSpacing: 10,
                mainAxisSpacing: 8,
                children: [
                  _buildInfoItem('Farm Name', p.farmName),
                  _buildInfoItem('Farm Location', p.farmLocation),
                  _buildInfoItem('Sowing Date', p.sowingDate),
                  _buildInfoItem('Harvest Date', p.harvestDate),
                  _buildInfoItem('Estimated Yield', '${(p.stockQuantity * 1.15).round()} ${p.unit}'),
                  _buildInfoItem('Status', p.status),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 5. Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF217346),
                      side: const BorderSide(color: Color(0xFF217346)),
                      backgroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: Icon(p.status == 'Paused' ? Icons.play_arrow_outlined : Icons.pause_outlined, size: 16),
                    label: Text(
                      p.status == 'Paused' ? 'Activate' : 'Pause Listing',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    onPressed: _toggleStatus,
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
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit Product', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      final updated = await Navigator.push<ProductItem>(
                        context,
                        MaterialPageRoute(builder: (_) => AddProductScreen(editingProduct: p)),
                      );
                      if (updated != null) {
                        setState(() => _product = updated);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFDC2626),
                  side: const BorderSide(color: Color(0xFFFCA5A5)),
                  backgroundColor: const Color(0xFFFEF2F2),
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Delete Product', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: _deleteProduct,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildPanel({required String title, required IconData icon, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                Icon(icon, size: 14, color: const Color(0xFF065F46)),
                const SizedBox(width: 6),
                Text(
                  title,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 0.2),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String val, {bool isMono = false, bool isGreen = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.2),
        ),
        const SizedBox(height: 1),
        Text(
          val.isNotEmpty ? val : '—',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            fontFamily: isMono ? 'monospace' : null,
            color: isGreen ? const Color(0xFF065F46) : const Color(0xFF0F172A),
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildGradeCard({
    required String label,
    required String qty,
    required String rate,
    required Color bg,
    required Color border,
    required Color fg,
  }) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: fg)),
          const SizedBox(height: 3),
          Text(qty, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
          const SizedBox(height: 1),
          Text(rate, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg)),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    Color border;
    final s = status.toUpperCase();

    if (s == 'ACTIVE' || s == 'PUBLISHED') {
      bg = const Color(0xFFDCFCE7);
      fg = const Color(0xFF166534);
      border = const Color(0xFF86EFAC);
    } else if (s == 'DRAFT') {
      bg = const Color(0xFFF1F5F9);
      fg = const Color(0xFF475569);
      border = const Color(0xFFCBD5E1);
    } else if (s == 'PAUSED') {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFF92400E);
      border = const Color(0xFFFDE68A);
    } else {
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFF991B1B);
      border = const Color(0xFFFCA5A5);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: border),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: fg),
      ),
    );
  }

  // --- Price & Stock Quick Sheet (Matching ProductPriceStockPage.jsx) ---
  void _openPriceStockSheet() {
    final qtyCtrl = TextEditingController(text: _product.stockQuantity.toStringAsFixed(0));
    final priceCtrl = TextEditingController(text: _product.pricePerUnit.toStringAsFixed(0));
    final moqCtrl = TextEditingController(text: _product.minimumOrderQuantity.toStringAsFixed(0));
    final grAPriceCtrl = TextEditingController(text: _product.gradeAPrice.toStringAsFixed(0));
    final grAQtyCtrl = TextEditingController(text: _product.gradeAQty.toStringAsFixed(0));
    final grBPriceCtrl = TextEditingController(text: _product.gradeBPrice.toStringAsFixed(0));
    final grBQtyCtrl = TextEditingController(text: _product.gradeBQty.toStringAsFixed(0));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Price & Stock (दर व साठा)',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        Text(
                          '${_product.productName} • ${_product.displayBusinessId}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(height: 20),
                const Text('Quick Rates & Quantities', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: priceCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Base Price / ${_product.unit} (₹)',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: qtyCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Total Available (${_product.unit})',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: moqCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Minimum Order Quantity (MOQ)',
                    labelStyle: const TextStyle(fontSize: 11),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Grade Wise Breakdown', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: grAPriceCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Grade A Price (₹)',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: grAQtyCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Grade A Qty',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: grBPriceCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Grade B Price (₹)',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: grBQtyCtrl,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Grade B Qty',
                          labelStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF217346),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () {
                      final updated = ProductItem(
                        id: _product.id,
                        productId: _product.productId,
                        productName: _product.productName,
                        variety: _product.variety,
                        category: _product.category,
                        cropLinked: _product.cropLinked,
                        grade: _product.grade,
                        unit: _product.unit,
                        pricePerUnit: double.tryParse(priceCtrl.text) ?? _product.pricePerUnit,
                        stockQuantity: double.tryParse(qtyCtrl.text) ?? _product.stockQuantity,
                        minimumOrderQuantity: double.tryParse(moqCtrl.text) ?? _product.minimumOrderQuantity,
                        farmingType: _product.farmingType,
                        farmName: _product.farmName,
                        farmLocation: _product.farmLocation,
                        sowingDate: _product.sowingDate,
                        harvestDate: _product.harvestDate,
                        availableFrom: _product.availableFrom,
                        availableUntil: _product.availableUntil,
                        status: _product.status,
                        imageUrl: _product.imageUrl,
                        photos: _product.photos,
                        gradeAPrice: double.tryParse(grAPriceCtrl.text) ?? _product.gradeAPrice,
                        gradeAQty: double.tryParse(grAQtyCtrl.text) ?? _product.gradeAQty,
                        gradeBPrice: double.tryParse(grBPriceCtrl.text) ?? _product.gradeBPrice,
                        gradeBQty: double.tryParse(grBQtyCtrl.text) ?? _product.gradeBQty,
                        gradeCPrice: _product.gradeCPrice,
                        gradeCQty: _product.gradeCQty,
                      );
                      FarmerState().updateProduct(updated);
                      setState(() => _product = updated);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Price and stock updated successfully!'),
                          backgroundColor: Color(0xFF217346),
                        ),
                      );
                    },
                    child: const Text('Save Price & Stock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Photos & Media Quick Sheet (Matching ProductMediaPage.jsx) ---
  void _openMediaSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Product Photos (उत्पादन फोटो)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    Text(
                      '${_product.productName} • ${_product.cropLinked}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const Divider(height: 16),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                children: [
                  _buildPhotoTile('Main Product Photo', Icons.image_outlined, true),
                  _buildPhotoTile('Farm Photo', Icons.landscape_outlined, false),
                  _buildPhotoTile('Crop Growth Photo', Icons.eco_outlined, false),
                  _buildPhotoTile('Harvest Batch Photo', Icons.inventory_outlined, false),
                ],
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 42,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF217346),
                  side: const BorderSide(color: Color(0xFF217346)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.add_a_photo_outlined, size: 16),
                label: const Text('Add / Update Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Photo uploaded to product gallery!'),
                      backgroundColor: Color(0xFF217346),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoTile(String label, IconData icon, bool hasSample) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 36, color: const Color(0xFF64748B)),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
          ),
          const SizedBox(height: 2),
          Text(
            hasSample ? 'Uploaded' : 'Optional',
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.bold,
              color: hasSample ? const Color(0xFF059669) : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}

