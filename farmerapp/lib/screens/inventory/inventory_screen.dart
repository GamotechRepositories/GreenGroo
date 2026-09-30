import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/farmer_models.dart';
import '../../services/api_service.dart';
import '../../services/app_language.dart';
import '../../services/farmer_state.dart';
import '../main_shell.dart';
import '../products/add_product_screen.dart';
import '../products/product_detail_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _searchQuery = '';
  String _selectedFilter = 'all'; // all, in_stock, low_stock, out_of_stock
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _copyId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    final lang = AppLanguage();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          lang.tr(
            mr: 'उत्पादन आयडी "$id" क्लिपबोर्डवर कॉपी केला!',
            en: 'Product ID "$id" copied to clipboard!',
          ),
        ),
        backgroundColor: const Color(0xFF217346),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _openStockUpdateSheet(ProductItem product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _StockUpdateBottomSheet(
        product: product,
        onStockUpdated: (newTotalStock) {
          setState(() {});
        },
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
        final allProducts = state.products;

        // Calculate summary statistics
        int totalProducts = allProducts.length;
        int inStockCount = 0;
        int lowStockCount = 0;
        int outOfStockCount = 0;
        for (final p in allProducts) {
          final s = p.stockQuantity;

          if (s <= 0) {
            outOfStockCount++;
          } else if (s < 50) {
            lowStockCount++;
          } else {
            inStockCount++;
          }
        }

        // Filter products
        final filteredProducts = allProducts.where((p) {
          final s = p.stockQuantity;
          if (_selectedFilter == 'in_stock' && s <= 0) return false;
          if (_selectedFilter == 'low_stock' && (s <= 0 || s >= 50)) return false;
          if (_selectedFilter == 'out_of_stock' && s > 0) return false;

          final q = _searchQuery.toLowerCase().trim();
          if (q.isNotEmpty) {
            final name = p.productName.toLowerCase();
            final variety = p.variety.toLowerCase();
            final category = p.category.toLowerCase();
            final id = p.displayBusinessId.toLowerCase();
            return name.contains(q) || variety.contains(q) || category.contains(q) || id.contains(q);
          }
          return true;
        }).toList();

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
              lang.tr(mr: 'इन्व्हेंटरी व साठा', en: 'Inventory & Stock'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Color(0xFF217346)),
                tooltip: lang.tr(mr: 'रिफ्रेश करा', en: 'Refresh'),
                onPressed: () => FarmerState().refreshProducts(),
              ),
              IconButton(
                icon: const Icon(Icons.add, color: Color(0xFF217346)),
                tooltip: lang.tr(mr: 'नवीन उत्पादन जोडा', en: 'Add Product'),
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
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  // Top Summary Cards
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [

                          // 3 Metric Pills
                          Row(
                            children: [
                              Expanded(
                                child: _buildStatTile(
                                  title: lang.tr(mr: 'उपलब्ध', en: 'In Stock'),
                                  count: inStockCount,
                                  color: const Color(0xFF059669),
                                  bgColor: const Color(0xFFECFDF5),
                                  icon: Icons.check_circle_outline_rounded,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildStatTile(
                                  title: lang.tr(mr: 'कमी साठा', en: 'Low Stock'),
                                  count: lowStockCount,
                                  color: const Color(0xFFD97706),
                                  bgColor: const Color(0xFFFFFBEB),
                                  icon: Icons.warning_amber_rounded,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildStatTile(
                                  title: lang.tr(mr: 'संपला', en: 'Out of Stock'),
                                  count: outOfStockCount,
                                  color: const Color(0xFFDC2626),
                                  bgColor: const Color(0xFFFEF2F2),
                                  icon: Icons.cancel_outlined,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Search Bar
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: TextField(
                              controller: _searchController,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
                              decoration: InputDecoration(
                                hintText: lang.tr(
                                  mr: 'उत्पादनाचे नाव, जात किंवा आयडी शोधा…',
                                  en: 'Search product, variety, or ID…',
                                ),
                                hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF64748B)),
                                suffixIcon: _searchQuery.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                                        onPressed: () {
                                          _searchController.clear();
                                          setState(() => _searchQuery = '');
                                        },
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              ),
                              onChanged: (val) {
                                setState(() => _searchQuery = val);
                              },
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Filter Chips
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildFilterChip(
                                  label: lang.tr(mr: 'सर्व ($totalProducts)', en: 'All ($totalProducts)'),
                                  value: 'all',
                                ),
                                const SizedBox(width: 8),
                                _buildFilterChip(
                                  label: lang.tr(mr: 'उपलब्ध ($inStockCount)', en: 'In Stock ($inStockCount)'),
                                  value: 'in_stock',
                                ),
                                const SizedBox(width: 8),
                                _buildFilterChip(
                                  label: lang.tr(mr: 'कमी साठा ($lowStockCount)', en: 'Low Stock ($lowStockCount)'),
                                  value: 'low_stock',
                                ),
                                const SizedBox(width: 8),
                                _buildFilterChip(
                                  label: lang.tr(mr: 'साठा संपला ($outOfStockCount)', en: 'Out of Stock ($outOfStockCount)'),
                                  value: 'out_of_stock',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Products List
                  if (filteredProducts.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF1F5F9),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.inventory_2_outlined,
                                  size: 48,
                                  color: Color(0xFF94A3B8),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                lang.tr(mr: 'कोणतेही उत्पादन सापडले नाही', en: 'No products found'),
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                lang.tr(
                                  mr: 'शोध किंवा फिल्टर निकष तपासा किंवा नवीन उत्पादन जोडा.',
                                  en: 'Check your search query or add new inventory.',
                                ),
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(14, 4, 14, 24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final product = filteredProducts[index];
                            return _buildInventoryCard(product, lang);
                          },
                          childCount: filteredProducts.length,
                        ),
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

  Widget _buildStatTile({
    required String title,
    required int count,
    required Color color,
    required Color bgColor,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '$count',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({required String label, required String value}) {
    final isSelected = _selectedFilter == value;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = value),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF217346) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF217346) : const Color(0xFFCBD5E1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildInventoryCard(ProductItem product, AppLanguage lang) {
    final stock = product.stockQuantity;
    final unit = product.unit.isNotEmpty ? product.unit : 'Kg';

    Color stockStatusColor;
    String stockStatusText;
    Color stockStatusBg;

    if (stock <= 0) {
      stockStatusColor = const Color(0xFFDC2626);
      stockStatusBg = const Color(0xFFFEE2E2);
      stockStatusText = lang.tr(mr: 'स्टॉक संपला', en: 'Out of Stock');
    } else if (stock < 50) {
      stockStatusColor = const Color(0xFFD97706);
      stockStatusBg = const Color(0xFFFEF3C7);
      stockStatusText = lang.tr(mr: 'कमी साठा', en: 'Low Stock');
    } else {
      stockStatusColor = const Color(0xFF059669);
      stockStatusBg = const Color(0xFFD1FAE5);
      stockStatusText = lang.tr(mr: 'उपलब्ध', en: 'In Stock');
    }

    final hasGradeBreakdown = (product.gradeAQty > 0 || product.gradeBQty > 0 || product.gradeCQty > 0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Image, Name, Business ID, Status Badges
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 58,
                    height: 58,
                    color: const Color(0xFFF1F5F9),
                    child: product.imageUrl.isNotEmpty
                        ? Image.network(
                            product.imageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Center(
                              child: Icon(Icons.eco_rounded, color: Color(0xFF10B981), size: 28),
                            ),
                          )
                        : const Center(
                            child: Icon(Icons.eco_rounded, color: Color(0xFF10B981), size: 28),
                          ),
                  ),
                ),
                const SizedBox(width: 12),

                // Name & Meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              product.productName.isNotEmpty ? product.productName : 'Farm Produce',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: stockStatusBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              stockStatusText,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: stockStatusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        [product.variety, product.category, product.cropLinked]
                            .where((s) => s.isNotEmpty)
                            .join(' · '),
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Business ID Copy Row
                      InkWell(
                        onTap: () => _copyId(product.displayBusinessId),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              product.displayBusinessId,
                              style: const TextStyle(
                                fontSize: 10,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF059669),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.copy_rounded, size: 11, color: Color(0xFF059669)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Total Stock Highlight Box
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lang.tr(mr: 'उपलब्ध एकूण साठा', en: 'Total Available Stock'),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          stock.toStringAsFixed(stock % 1 == 0 ? 0 : 1),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: stock <= 0 ? const Color(0xFFDC2626) : const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          unit,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      lang.tr(mr: 'विक्री दर / युनिट', en: 'Price / Unit'),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '₹${product.pricePerUnit.toStringAsFixed(product.pricePerUnit % 1 == 0 ? 0 : 2)} / $unit',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF217346),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Grade-wise stock breakdown if available
          if (hasGradeBreakdown) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildGradePill(
                        grade: 'Grade A',
                        qty: product.gradeAQty,
                        rate: product.gradeAPrice,
                        unit: unit,
                        color: const Color(0xFF065F46),
                        bgColor: const Color(0xFFECFDF5),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildGradePill(
                        grade: 'Grade B',
                        qty: product.gradeBQty,
                        rate: product.gradeBPrice,
                        unit: unit,
                        color: const Color(0xFF1E40AF),
                        bgColor: const Color(0xFFEFF6FF),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildGradePill(
                        grade: 'Grade C',
                        qty: product.gradeCQty,
                        rate: product.gradeCPrice,
                        unit: unit,
                        color: const Color(0xFF92400E),
                        bgColor: const Color(0xFFFFFBEB),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),

          // Actions Row: Update Stock & View Details
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF217346),
                      side: const BorderSide(color: Color(0xFF217346), width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: const Icon(Icons.edit_note_rounded, size: 17),
                    label: Text(
                      lang.tr(mr: 'साठा अपडेट करा', en: 'Update Stock'),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () => _openStockUpdateSheet(product),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFF1F5F9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.all(8),
                  ),
                  icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF475569)),
                  tooltip: lang.tr(mr: 'तपशील पहा', en: 'View Details'),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradePill({
    required String grade,
    required double qty,
    required double rate,
    required String unit,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            grade,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
          ),
          const SizedBox(height: 1),
          Text(
            qty > 0 ? '${qty.toStringAsFixed(qty % 1 == 0 ? 0 : 1)} $unit' : '—',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: qty > 0 ? color : const Color(0xFF94A3B8),
            ),
          ),
          if (rate > 0)
            Text(
              '₹${rate.toStringAsFixed(0)}',
              style: TextStyle(fontSize: 9, color: color.withValues(alpha: 0.8)),
            ),
        ],
      ),
    );
  }
}

/// Dynamic grade entry item for stock bottomsheet
class _GradeRowItem {
  final String id;
  final TextEditingController nameController;
  final TextEditingController qtyController;
  final TextEditingController priceController;
  final Color color;
  final bool isDefault;

  _GradeRowItem({
    required this.id,
    required String name,
    double qty = 0,
    double price = 0,
    required this.color,
    this.isDefault = false,
  })  : nameController = TextEditingController(text: name),
        qtyController = TextEditingController(
          text: qty > 0 ? (qty % 1 == 0 ? qty.toStringAsFixed(0) : qty.toStringAsFixed(1)) : '0',
        ),
        priceController = TextEditingController(
          text: price > 0 ? (price % 1 == 0 ? price.toStringAsFixed(0) : price.toStringAsFixed(2)) : '',
        );

  void dispose() {
    nameController.dispose();
    qtyController.dispose();
    priceController.dispose();
  }
}

/// BottomSheet for quick stock adjustment
class _StockUpdateBottomSheet extends StatefulWidget {
  final ProductItem product;
  final ValueChanged<double> onStockUpdated;

  const _StockUpdateBottomSheet({
    required this.product,
    required this.onStockUpdated,
  });

  @override
  State<_StockUpdateBottomSheet> createState() => _StockUpdateBottomSheetState();
}

class _StockUpdateBottomSheetState extends State<_StockUpdateBottomSheet> {
  late TextEditingController _totalStockController;
  final List<_GradeRowItem> _grades = [];
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _totalStockController = TextEditingController(
      text: widget.product.stockQuantity > 0
          ? widget.product.stockQuantity.toStringAsFixed(widget.product.stockQuantity % 1 == 0 ? 0 : 1)
          : '0',
    );

    _grades.add(
      _GradeRowItem(
        id: 'grade_a',
        name: 'Grade A',
        qty: widget.product.gradeAQty,
        price: widget.product.gradeAPrice,
        color: const Color(0xFF059669),
        isDefault: true,
      ),
    );
    _grades.add(
      _GradeRowItem(
        id: 'grade_b',
        name: 'Grade B',
        qty: widget.product.gradeBQty,
        price: widget.product.gradeBPrice,
        color: const Color(0xFF2563EB),
        isDefault: true,
      ),
    );
    _grades.add(
      _GradeRowItem(
        id: 'grade_c',
        name: 'Grade C',
        qty: widget.product.gradeCQty,
        price: widget.product.gradeCPrice,
        color: const Color(0xFFD97706),
        isDefault: true,
      ),
    );
  }

  @override
  void dispose() {
    _totalStockController.dispose();
    for (final g in _grades) {
      g.dispose();
    }
    super.dispose();
  }

  void _recalcTotalFromGrades() {
    double sum = 0.0;
    for (final g in _grades) {
      final q = double.tryParse(g.qtyController.text.trim()) ?? 0.0;
      sum += q;
    }
    if (sum > 0 || _grades.isNotEmpty) {
      _totalStockController.text = sum.toStringAsFixed(sum % 1 == 0 ? 0 : 1);
    }
  }

  void _addNewGrade() {
    final nextIndex = _grades.length;
    final alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    final letter = nextIndex < alphabet.length ? alphabet[nextIndex] : '${nextIndex + 1}';
    final colors = [
      const Color(0xFF7C3AED),
      const Color(0xFFDB2777),
      const Color(0xFF0891B2),
      const Color(0xFF4F46E5),
      const Color(0xFFEA580C),
      const Color(0xFF059669),
    ];
    final color = colors[nextIndex % colors.length];

    setState(() {
      _grades.add(
        _GradeRowItem(
          id: UniqueKey().toString(),
          name: 'Grade $letter',
          qty: 0,
          price: widget.product.pricePerUnit,
          color: color,
          isDefault: false,
        ),
      );
    });
    _recalcTotalFromGrades();
  }

  void _removeGrade(int index) {
    if (index >= 0 && index < _grades.length) {
      setState(() {
        _grades[index].dispose();
        _grades.removeAt(index);
      });
      _recalcTotalFromGrades();
    }
  }

  Future<void> _saveStock() async {
    final lang = AppLanguage();
    final total = double.tryParse(_totalStockController.text.trim()) ?? 0.0;

    if (total < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.tr(mr: 'कृपया वैध साठा प्रविष्ट करा.', en: 'Please enter valid stock quantity.')),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      double gradeA = 0.0, gradeB = 0.0, gradeC = 0.0;
      double gradeAPrice = widget.product.gradeAPrice;
      double gradeBPrice = widget.product.gradeBPrice;
      double gradeCPrice = widget.product.gradeCPrice;

      final gradesPayload = <Map<String, dynamic>>[];

      for (final g in _grades) {
        final rawName = g.nameController.text.trim();
        final name = rawName.isEmpty ? 'Grade' : rawName;
        final q = double.tryParse(g.qtyController.text.trim()) ?? 0.0;

        final norm = name.toUpperCase();
        if (norm.contains('GRADE A') || norm == 'A') {
          gradeA = q;
        } else if (norm.contains('GRADE B') || norm == 'B') {
          gradeB = q;
        } else if (norm.contains('GRADE C') || norm == 'C') {
          gradeC = q;
        }

        gradesPayload.add({
          'grade': name.replaceFirst(RegExp(r'^Grade\s*', caseSensitive: false), '').trim(),
          'label': name,
          'quantity': q,
          'price': widget.product.pricePerUnit,
        });
      }

      final payload = {
        'stock': total,
        'stockQuantity': total,
        'availableQuantity': total,
        'totalQuantity': total,
        'gradeAQty': gradeA,
        'gradeBQty': gradeB,
        'gradeCQty': gradeC,
        'gradeAPrice': gradeAPrice,
        'gradeBPrice': gradeBPrice,
        'gradeCPrice': gradeCPrice,
        'grades': gradesPayload,
      };

      await ApiService().updateProductStock(widget.product.id, payload);

      // Locally update product in FarmerState
      widget.product.stockQuantity = total;
      widget.product.gradeAQty = gradeA;
      widget.product.gradeBQty = gradeB;
      widget.product.gradeCQty = gradeC;
      widget.product.gradeAPrice = gradeAPrice;
      widget.product.gradeBPrice = gradeBPrice;
      widget.product.gradeCPrice = gradeCPrice;

      FarmerState().updateProductStock(widget.product.id, total);
      widget.onStockUpdated(total);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang.tr(
                mr: 'साठा यशस्वीरित्या अपडेट केला! ($total ${widget.product.unit})',
                en: 'Stock updated successfully! ($total ${widget.product.unit})',
              ),
            ),
            backgroundColor: const Color(0xFF217346),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang.tr(
                mr: 'साठा सेव्ह करण्यात अयशस्वी: $e',
                en: 'Failed to update stock: $e',
              ),
            ),
            backgroundColor: const Color(0xFFDC2626),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLanguage();
    final unit = widget.product.unit.isNotEmpty ? widget.product.unit : 'Kg';
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding > 0 ? 16 : 24),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lang.tr(mr: 'उपलब्ध साठा अपडेट करा', en: 'Update Available Stock'),
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            Text(
                              widget.product.productName,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Header with Grade label and "+ Add Grade" button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        lang.tr(mr: 'ग्रेडनुसार साठा ($unit)', en: 'Grade-wise Stock ($unit)'),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                      ),
                      InkWell(
                        onTap: _addNewGrade,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF217346).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF217346).withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.add_circle_outline_rounded, size: 14, color: Color(0xFF217346)),
                              const SizedBox(width: 4),
                              Text(
                                lang.tr(mr: '+ ग्रेड जोडा', en: '+ Add Grade'),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF217346),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Dynamic list of grades
                  ..._grades.asMap().entries.map((entry) {
                    final index = entry.key;
                    final grade = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: grade.color.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          // Grade Name input / badge
                          Container(
                            width: 82,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                            decoration: BoxDecoration(
                              color: grade.color.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: TextField(
                              controller: grade.nameController,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: grade.color,
                              ),
                              decoration: const InputDecoration(
                                isDense: true,
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Qty Input
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: TextField(
                                controller: grade.qtyController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                                decoration: InputDecoration(
                                  isDense: true,
                                  labelText: lang.tr(mr: 'साठा', en: 'Qty'),
                                  labelStyle: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                                  suffixText: unit,
                                  suffixStyle: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                                ),
                                onChanged: (_) => _recalcTotalFromGrades(),
                              ),
                            ),
                          ),

                          // Delete button if more than 1 grade
                          if (_grades.length > 1) ...[
                            const SizedBox(width: 4),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                              icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFFDC2626)),
                              tooltip: lang.tr(mr: 'काढून टाका', en: 'Remove'),
                              onPressed: () => _removeGrade(index),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),

                  // Extra Add Grade Row Button
                  InkWell(
                    onTap: _addNewGrade,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      margin: const EdgeInsets.only(top: 2, bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFF217346).withValues(alpha: 0.4),
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add, size: 16, color: Color(0xFF217346)),
                          const SizedBox(width: 4),
                          Text(
                            lang.tr(mr: 'आणखी ग्रेड जोडा (+ Add Another Grade)', en: '+ Add Another Grade'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF217346),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Total Stock Input
                  Text(
                    lang.tr(mr: 'एकूण साठा ($unit)', en: 'Total Available Stock ($unit)'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: TextField(
                      controller: _totalStockController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        suffixText: unit,
                        suffixStyle: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF217346),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _saving ? null : _saveStock,
                      child: _saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              lang.tr(mr: 'साठा जतन करा (Save)', en: 'Save Stock'),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
