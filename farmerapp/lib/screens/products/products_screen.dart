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

class _ProductsScreenState extends State<ProductsScreen> with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late TabController _tabController;

  // Filter & Search for My Products (Tab 1)
  String _selectedStatusFilter = 'All';
  String _searchQuery = '';

  // Filter & Search for All/Vendor Products (Tab 0)
  String _vendorSearchQuery = '';
  String _selectedVendorFilter = 'All'; // 'All', 'Available', 'Pending', 'Added'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FarmerState().fetchVendorAvailableProducts();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _translateStatus(String s) {
    final lang = AppLanguage();
    switch (s.toLowerCase()) {
      case 'all': return lang.tr(mr: 'सर्व', en: 'All');
      case 'active': return lang.tr(mr: 'सक्रिय', en: 'Active');
      case 'pending approval':
      case 'pending': return lang.tr(mr: 'मंजुरी प्रलंबित', en: 'Pending Approval');
      case 'out of stock': return lang.tr(mr: 'स्टॉक संपला', en: 'Out of Stock');
      case 'published': return lang.tr(mr: 'प्रकाशित', en: 'Published');
      case 'draft': return lang.tr(mr: 'मसुदा', en: 'Draft');
      case 'paused': return lang.tr(mr: 'थांबवले', en: 'Paused');
      case 'rejected': return lang.tr(mr: 'नाकारले', en: 'Rejected');
      case 'available': return lang.tr(mr: 'नवीन उपलब्ध', en: 'Available');
      case 'added': return lang.tr(mr: 'समाविष्ट', en: 'Added');
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
          AppLanguage().tr(mr: 'फक्त मसुदा किंवा प्रलंबित उत्पादने काढली जाऊ शकतात. ही क्रिया पूर्ववत करता येणार नाही.', en: 'Only draft or pending products can be deleted. This cannot be undone.'),
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
                  content: Text(AppLanguage().tr(mr: 'उत्पादन "${product.productName}" हटवले', en: 'Product "${product.productName}" deleted')),
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
    final lang = AppLanguage();

    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final state = FarmerState();
        final isLoading = !state.isPreferencesLoaded || (state.isLoadingFromBackend && !state.productsReady);
        if (isLoading) {
          return const ProductsSkeletonLoader();
        }

        final vendorProducts = state.vendorAvailableProducts;
        final myProducts = state.products;

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
              lang.tr(mr: 'उत्पादने व्यवस्थापन', en: 'Products Management'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.add_circle_outline, color: Color(0xFF217346)),
                tooltip: lang.tr(mr: 'उत्पादन जोडा', en: 'Add Product'),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF217346),
              unselectedLabelColor: const Color(0xFF64748B),
              indicatorColor: const Color(0xFF217346),
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.storefront_outlined, size: 17),
                      const SizedBox(width: 6),
                      Text('${lang.tr(mr: 'सर्व उत्पादने', en: 'All Products')} (${vendorProducts.length})'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.inventory_2_outlined, size: 17),
                      const SizedBox(width: 6),
                      Text('${lang.tr(mr: 'माझी उत्पादने', en: 'My Products')} (${myProducts.length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          body: SafeArea(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAllProductsTab(context, state, lang),
                _buildMyProductsTab(context, state, lang),
              ],
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // TAB 0: ALL PRODUCTS (व्हेंडरची उपलब्ध उत्पादने)
  // ==========================================
  Widget _buildAllProductsTab(BuildContext context, FarmerState state, AppLanguage lang) {
    final allVendorProds = state.vendorAvailableProducts;

    final filteredVendorProds = allVendorProds.where((p) {
      final isAdded = p['isAdded'] == true;
      final isPending = p['isPending'] == true;
      final isRejected = p['isRejected'] == true;

      // Status chip filter
      if (_selectedVendorFilter == 'Available' && (isAdded || isPending)) return false;
      if (_selectedVendorFilter == 'Pending' && !isPending) return false;
      if (_selectedVendorFilter == 'Added' && !isAdded) return false;

      // Search filter
      final q = _vendorSearchQuery.toLowerCase().trim();
      if (q.isNotEmpty) {
        final pName = (p['productName'] ?? p['name'] ?? '').toString().toLowerCase();
        final pCat = (p['category'] ?? '').toString().toLowerCase();
        final pVar = (p['variety'] ?? '').toString().toLowerCase();
        if (!pName.contains(q) && !pCat.contains(q) && !pVar.contains(q)) {
          return false;
        }
      }
      return true;
    }).toList();

    return RefreshIndicator(
      color: const Color(0xFF217346),
      onRefresh: () => state.fetchVendorAvailableProducts(force: true),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🌟 TOP HERO BANNER FOR VENDOR CATALOG
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(
                  colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF065F46).withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified, size: 12, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              lang.tr(mr: 'व्हेंडर कॅटलॉग', en: 'Vendor Catalog'),
                              style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Text(
                        lang.tr(
                          mr: '${allVendorProds.length} उत्पादने उपलब्ध',
                          en: '${allVendorProds.length} Products Available',
                        ),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white70),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    lang.tr(mr: 'सर्व मंजूर उत्पादने', en: 'All Vendor Products'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    lang.tr(
                      mr: 'तुमच्या जोडलेल्या व्हेंडरकडील उत्पादने निवडून विक्रीसाठी विनंती करा. मंजुरीनंतर ही उत्पादने तुमच्या "माझी उत्पादने" मध्ये सक्रिय होतील.',
                      en: 'Select products from your assigned vendor and request to sell with your price and stock. Approved items appear in "My Products".',
                    ),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFFE2E8F0),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar
            Container(
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: TextField(
                decoration: InputDecoration(
                  hintText: lang.tr(mr: 'व्हेंडरमधील उत्पादन किंवा वर्गवारी शोधा...', en: 'Search vendor product or category...'),
                  hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                ),
                onChanged: (val) => setState(() => _vendorSearchQuery = val),
              ),
            ),
            const SizedBox(height: 10),

            // Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', 'Available', 'Pending', 'Added'].map((status) {
                  final isSelected = _selectedVendorFilter == status;
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
                        if (selected) setState(() => _selectedVendorFilter = status);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),

            // Vendor Products Content
            if (state.vendorProductsLoading && allVendorProds.isEmpty)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Center(
                  child: Column(
                    children: [
                      const CircularProgressIndicator(color: Color(0xFF217346)),
                      const SizedBox(height: 12),
                      Text(lang.tr(mr: 'व्हेंडर उत्पादने लोड होत आहेत...', en: 'Loading vendor products...'),
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
              )
            else if (allVendorProds.isEmpty)
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
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.storefront_outlined, size: 26, color: Color(0xFF065F46)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      lang.tr(mr: 'व्हेंडर उत्पादने उपलब्ध नाहीत', en: 'No Vendor Products Found'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      lang.tr(
                        mr: 'तुमच्या संलग्न संकलन केंद्र / व्हेंडरमध्ये अजून कोणतीही उत्पादने मंजूर केलेली नाहीत किंवा तुम्हाला व्हेंडर जोडलेला नाही.',
                        en: 'No approved products found in your linked collection center / vendor.',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.refresh, size: 15),
                      label: Text(lang.tr(mr: 'रिफ्रेश करा', en: 'Refresh'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      onPressed: () => state.fetchVendorAvailableProducts(force: true),
                    ),
                  ],
                ),
              )
            else if (filteredVendorProds.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Center(
                  child: Text(
                    lang.tr(mr: 'शोध परिणामांशी जुळणारे कोणतेही उत्पादन सापडले नाही.', en: 'No products matched your search.'),
                    style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredVendorProds.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final vProd = filteredVendorProds[index];
                  return _buildVendorProductCard(context, vProd, lang);
                },
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  // Card for Vendor Catalog Product in Tab 0
  Widget _buildVendorProductCard(BuildContext context, Map<String, dynamic> item, AppLanguage lang) {
    final pName = (item['productName'] ?? item['name'] ?? lang.tr(mr: 'उत्पादन', en: 'Product')).toString();
    final pCategory = (item['category'] ?? '').toString();
    final pVariety = (item['variety'] ?? '').toString();
    final pUnit = (item['unit'] ?? 'Kg').toString();
    final pImage = (item['image'] ?? item['imageUrl'] ?? '').toString();

    final isAdded = item['isAdded'] == true;
    final isPending = item['isPending'] == true;
    final isRejected = item['isRejected'] == true;

    final num? refPrice = item['price'] != null ? num.tryParse(item['price'].toString()) : null;
    final num? refMrp = item['mrp'] != null ? num.tryParse(item['mrp'].toString()) : null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPending
              ? const Color(0xFFFDE68A)
              : (isAdded ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0)),
          width: (isPending || isAdded) ? 1.5 : 1.0,
        ),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                clipBehavior: Clip.antiAlias,
                child: AppImageWidget(
                  imageStr: pImage,
                  fit: BoxFit.cover,
                  fallback: _buildPlaceholderIcon(pName),
                ),
              ),
              const SizedBox(width: 12),

              // Title, Subtitle, Category
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      [
                        if (pCategory.isNotEmpty) pCategory,
                        if (pVariety.isNotEmpty) pVariety,
                      ].join(' · '),
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    if (refPrice != null && refPrice > 0)
                      Row(
                        children: [
                          Text(
                            '₹${refPrice.toStringAsFixed(0)} / $pUnit',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF059669),
                            ),
                          ),
                          if (refMrp != null && refMrp > refPrice) ...[
                            const SizedBox(width: 6),
                            Text(
                              '₹${refMrp.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF94A3B8),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      )
                    else
                      Text(
                        'युनिट: $pUnit',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Action Area / Status Badge
          Row(
            children: [
              if (isAdded) ...[
                // Already added & active
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle, size: 14, color: Color(0xFF16A34A)),
                      const SizedBox(width: 5),
                      Text(
                        lang.tr(mr: '✓ माझ्या उत्पादनात समाविष्ट', en: '✓ In My Products'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF166534),
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    // Switch to My Products tab
                    _tabController.animateTo(1);
                  },
                  child: Text(
                    lang.tr(mr: 'माझ्या यादीत पहा →', en: 'View in My List →'),
                    style: const TextStyle(fontSize: 12, color: Color(0xFF217346), fontWeight: FontWeight.bold),
                  ),
                ),
              ] else if (isPending) ...[
                // Pending Vendor Approval
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFCD34D)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.hourglass_top, size: 14, color: Color(0xFFD97706)),
                      const SizedBox(width: 5),
                      Text(
                        lang.tr(mr: '⏳ मंजुरी प्रलंबित', en: '⏳ Pending Approval'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF92400E),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    lang.tr(mr: 'व्हेंडरकडून मंजुरीची प्रतीक्षा आहे', en: 'Waiting for vendor review'),
                    style: const TextStyle(fontSize: 11, color: Color(0xFF78350F), fontStyle: FontStyle.italic),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ] else if (isRejected) ...[
                // Rejected -> Allow Re-Request
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    lang.tr(mr: 'अमान्य', en: 'Rejected'),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                  ),
                ),
                const Spacer(),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF217346),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.refresh, size: 14),
                  label: Text(
                    lang.tr(mr: 'पुन्हा विनंती करा', en: 'Request Again'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _openRequestProductSheet(context, item),
                ),
              ] else ...[
                // Fresh item -> Can request to add
                const Spacer(),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF217346),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.add_shopping_cart, size: 15),
                  label: Text(
                    lang.tr(mr: '+ विक्री विनंती पाठवा', en: '+ Request to Add'),
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _openRequestProductSheet(context, item),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: MY PRODUCTS (शेतकऱ्याची उत्पादने)
  // ==========================================
  Widget _buildMyProductsTab(BuildContext context, FarmerState state, AppLanguage lang) {
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
        } else if (_selectedStatusFilter == 'Pending Approval') {
          matchesStatus = pStatus.contains('pending');
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

    return RefreshIndicator(
      color: const Color(0xFF217346),
      onRefresh: () => state.refreshProducts(),
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

            // Search Input + Add Product Button
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
                        prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
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

            // Status Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', 'Active', 'Pending Approval', 'Out of Stock', 'Published', 'Draft', 'Paused'].map((status) {
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

            // Products List
            if (products.isEmpty && state.products.isEmpty && !state.productsReady)
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
                    Text(
                      AppLanguage().tr(mr: 'अजून उत्पादने नाहीत', en: 'No products yet'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      AppLanguage().tr(
                        mr: 'सर्व उत्पादने (व्हेंडर) टॅबमधून उत्पादन निवडून विनंती पाठवा किंवा नवीन जोडा.',
                        en: 'Request products from All Products tab or add a new product.',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF217346),
                            side: const BorderSide(color: Color(0xFF217346)),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.storefront, size: 15),
                          label: Text(lang.tr(mr: 'व्हेंडर कॅटलॉग पहा', en: 'Browse Vendor Catalog'),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onPressed: () => _tabController.animateTo(0),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF217346),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.add, size: 15),
                          label: Text(lang.tr(mr: 'उत्पादन जोडा', en: 'Add Product'),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                          },
                        ),
                      ],
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
    );
  }

  // BottomSheet modal to request adding a vendor catalog product
  void _openRequestProductSheet(BuildContext context, Map<String, dynamic> vProd) {
    final lang = AppLanguage();
    final pName = (vProd['productName'] ?? vProd['name'] ?? '').toString();
    final pCategory = (vProd['category'] ?? 'Vegetables').toString();
    final pVariety = (vProd['variety'] ?? '').toString();
    final pImage = (vProd['image'] ?? vProd['imageUrl'] ?? '').toString();
    final defaultUnit = (vProd['unit'] ?? 'Kg').toString();

    final num? refPrice = vProd['price'] != null ? num.tryParse(vProd['price'].toString()) : null;

    final priceCtrl = TextEditingController(text: refPrice != null && refPrice > 0 ? refPrice.toStringAsFixed(0) : '40');
    final stockCtrl = TextEditingController(text: '50');
    String selectedUnit = defaultUnit.isNotEmpty ? defaultUnit : 'Kg';
    String selectedGrade = 'Grade A';
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 14,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag Handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          lang.tr(mr: 'उत्पादन विक्रीसाठी विनंती', en: 'Request to Add Product'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Product Summary Card
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: AppImageWidget(
                              imageStr: pImage,
                              fit: BoxFit.cover,
                              fallback: _buildPlaceholderIcon(pName),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  pName,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                ),
                                Text(
                                  [pCategory, if (pVariety.isNotEmpty) pVariety].join(' · '),
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Expected Price Field
                    Text(
                      lang.tr(mr: 'अपेक्षित विक्री दर (₹)*', en: 'Expected Selling Price (₹)*'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: priceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        prefixIcon: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          child: Text('₹', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF217346))),
                        ),
                        hintText: 'उदा. 45',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Stock Quantity Field
                    Text(
                      lang.tr(mr: 'उपलब्ध साठा (Stock Quantity)*', en: 'Available Stock Quantity*'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: stockCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        hintText: 'उदा. 100',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Unit Selector
                    Text(
                      lang.tr(mr: 'युनिट (Unit)*', en: 'Unit*'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      children: ['Kg', 'Quintal', 'Box', 'Bunch', 'Pieces', 'Dozen'].map((unit) {
                        final isSel = selectedUnit.toLowerCase() == unit.toLowerCase();
                        return ChoiceChip(
                          label: Text(unit, style: TextStyle(fontSize: 12, color: isSel ? Colors.white : const Color(0xFF334155), fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                          selected: isSel,
                          selectedColor: const Color(0xFF217346),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: isSel ? const Color(0xFF217346) : const Color(0xFFCBD5E1)),
                          onSelected: (val) {
                            if (val) setModalState(() => selectedUnit = unit);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),

                    // Quality Grade Selector
                    Text(
                      lang.tr(mr: 'प्रतवारी (Quality Grade)', en: 'Quality Grade'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      children: ['Grade A', 'Grade B', 'Export Quality'].map((grade) {
                        final isSel = selectedGrade == grade;
                        return ChoiceChip(
                          label: Text(grade, style: TextStyle(fontSize: 12, color: isSel ? Colors.white : const Color(0xFF334155), fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                          selected: isSel,
                          selectedColor: const Color(0xFF047857),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: isSel ? const Color(0xFF047857) : const Color(0xFFCBD5E1)),
                          onSelected: (val) {
                            if (val) setModalState(() => selectedGrade = grade);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Info Note
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.info_outline, size: 16, color: Color(0xFFB45309)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              lang.tr(
                                mr: 'ही विनंती व्हेंडर / व्यवस्थापकाकडे मंजुरीसाठी पाठवली जाईल. त्यांनी मंजूर करताच हे उत्पादन तुमच्या "माझी उत्पादने" मध्ये सक्रिय होईल.',
                                en: 'This request will be sent to the vendor / manager for approval. Once approved, it will automatically activate in "My Products".',
                              ),
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF92400E), height: 1.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF64748B),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                            child: Text(lang.tr(mr: 'रद्द करा', en: 'Cancel'), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF217346),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: isSubmitting
                                ? null
                                : () async {
                                    final price = double.tryParse(priceCtrl.text.trim()) ?? 0;
                                    final stock = double.tryParse(stockCtrl.text.trim()) ?? 0;
                                    if (price <= 0) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(lang.tr(mr: 'कृपया वैध विक्री दर प्रविष्ट करा', en: 'Please enter a valid selling price')),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }
                                    if (stock <= 0) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(lang.tr(mr: 'कृपया वैध साठा संख्या प्रविष्ट करा', en: 'Please enter a valid stock quantity')),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }

                                    setModalState(() => isSubmitting = true);
                                    final payload = {
                                      'productId': vProd['productId'] ?? vProd['id'] ?? '',
                                      'productName': pName,
                                      'category': pCategory,
                                      'variety': pVariety,
                                      'unit': selectedUnit,
                                      'sellingPrice': price,
                                      'pricePerKg': price,
                                      'stock': stock,
                                      'grade': selectedGrade,
                                      'imageUrl': pImage,
                                    };

                                    final ok = await FarmerState().requestProductToAdd(payload);
                                    if (ctx.mounted) {
                                      Navigator.pop(ctx);
                                    }

                                    if (context.mounted) {
                                      if (ok) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              lang.tr(
                                                mr: 'उत्पादन जोडण्याची विनंती यशस्वीरित्या पाठवली! व्हेंडरच्या मंजुरीनंतर ते "माझी उत्पादने" मध्ये सक्रिय होईल.',
                                                en: 'Product add request submitted! It will appear in "My Products" once approved by vendor.',
                                              ),
                                            ),
                                            backgroundColor: const Color(0xFF217346),
                                            duration: const Duration(seconds: 4),
                                          ),
                                        );
                                      } else {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              lang.tr(
                                                mr: 'विनंती पाठवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
                                                en: 'Failed to submit request. Please try again.',
                                              ),
                                            ),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      }
                                    }
                                  },
                            child: isSubmitting
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(
                                    lang.tr(mr: 'विनंती सादर करा', en: 'Submit Request'),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                          ),
                        ),
                      ],
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

  Widget _buildProductCard(BuildContext context, ProductItem product) {
    final lang = AppLanguage();
    try {
      final statusStr = product.status.isNotEmpty ? product.status : 'Active';
      final isOutOfStock = statusStr.toLowerCase().contains('out of stock') || product.stockQuantity <= 0;
      final isPending = statusStr.toLowerCase().contains('pending');

      final statusText = isOutOfStock
          ? 'Out of Stock'
          : (isPending
              ? 'Pending Approval'
              : (statusStr.toLowerCase() == 'published' ? 'Active' : statusStr));

      Color statusColor;
      Color statusBg;
      if (isOutOfStock || statusStr.toLowerCase() == 'rejected') {
        statusColor = const Color(0xFFDC2626);
        statusBg = const Color(0xFFFEE2E2);
      } else if (isPending) {
        statusColor = const Color(0xFFD97706);
        statusBg = const Color(0xFFFEF3C7);
      } else if (statusStr.toLowerCase() == 'active' || statusStr.toLowerCase() == 'published') {
        statusColor = const Color(0xFF059669);
        statusBg = const Color(0xFFDCFCE7);
      } else if (statusStr.toLowerCase() == 'paused') {
        statusColor = const Color(0xFFD97706);
        statusBg = const Color(0xFFFEF3C7);
      } else {
        statusColor = const Color(0xFF64748B);
        statusBg = const Color(0xFFF1F5F9);
      }

      final pName = product.productName.isNotEmpty ? product.productName : AppLanguage().tr(mr: 'उत्पादन', en: 'Product');
      final pVariety = product.variety;
      final pBid = product.displayBusinessId;
      final pStock = product.stockQuantity;
      final pUnit = product.unit.isNotEmpty ? product.unit : 'Kg';
      final pHarvest = product.harvestDate.isNotEmpty ? product.harvestDate : AppLanguage().tr(mr: 'उपलब्ध', en: 'Available');

      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isPending ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0),
            width: isPending ? 1.5 : 1.0,
          ),
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
                      // Title and Status Badge
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
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _translateStatus(statusText),
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: statusColor,
                              ),
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
    } else if (lower.contains('carrot')) {
      bg = const Color(0xFFFFEDD5);
      fg = const Color(0xFFEA580C);
      icon = Icons.park_outlined;
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
