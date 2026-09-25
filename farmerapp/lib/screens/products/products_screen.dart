import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/widgets/app_loader.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'add_product_screen.dart';
import 'product_detail_screen.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../main_shell.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  String _selectedStatusFilter = 'All';
  String _searchQuery = '';

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

  void _confirmDeleteProduct(ProductItem product) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text(
          'Delete product?',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        content: const Text(
          'Only draft products can be deleted. This cannot be undone.',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF475569),
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
              FarmerState().deleteProduct(product.id);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Product "${product.productName}" deleted successfully'),
                  backgroundColor: const Color(0xFFDC2626),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        List<ProductItem> products = [];
        try {
          final allProducts = FarmerState().products;
          products = allProducts.where((p) {
            final pStatus = (p.status.isNotEmpty ? p.status : 'Active').toLowerCase();
            final isOos = pStatus.contains('out of stock') || p.stockQuantity <= 0;

            bool matchesStatus = false;
            if (_selectedStatusFilter == 'All') {
              matchesStatus = true;
            } else if (_selectedStatusFilter == 'Out of Stock') {
              matchesStatus = isOos;
            } else if (_selectedStatusFilter == 'Active') {
              matchesStatus = !isOos && (pStatus == 'active' || pStatus == 'published');
            } else {
              matchesStatus = pStatus == _selectedStatusFilter.toLowerCase();
            }

            final q = _searchQuery.toLowerCase().trim();
            final pName = (p.productName.isNotEmpty ? p.productName : '').toLowerCase();
            final pVar = (p.variety.isNotEmpty ? p.variety : '').toLowerCase();
            final pCrop = (p.cropLinked.isNotEmpty ? p.cropLinked : '').toLowerCase();
            final pBid = (p.displayBusinessId).toLowerCase();
            final matchesSearch = q.isEmpty ||
                pName.contains(q) ||
                pVar.contains(q) ||
                pCrop.contains(q) ||
                pBid.contains(q);
            return matchesStatus && matchesSearch;
          }).toList();
        } catch (_) {
          products = FarmerState().products;
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.menu, color: Color(0xFF217346)),
              tooltip: 'Menu',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text(
              'My Products (माझी उत्पादने)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.add, color: Color(0xFF217346)),
                tooltip: 'Add Product',
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                },
              ),
            ],
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                // 1. Search Input + Add Product Button in 1 Row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: 'Search crop, variety, or product ID...',
                            hintStyle: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                            prefixIcon: Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(vertical: 9, horizontal: 8),
                          ),
                          onChanged: (val) => setState(() => _searchQuery = val),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 40,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF217346),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Add Product', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // 3. Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Active', 'Out of Stock', 'Published', 'Draft', 'Paused'].map((status) {
                      final isSelected = _selectedStatusFilter == status;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(
                            status,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                              color: isSelected ? Colors.white : const Color(0xFF334155),
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: const Color(0xFF217346),
                          backgroundColor: Colors.white,
                          side: BorderSide(
                            color: isSelected ? const Color(0xFF217346) : const Color(0xFFCBD5E1),
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _selectedStatusFilter = status);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 12),

                // 4. Products List
                if (products.isEmpty && FarmerState().products.isEmpty && !FarmerState().productsReady)
                  const AppLoader(message: 'उत्पादने लोड होत आहेत...')
                else if (products.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Center(
                            child: Icon(Icons.inventory_2_outlined, size: 22, color: Color(0xFF065F46)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'No products yet',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'Create a product from a crop to start listing harvest.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 14),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF217346),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.add, size: 15),
                          label: const Text('Add Product', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                          },
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return _buildProductCard(context, product);
                    },
                  ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      );
    },
  );
}

  Widget _buildProductCard(BuildContext context, ProductItem product) {
    try {
      final statusStr = product.status.isNotEmpty ? product.status : 'Active';
      final isOutOfStock = statusStr.toLowerCase().contains('out of stock') || product.stockQuantity <= 0;
      final statusText = isOutOfStock
          ? 'Out of Stock'
          : (statusStr.toLowerCase() == 'published' ? 'Active' : statusStr);

      Color statusColor;
      if (isOutOfStock || statusStr.toLowerCase() == 'rejected') {
        statusColor = const Color(0xFFDC2626);
      } else if (statusStr.toLowerCase() == 'active' || statusStr.toLowerCase() == 'published') {
        statusColor = const Color(0xFF059669);
      } else if (statusStr.toLowerCase() == 'paused') {
        statusColor = const Color(0xFFD97706);
      } else {
        statusColor = const Color(0xFF64748B);
      }

      final pName = product.productName.isNotEmpty ? product.productName : 'Product';
      final pVariety = product.variety;
      final pBid = product.displayBusinessId;
      final pStock = product.stockQuantity;
      final pUnit = product.unit.isNotEmpty ? product.unit : 'Kg';
      final pHarvest = product.harvestDate.isNotEmpty ? product.harvestDate : 'Available';

      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar/Image + Details + Status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo / Thumbnail
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _buildProductThumbnail(product, pName),
                ),
                const SizedBox(width: 12),

                // Title, Variety, ID, Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and Status
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text.rich(
                              TextSpan(
                                text: pName,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                                children: [
                                  if (pVariety.isNotEmpty)
                                    TextSpan(
                                      text: ' · $pVariety',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF64748B),
                                        fontSize: 14,
                                      ),
                                    ),
                                ],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            statusText,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),

                      // Product Business ID with Copy Icon
                      InkWell(
                        onTap: () => _copyId(pBid),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              pBid,
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF059669),
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.copy_outlined, size: 13, color: Color(0xFF059669)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 3),

                      // Subtitle: Quantity · Harvest Date
                      Text(
                        '${pStock.toStringAsFixed(0)} $pUnit · $pHarvest',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          const SizedBox(height: 12),

          // Action Buttons: View, Edit, Delete (3 columns)
          Row(
            children: [
              Expanded(
                child: _buildCardButton(
                  label: 'View',
                  textColor: const Color(0xFF1E293B),
                  borderColor: const Color(0xFFE2E8F0),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildCardButton(
                  label: 'Edit',
                  textColor: const Color(0xFF1E293B),
                  borderColor: const Color(0xFFE2E8F0),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => AddProductScreen(editingProduct: product)),
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildCardButton(
                  label: 'Delete',
                  textColor: const Color(0xFFDC2626),
                  borderColor: const Color(0xFFFECDD3),
                  onTap: () => _confirmDeleteProduct(product),
                ),
              ),
            ],
          ),
        ],
      ),
    );
    } catch (_) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildProductThumbnail(ProductItem product, String pName) {
    final img = product.imageUrl.isNotEmpty
        ? product.imageUrl
        : (product.photos.isNotEmpty ? product.photos.first : '');

    return AppImageWidget(
      imageStr: img,
      fit: BoxFit.cover,
      fallback: _buildPlaceholderIcon(pName),
    );
  }

  Widget _buildPlaceholderIcon(String name) {
    final lower = name.toLowerCase();
    Color bg = const Color(0xFFDCFCE7);
    Color fg = const Color(0xFF059669);
    IconData icon = Icons.eco_outlined;

    if (lower.contains('tomato')) {
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFFDC2626);
      icon = Icons.circle;
    } else if (lower.contains('onion')) {
      bg = const Color(0xFFF3E8FF);
      fg = const Color(0xFF7E22CE);
      icon = Icons.blur_circular_outlined;
    } else if (lower.contains('brinjal') || lower.contains('eggplant')) {
      bg = const Color(0xFFEDE9FE);
      fg = const Color(0xFF6D28D9);
      icon = Icons.spa_outlined;
    }

    return Container(
      color: bg,
      child: Center(
        child: Icon(icon, size: 24, color: fg),
      ),
    );
  }

  Widget _buildCardButton({
    required String label,
    required Color textColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      height: 34,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          foregroundColor: textColor,
          backgroundColor: Colors.white,
          side: BorderSide(color: borderColor, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        onPressed: onTap,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

