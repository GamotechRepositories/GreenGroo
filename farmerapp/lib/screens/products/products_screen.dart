import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/widgets/app_loader.dart';
import '../../core/widgets/skeleton_loader.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'add_product_screen.dart';
import 'product_detail_screen.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../main_shell.dart';
import '../../services/app_language.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedStatusFilter = 'All';
  String _searchQuery = '';

  String _translateStatus(String s) {
    final lang = AppLanguage();
    switch (s.toLowerCase()) {
      case 'all': return lang.tr(mr: 'सर्व', en: 'All');
      case 'active': return lang.tr(mr: 'सक्रिय', en: 'Active');
      case 'out of stock': return lang.tr(mr: 'स्टॉक संपला', en: 'Out of Stock');
      case 'published': return lang.tr(mr: 'प्रकाशित', en: 'Published');
      case 'draft': return lang.tr(mr: 'मसुदा', en: 'Draft');
      case 'paused': return lang.tr(mr: 'थांबवले', en: 'Paused');
      default: return s;
    }
  }




  void _copyId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLanguage().tr(mr: 'उत्पादन आयडी "$id" क्लिपबोर्डवर कॉपी केला!', en: 'Product ID "$id" copied to clipboard!')),
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
        title: Text(
          AppLanguage().tr(mr: 'उत्पादन हटवायचे?', en: 'Delete product?'),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        content: Text(
          AppLanguage().tr(mr: 'फक्त मसुदा (Draft) उत्पादने हटविली जाऊ शकतात. ही क्रिया पूर्ववत करता येणार नाही.', en: 'Only draft products can be deleted. This cannot be undone.'),
          style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF475569),
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppLanguage().tr(mr: 'रद्द करा', en: 'Cancel'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
                  content: Text(AppLanguage().tr(mr: 'उत्पादन "${product.productName}" यशस्वीरित्या हटवले', en: 'Product "${product.productName}" deleted successfully')),
                  backgroundColor: const Color(0xFFDC2626),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            child: Text(AppLanguage().tr(mr: 'हटवा', en: 'Delete'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
        final state = FarmerState();
        final isLoading = !state.isPreferencesLoaded || (state.isLoadingFromBackend && !state.productsReady);
        if (isLoading) {
          return const ProductsSkeletonLoader();
        }

        List<ProductItem> products = [];
        try {
          final allProducts = state.products;
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

        final lang = AppLanguage();
        return Scaffold(
          key: _scaffoldKey,
          drawer: const FarmerSidebarDrawer(),
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.menu, color: Color(0xFF217346)),
              tooltip: lang.tr(mr: 'मेनू उघडा', en: 'Open Menu'),
              onPressed: () {
                if (_scaffoldKey.currentState != null) {
                  _scaffoldKey.currentState!.openDrawer();
                } else {
                  MainShell.openDrawer(context);
                }
              },
            ),
            title: Text(
              lang.tr(mr: 'माझी उत्पादने', en: 'My Products'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.add, color: Color(0xFF217346)),
                tooltip: lang.tr(mr: 'उत्पादन जोडा', en: 'Add Product'),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                },
              ),
            ],
          ),
          body: SafeArea(
            child: RefreshIndicator(
              color: const Color(0xFF217346),
              onRefresh: () => FarmerState().refreshProducts(),
              child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 🌟 TOP HERO BANNER WITH PRODUCTS BACKGROUND
                  Container(
                    width: double.infinity,
                    height: 130,
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.asset(
                            'assets/images/my_products_banner_bg.png',
                            fit: BoxFit.cover,
                            alignment: Alignment.center,
                            errorBuilder: (context, error, stackTrace) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF166534), Color(0xFF15803D)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                            ),
                          ),
                          // Gradient overlay for contrast
                          Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  stops: const [0.0, 0.55, 1.0],
                                  colors: [
                                    Colors.black.withValues(alpha: 0.72),
                                    Colors.black.withValues(alpha: 0.45),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF16A34A),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        lang.tr(mr: '📦 उत्पादन विक्री', en: '📦 Produce Market'),
                                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      lang.tr(
                                        mr: '${products.length} उत्पादने सूचीबद्ध',
                                        en: '${products.length} Products Listed',
                                      ),
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  lang.tr(mr: 'माझी उत्पादने, थेट बाजारपेठ', en: 'My Products, Direct Market'),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  lang.tr(
                                    mr: 'ताजी फळे, भाजीपाला व दर्जेदार शेतमाल थेट ग्राहकांपर्यंत!',
                                    en: 'Fresh produce & quality crops directly to customers!',
                                  ),
                                  style: const TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFFE2E8F0),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

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
                          decoration: InputDecoration(
                            hintText: lang.tr(mr: 'पीक, वाण किंवा उत्पादन आयडी शोधा...', en: 'Search crop, variety, or product ID...'),
                            hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
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
                        label: Text(lang.tr(mr: 'उत्पादन जोडा', en: 'Add Product'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
                            _translateStatus(status),
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
                  AppLoader(message: lang.tr(mr: 'उत्पादने लोड होत आहेत...', en: 'Loading products...'))
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
                          label: Text(lang.tr(mr: 'उत्पादन जोडा', en: 'Add Product'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
                    separatorBuilder: (_, index) => const SizedBox(height: 8),
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
        ),
      );
    },
  );
}

  Widget _buildProductCard(BuildContext context, ProductItem product) {
    final lang = AppLanguage();
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
                            _translateStatus(statusText),
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
                  label: lang.tr(mr: 'पहा', en: 'View'),
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
                  label: lang.tr(mr: 'बदल', en: 'Edit'),
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
                  label: lang.tr(mr: 'हटवा', en: 'Delete'),
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

