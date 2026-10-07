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

String _fmtQty(double q) =>
    q % 1 == 0 ? q.toStringAsFixed(0) : q.toStringAsFixed(2).replaceFirst(RegExp(r'0+$'), '');

/// One grade row of the stock sheet: its current quantity and the amount to add / deduct.
class _GradeStockRow {
  final String grade;
  final double current;
  final Color color;
  final TextEditingController controller = TextEditingController();

  _GradeStockRow({required this.grade, required this.current, required this.color});

  double get entered => double.tryParse(controller.text.trim()) ?? 0.0;
}

/// Bottom sheet to add stock to, or deduct stock from, each grade.
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
  late final List<_GradeStockRow> _grades;
  final _reasonController = TextEditingController();
  bool _isAdd = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _grades = [
      _GradeStockRow(grade: 'A', current: p.gradeAQty, color: const Color(0xFF059669)),
      _GradeStockRow(grade: 'B', current: p.gradeBQty, color: const Color(0xFF2563EB)),
      _GradeStockRow(grade: 'C', current: p.gradeCQty, color: const Color(0xFFD97706)),
    ];
  }

  @override
  void dispose() {
    for (final g in _grades) {
      g.controller.dispose();
    }
    _reasonController.dispose();
    super.dispose();
  }

  double _signed(double q) => _isAdd ? q : -q;

  double _newQtyOf(_GradeStockRow g) => g.current + _signed(g.entered);

  bool _exceeds(_GradeStockRow g) => !_isAdd && g.entered > g.current;

  double get _currentTotal => _grades.fold(0.0, (s, g) => s + g.current);

  double get _changeTotal => _grades.fold(0.0, (s, g) => s + g.entered);

  double get _newTotal => _grades.fold(0.0, (s, g) => s + _newQtyOf(g));

  Future<void> _saveStock() async {
    final lang = AppLanguage();
    final unit = widget.product.unit.isNotEmpty ? widget.product.unit : 'Kg';

    if (_grades.any((g) => g.entered < 0)) {
      _showError(lang.tr(mr: 'कृपया वैध प्रमाण प्रविष्ट करा.', en: 'Please enter a valid quantity.'));
      return;
    }
    final over = _grades.where(_exceeds).toList();
    if (over.isNotEmpty) {
      final g = over.first;
      _showError(lang.tr(
        mr: 'ग्रेड ${g.grade} मध्ये फक्त ${_fmtQty(g.current)} $unit आहे — ${_fmtQty(g.entered)} $unit वजा करता येणार नाही.',
        en: 'Grade ${g.grade} has only ${_fmtQty(g.current)} $unit — cannot deduct ${_fmtQty(g.entered)} $unit.',
      ));
      return;
    }
    final adjustments = [
      for (final g in _grades)
        if (g.entered > 0) {'grade': g.grade, 'change': _signed(g.entered)},
    ];
    if (adjustments.isEmpty) {
      _showError(lang.tr(mr: 'किमान एका ग्रेडसाठी प्रमाण प्रविष्ट करा.', en: 'Enter a quantity for at least one grade.'));
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await ApiService().updateProductStock(widget.product.id, {
        'adjustments': adjustments,
        if (_reasonController.text.trim().isNotEmpty) 'reason': _reasonController.text.trim(),
      });
      if (res is! Map<String, dynamic>) {
        throw Exception(lang.tr(mr: 'सर्व्हरकडून उत्तर मिळाले नाही.', en: 'No response from the server.'));
      }
      final saved = ProductItem.fromJson(res);
      final expected = [_newQtyOf(_grades[0]), _newQtyOf(_grades[1]), _newQtyOf(_grades[2])];
      final actual = [saved.gradeAQty, saved.gradeBQty, saved.gradeCQty];
      for (var i = 0; i < expected.length; i++) {
        if ((expected[i] - actual[i]).abs() > 0.001) {
          throw Exception(lang.tr(
            mr: 'सर्व्हरने साठा बदल सेव्ह केला नाही. कृपया बॅकएंड रीस्टार्ट करा.',
            en: 'The server did not save the stock change. Please restart the backend.',
          ));
        }
      }

      final p = widget.product;
      p.gradeAQty = saved.gradeAQty;
      p.gradeBQty = saved.gradeBQty;
      p.gradeCQty = saved.gradeCQty;
      final total = saved.stockQuantity;
      p.stockQuantity = total;
      FarmerState().updateProductStock(p.id, total);
      widget.onStockUpdated(total);
      FarmerState().refreshProducts();

      if (mounted) {
        final change = _fmtQty(_changeTotal);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isAdd
                  ? lang.tr(mr: '$change $unit साठा जोडला. एकूण: ${_fmtQty(total)} $unit', en: 'Added $change $unit. Total stock: ${_fmtQty(total)} $unit')
                  : lang.tr(mr: '$change $unit साठा वजा केला. एकूण: ${_fmtQty(total)} $unit', en: 'Deducted $change $unit. Total stock: ${_fmtQty(total)} $unit'),
            ),
            backgroundColor: const Color(0xFF217346),
          ),
        );
      }
    } catch (e) {
      final reason = e is ApiHttpException ? e.message : e.toString().replaceFirst('Exception: ', '');
      _showError(lang.tr(mr: 'साठा सेव्ह करण्यात अयशस्वी: $reason', en: 'Failed to update stock: $reason'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: const Color(0xFFDC2626)),
    );
  }

  Widget _buildModeButton({required bool add, required String label, required IconData icon}) {
    final selected = _isAdd == add;
    final color = add ? const Color(0xFF059669) : const Color(0xFFDC2626);
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => setState(() => _isAdd = add),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? color : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: selected ? color : const Color(0xFFCBD5E1)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: selected ? Colors.white : color),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: selected ? Colors.white : color),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGradeRow(_GradeStockRow g, String unit, AppLanguage lang) {
    final next = _newQtyOf(g);
    final exceeds = _exceeds(g);
    final hasChange = g.entered > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: exceeds ? const Color(0xFFDC2626) : g.color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            decoration: BoxDecoration(
              color: g.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Grade ${g.grade}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: g.color)),
                Text(
                  '${_fmtQty(g.current)} $unit',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: TextField(
                controller: g.controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}'))],
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                decoration: InputDecoration(
                  isDense: true,
                  prefixText: _isAdd ? '+ ' : '− ',
                  prefixStyle: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: _isAdd ? const Color(0xFF059669) : const Color(0xFFDC2626),
                  ),
                  labelText: _isAdd ? lang.tr(mr: 'जोडा', en: 'Add') : lang.tr(mr: 'वजा करा', en: 'Deduct'),
                  labelStyle: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                  suffixText: unit,
                  suffixStyle: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 64,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  lang.tr(mr: 'नवीन', en: 'New'),
                  style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
                ),
                Text(
                  exceeds ? lang.tr(mr: 'अपुरा', en: 'Too much') : '${_fmtQty(next)} $unit',
                  textAlign: TextAlign.end,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: exceeds
                        ? const Color(0xFFDC2626)
                        : hasChange
                            ? (_isAdd ? const Color(0xFF059669) : const Color(0xFFB45309))
                            : const Color(0xFF334155),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTotalRow(String label, String value, {Color color = const Color(0xFF334155), bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, fontWeight: bold ? FontWeight.bold : FontWeight.w500, color: const Color(0xFF475569))),
          Text(value, style: TextStyle(fontSize: bold ? 15 : 12, fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = AppLanguage();
    final unit = widget.product.unit.isNotEmpty ? widget.product.unit : 'Kg';
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final anyExceeds = _grades.any(_exceeds);
    final changeColor = _isAdd ? const Color(0xFF059669) : const Color(0xFFDC2626);

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
                              lang.tr(mr: 'साठा अपडेट करा', en: 'Update Stock'),
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

                  Row(
                    children: [
                      _buildModeButton(add: true, label: lang.tr(mr: 'साठा जोडा (+)', en: 'Add Stock (+)'), icon: Icons.add_circle_outline_rounded),
                      const SizedBox(width: 8),
                      _buildModeButton(add: false, label: lang.tr(mr: 'साठा वजा करा (−)', en: 'Deduct Stock (−)'), icon: Icons.remove_circle_outline_rounded),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Text(
                    lang.tr(mr: 'ग्रेडनुसार प्रमाण ($unit)', en: 'Grade-wise quantity ($unit)'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  const SizedBox(height: 8),
                  ..._grades.map((g) => _buildGradeRow(g, unit, lang)),

                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _buildTotalRow(lang.tr(mr: 'सध्याचा एकूण साठा', en: 'Current total'), '${_fmtQty(_currentTotal)} $unit'),
                        _buildTotalRow(
                          _isAdd ? lang.tr(mr: 'जोडत आहे', en: 'Adding') : lang.tr(mr: 'वजा करत आहे', en: 'Deducting'),
                          '${_isAdd ? '+' : '−'} ${_fmtQty(_changeTotal)} $unit',
                          color: changeColor,
                        ),
                        const Divider(height: 10),
                        _buildTotalRow(
                          lang.tr(mr: 'नवीन एकूण साठा', en: 'New total'),
                          anyExceeds ? '—' : '${_fmtQty(_newTotal)} $unit',
                          color: anyExceeds ? const Color(0xFFDC2626) : const Color(0xFF0F172A),
                          bold: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: TextField(
                      controller: _reasonController,
                      maxLength: 200,
                      style: const TextStyle(fontSize: 12),
                      decoration: InputDecoration(
                        isDense: true,
                        counterText: '',
                        border: InputBorder.none,
                        hintText: lang.tr(mr: 'कारण (ऐच्छिक) — उदा. नवीन काढणी, खराब माल', en: 'Reason (optional) — e.g. new harvest, damaged'),
                        hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isAdd ? const Color(0xFF217346) : const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _saving || anyExceeds || _changeTotal <= 0 ? null : _saveStock,
                      child: _saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              _isAdd
                                  ? lang.tr(mr: 'साठा जोडा', en: 'Add Stock')
                                  : lang.tr(mr: 'साठा वजा करा', en: 'Deduct Stock'),
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

