import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/detect_current_location.dart';
import '../../core/utils/product_utils.dart';

typedef ProductFilterApply = void Function({
  String? brand,
  ProductSortOption? sort,
  String? minPrice,
  String? maxPrice,
  String? minDiscount,
  String? pincode,
  String? weightSize,
  bool inStockOnly,
  String? searchQuery,
});

/// Opens the enhanced product filter bottom sheet.
Future<void> showProductFilterBottomSheet({
  required BuildContext context,
  required List<String> brands,
  String? currentBrand,
  ProductSortOption? currentSort,
  String? currentMinPrice,
  String? currentMaxPrice,
  String? currentMinDiscount,
  String? currentPincode,
  String? currentWeightSize,
  List<String> weightsSizes = const [],
  bool currentInStockOnly = false,
  String? currentSearch,
  required ProductFilterApply onApply,
  required VoidCallback onClear,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => ProductFilterSheet(
      brands: brands,
      currentBrand: currentBrand,
      currentSort: currentSort,
      currentMinPrice: currentMinPrice,
      currentMaxPrice: currentMaxPrice,
      currentMinDiscount: currentMinDiscount,
      currentPincode: currentPincode,
      currentWeightSize: currentWeightSize,
      weightsSizes: weightsSizes,
      currentInStockOnly: currentInStockOnly,
      currentSearch: currentSearch,
      onApply: onApply,
      onClear: onClear,
    ),
  );
}

class ProductFilterSheet extends ConsumerStatefulWidget {
  const ProductFilterSheet({
    super.key,
    required this.brands,
    this.currentBrand,
    this.currentSort,
    this.currentMinPrice,
    this.currentMaxPrice,
    this.currentMinDiscount,
    this.currentPincode,
    this.currentWeightSize,
    this.weightsSizes = const [],
    this.currentInStockOnly = false,
    this.currentSearch,
    required this.onApply,
    required this.onClear,
  });

  final List<String> brands;
  final String? currentBrand;
  final ProductSortOption? currentSort;
  final String? currentMinPrice;
  final String? currentMaxPrice;
  final String? currentMinDiscount;
  final String? currentPincode;
  final String? currentWeightSize;
  final List<String> weightsSizes;
  final bool currentInStockOnly;
  final String? currentSearch;
  final ProductFilterApply onApply;
  final VoidCallback onClear;

  @override
  ConsumerState<ProductFilterSheet> createState() => _ProductFilterSheetState();
}

class _ProductFilterSheetState extends ConsumerState<ProductFilterSheet> {
  late String? _selectedBrand;
  late ProductSortOption _selectedSort;
  late String? _selectedDiscount;
  late String? _selectedWeightSize;
  late bool _inStockOnly;

  late final TextEditingController _minPriceController;
  late final TextEditingController _maxPriceController;
  late final TextEditingController _pincodeController;
  late final TextEditingController _searchController;
  late final TextEditingController _brandSearchController;

  String? _resolvedLocationText;
  bool _isDetectingLocation = false;
  bool _isValidatingPincode = false;
  String _brandSearchQuery = '';

  static const List<({String label, String value})> _discountOptions = [
    (label: 'All Discounts', value: ''),
    (label: '10% or more', value: '10'),
    (label: '20% or more', value: '20'),
    (label: '30% or more', value: '30'),
    (label: '40% or more', value: '40'),
    (label: '50% or more', value: '50'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedBrand =
        widget.currentBrand?.isNotEmpty == true ? widget.currentBrand : null;
    _selectedSort = widget.currentSort ?? ProductSortOption.listingDefault;
    _selectedDiscount = widget.currentMinDiscount?.isNotEmpty == true
        ? widget.currentMinDiscount
        : null;
    _selectedWeightSize = widget.currentWeightSize?.isNotEmpty == true
        ? widget.currentWeightSize
        : null;
    _inStockOnly = widget.currentInStockOnly;

    _minPriceController =
        TextEditingController(text: widget.currentMinPrice ?? '');
    _maxPriceController =
        TextEditingController(text: widget.currentMaxPrice ?? '');
    _pincodeController =
        TextEditingController(text: widget.currentPincode ?? '');
    _searchController =
        TextEditingController(text: widget.currentSearch ?? '');
    _brandSearchController = TextEditingController();

    _brandSearchController.addListener(() {
      setState(() {
        _brandSearchQuery = _brandSearchController.text.trim().toLowerCase();
      });
    });

    // If pincode was passed or already exists in location provider, look up location display text
    final initialPincode = widget.currentPincode ??
        ref.read(deliveryLocationProvider)?.pincode;
    if (initialPincode != null && initialPincode.isNotEmpty) {
      if (_pincodeController.text.isEmpty) {
        _pincodeController.text = initialPincode;
      }
      final loc = ref.read(deliveryLocationProvider);
      if (loc != null && loc.pincode == initialPincode) {
        final areaPart = loc.area?.isNotEmpty == true ? '${loc.area}, ' : '';
        final cityPart = loc.city?.isNotEmpty == true ? loc.city! : '';
        _resolvedLocationText = '$areaPart$cityPart'.trim();
      }
    }
  }

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    _pincodeController.dispose();
    _searchController.dispose();
    _brandSearchController.dispose();
    super.dispose();
  }

  int get _activeFilterCount {
    int count = 0;
    if (_selectedBrand != null && _selectedBrand!.isNotEmpty) count++;
    if (_selectedSort != ProductSortOption.listingDefault &&
        _selectedSort != ProductSortOption.defaultOrder) {
      count++;
    }
    if (_selectedDiscount != null && _selectedDiscount!.isNotEmpty) count++;
    if (_selectedWeightSize != null && _selectedWeightSize!.isNotEmpty) count++;
    if (_pincodeController.text.trim().isNotEmpty) count++;
    if (_inStockOnly) count++;
    if (_minPriceController.text.trim().isNotEmpty ||
        _maxPriceController.text.trim().isNotEmpty) {
      count++;
    }
    if (_searchController.text.trim().isNotEmpty) count++;
    return count;
  }

  Future<void> _detectCurrentLocation() async {
    setState(() => _isDetectingLocation = true);
    try {
      final detected = await detectPhoneLocation(ref.read(apiServiceProvider));
      if (!mounted) return;
      await ref.read(deliveryLocationProvider.notifier).setLocation(
            detected.toDeliveryLocation(),
          );
      ref.invalidate(nearestStoreProvider);
      setState(() {
        _isDetectingLocation = false;
        if (detected.pincode.isNotEmpty) {
          _pincodeController.text = detected.pincode;
        }
        _resolvedLocationText = detected.area.isNotEmpty
            ? '${detected.area}, ${detected.city}'
            : detected.city;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isDetectingLocation = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Could not detect location: $e',
            style: GoogleFonts.plusJakartaSans(fontSize: 12),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _lookupPincode(String pin) async {
    final clean = pin.trim();
    if (clean.length != 6) return;
    setState(() => _isValidatingPincode = true);
    try {
      final data =
          await ref.read(apiServiceProvider).fetchLocationByPincode(clean);
      if (!mounted) return;
      setState(() {
        _isValidatingPincode = false;
        if (data != null) {
          final city = data['city'] ?? '';
          final state = data['state'] ?? '';
          _resolvedLocationText = [city, state].where((s) => s.isNotEmpty).join(', ');
          ref.read(deliveryLocationProvider.notifier).setLocation(
                DeliveryLocation(
                  pincode: clean,
                  city: city,
                  state: state,
                  label: _resolvedLocationText,
                ),
              );
          ref.invalidate(nearestStoreProvider);
        } else {
          _resolvedLocationText = 'Pincode: $clean';
        }
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _isValidatingPincode = false;
          _resolvedLocationText = 'Pincode: $clean';
        });
      }
    }
  }

  void _clearAll() {
    setState(() {
      _selectedBrand = null;
      _selectedSort = ProductSortOption.listingDefault;
      _selectedDiscount = null;
      _selectedWeightSize = null;
      _inStockOnly = false;
      _minPriceController.clear();
      _maxPriceController.clear();
      _pincodeController.clear();
      _searchController.clear();
      _brandSearchController.clear();
      _resolvedLocationText = null;
    });
    widget.onClear();
  }

  void _apply() {
    final minPriceText = _minPriceController.text.trim();
    final maxPriceText = _maxPriceController.text.trim();
    final pincodeText = _pincodeController.text.trim();
    final searchText = _searchController.text.trim();

    widget.onApply(
      brand: _selectedBrand,
      sort: _selectedSort,
      minPrice: minPriceText.isEmpty ? null : minPriceText,
      maxPrice: maxPriceText.isEmpty ? null : maxPriceText,
      minDiscount: _selectedDiscount,
      pincode: pincodeText.isEmpty ? null : pincodeText,
      weightSize: _selectedWeightSize,
      inStockOnly: _inStockOnly,
      searchQuery: searchText.isEmpty ? null : searchText,
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _activeFilterCount;
    final filteredBrands = widget.brands.where((b) {
      if (_brandSearchQuery.isEmpty) return true;
      return b.toLowerCase().contains(_brandSearchQuery);
    }).toList();

    final viewInsets = MediaQuery.viewInsetsOf(context);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 6, 12, 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE7F3E9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.tune_rounded,
                      color: Color(0xFF0C831F),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Filters & Sort',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  if (activeCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0C831F),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$activeCount active',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  if (activeCount > 0)
                    TextButton(
                      onPressed: _clearAll,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        visualDensity: VisualDensity.compact,
                        foregroundColor: const Color(0xFFEF4444),
                      ),
                      child: Text(
                        'Clear all',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, size: 22),
                    color: const Color(0xFF64748B),
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Search in results field
                    _buildSectionHeader(
                      icon: Icons.search_rounded,
                      title: 'Search Keyword',
                      subtitle: 'Filter products matching keyword or name',
                    ),
                    const SizedBox(height: 8),
                    _buildSearchField(),

                    const SizedBox(height: 22),

                    // Section 1: Sort by Price & Order
                    _buildSectionHeader(
                      icon: Icons.swap_vert_rounded,
                      title: 'Sort By',
                      subtitle: 'Arrange products by price or release date',
                    ),
                    const SizedBox(height: 10),
                    _buildSortOptions(),

                    const SizedBox(height: 22),

                    // Section 2: Pincode / Location Filter
                    _buildSectionHeader(
                      icon: Icons.location_on_rounded,
                      title: 'Delivery Pincode',
                      subtitle: 'Check availability and stock for your pincode',
                    ),
                    const SizedBox(height: 10),
                    _buildPincodeFilter(),

                    const SizedBox(height: 22),

                    // Section 3: Filter by Discount
                    _buildSectionHeader(
                      icon: Icons.local_offer_rounded,
                      title: 'Discount',
                      subtitle: 'Filter by minimum discount offer',
                    ),
                    const SizedBox(height: 10),
                    _buildDiscountOptions(),

                    const SizedBox(height: 22),

                    // Section 4: Filter by Brand
                    if (widget.brands.isNotEmpty) ...[
                      _buildSectionHeader(
                        icon: Icons.verified_rounded,
                        title: 'Brand',
                        subtitle: 'Select your preferred brand',
                      ),
                      const SizedBox(height: 10),
                      _buildBrandFilter(filteredBrands),
                      const SizedBox(height: 22),
                    ],

                    // Section 5: Price Range
                    _buildSectionHeader(
                      icon: Icons.currency_rupee_rounded,
                      title: 'Price Range',
                      subtitle: 'Set minimum and maximum budget',
                    ),
                    const SizedBox(height: 10),
                    _buildPriceRangeFilter(),

                    const SizedBox(height: 20),

                    // Section 6: In-Stock Only Toggle
                    _buildInStockToggle(),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // Bottom Sticky Actions Bar
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(
                  top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: _clearAll,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Reset',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: _apply,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0C831F),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: Text(
                          activeCount > 0
                              ? 'Apply Filters ($activeCount)'
                              : 'Apply Filters',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 17, color: const Color(0xFF0C831F)),
            const SizedBox(width: 7),
            Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF1E293B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Padding(
          padding: const EdgeInsets.only(left: 24),
          child: Text(
            subtitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11.5,
              fontWeight: FontWeight.w400,
              color: const Color(0xFF64748B),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchField() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _searchController,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
              decoration: InputDecoration(
                hintText: 'Search products by keyword...',
                hintStyle: GoogleFonts.plusJakartaSans(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w400,
                  color: const Color(0xFF94A3B8),
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          if (_searchController.text.isNotEmpty)
            GestureDetector(
              onTap: () {
                _searchController.clear();
                setState(() {});
              },
              child: const Icon(
                Icons.cancel_rounded,
                size: 16,
                color: Color(0xFF94A3B8),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSortOptions() {
    final sortOptions = [
      (
        option: ProductSortOption.priceAsc,
        label: 'Price: Low to High',
        tag: 'Lowest to Highest',
        icon: Icons.trending_up_rounded,
      ),
      (
        option: ProductSortOption.priceDesc,
        label: 'Price: High to Low',
        tag: 'Highest to Lowest',
        icon: Icons.trending_down_rounded,
      ),
      (
        option: ProductSortOption.newest,
        label: 'Newest First',
        tag: 'Latest added',
        icon: Icons.access_time_rounded,
      ),
      (
        option: ProductSortOption.name,
        label: 'Name: A to Z',
        tag: 'Alphabetical',
        icon: Icons.sort_by_alpha_rounded,
      ),
      (
        option: ProductSortOption.oldest,
        label: 'Oldest',
        tag: 'Classic stock',
        icon: Icons.history_rounded,
      ),
      (
        option: ProductSortOption.weightAsc,
        label: 'Weight: Low to High',
        tag: 'Lightest first',
        icon: Icons.scale_outlined,
      ),
      (
        option: ProductSortOption.weightDesc,
        label: 'Weight: High to Low',
        tag: 'Heaviest first',
        icon: Icons.scale_rounded,
      ),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: sortOptions.map((item) {
        final isSelected = _selectedSort == item.option;
        return InkWell(
          onTap: () => setState(() => _selectedSort = item.option),
          borderRadius: BorderRadius.circular(10),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE7F3E9) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? const Color(0xFF0C831F) : const Color(0xFFE2E8F0),
                width: isSelected ? 1.5 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  item.icon,
                  size: 15,
                  color: isSelected ? const Color(0xFF0C831F) : const Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.label,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight:
                            isSelected ? FontWeight.w800 : FontWeight.w600,
                        color: isSelected
                            ? const Color(0xFF0C831F)
                            : const Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      item.tag,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? const Color(0xFF0C831F)
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
                if (isSelected) ...[
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 15,
                    color: Color(0xFF0C831F),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPincodeFilter() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.pin_drop_outlined,
                        size: 18,
                        color: Color(0xFF0C831F),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _pincodeController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(6),
                          ],
                          onChanged: (val) {
                            if (val.trim().length == 6) {
                              _lookupPincode(val);
                            } else {
                              setState(() => _resolvedLocationText = null);
                            }
                          },
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                            color: const Color(0xFF0F172A),
                          ),
                          decoration: InputDecoration(
                            hintText: 'Enter 6-digit Pincode',
                            hintStyle: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w400,
                              letterSpacing: 0,
                              color: const Color(0xFF94A3B8),
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      if (_pincodeController.text.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _pincodeController.clear();
                            setState(() => _resolvedLocationText = null);
                          },
                          child: const Icon(
                            Icons.cancel_rounded,
                            size: 16,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 42,
                child: FilledButton.tonal(
                  onPressed: _isValidatingPincode
                      ? null
                      : () => _lookupPincode(_pincodeController.text),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFE7F3E9),
                    foregroundColor: const Color(0xFF0C831F),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _isValidatingPincode
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF0C831F),
                          ),
                        )
                      : Text(
                          'Check',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
            ],
          ),
          if (_resolvedLocationText != null &&
              _resolvedLocationText!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle_outline_rounded,
                    size: 15,
                    color: Color(0xFF16A34A),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Delivering to: $_resolvedLocationText',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF15803D),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          InkWell(
            onTap: _isDetectingLocation ? null : _detectCurrentLocation,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_isDetectingLocation)
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF0C831F),
                      ),
                    )
                  else
                    const Icon(
                      Icons.my_location_rounded,
                      size: 15,
                      color: Color(0xFF0C831F),
                    ),
                  const SizedBox(width: 6),
                  Text(
                    'Use my current GPS location',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0C831F),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDiscountOptions() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _discountOptions.map((opt) {
        final isSelected =
            (opt.value.isEmpty && _selectedDiscount == null) ||
            (_selectedDiscount == opt.value);
        return InkWell(
          onTap: () {
            setState(() {
              _selectedDiscount = opt.value.isEmpty ? null : opt.value;
            });
          },
          borderRadius: BorderRadius.circular(10),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE7F3E9) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? const Color(0xFF0C831F) : const Color(0xFFE2E8F0),
                width: isSelected ? 1.5 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (opt.value.isNotEmpty) ...[
                  const Icon(
                    Icons.percent_rounded,
                    size: 13,
                    color: Color(0xFF0C831F),
                  ),
                  const SizedBox(width: 4),
                ],
                Text(
                  opt.label,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected
                        ? const Color(0xFF0C831F)
                        : const Color(0xFF1E293B),
                  ),
                ),
                if (isSelected) ...[
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 14,
                    color: Color(0xFF0C831F),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBrandFilter(List<String> filteredBrands) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.brands.length > 5) ...[
          Container(
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: [
                const Icon(Icons.search, size: 16, color: Color(0xFF94A3B8)),
                const SizedBox(width: 6),
                Expanded(
                  child: TextField(
                    controller: _brandSearchController,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: const Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search brand name...',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        color: const Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 180),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // "All Brands" option
                InkWell(
                  onTap: () => setState(() => _selectedBrand = null),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: _selectedBrand == null
                          ? const Color(0xFFE7F3E9)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _selectedBrand == null
                            ? const Color(0xFF0C831F)
                            : const Color(0xFFE2E8F0),
                        width: _selectedBrand == null ? 1.5 : 1,
                      ),
                    ),
                    child: Text(
                      'All Brands',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: _selectedBrand == null
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: _selectedBrand == null
                            ? const Color(0xFF0C831F)
                            : const Color(0xFF1E293B),
                      ),
                    ),
                  ),
                ),
                ...filteredBrands.map((brand) {
                  final isSelected = _selectedBrand?.toLowerCase() ==
                      brand.toLowerCase();
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _selectedBrand = isSelected ? null : brand;
                      });
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFFE7F3E9)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF0C831F)
                              : const Color(0xFFE2E8F0),
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            brand,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.w800
                                  : FontWeight.w600,
                              color: isSelected
                                  ? const Color(0xFF0C831F)
                                  : const Color(0xFF1E293B),
                            ),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 5),
                            const Icon(
                              Icons.check_rounded,
                              size: 14,
                              color: Color(0xFF0C831F),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceRangeFilter() {
    final quickRanges = [
      (label: 'Under ₹100', min: '', max: '100'),
      (label: '₹100 - ₹300', min: '100', max: '300'),
      (label: '₹300 - ₹500', min: '300', max: '500'),
      (label: '₹500 - ₹1000', min: '500', max: '1000'),
      (label: 'Above ₹1000', min: '1000', max: ''),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: _buildPriceInputField(
                controller: _minPriceController,
                label: 'Min Price',
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                'to',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
            Expanded(
              child: _buildPriceInputField(
                controller: _maxPriceController,
                label: 'Max Price',
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: quickRanges.map((range) {
            final isMatch = _minPriceController.text.trim() == range.min &&
                _maxPriceController.text.trim() == range.max;
            return InkWell(
              onTap: () {
                setState(() {
                  _minPriceController.text = range.min;
                  _maxPriceController.text = range.max;
                });
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isMatch ? const Color(0xFFE7F3E9) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isMatch ? const Color(0xFF0C831F) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Text(
                  range.label,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: isMatch ? FontWeight.w700 : FontWeight.w500,
                    color: isMatch
                        ? const Color(0xFF0C831F)
                        : const Color(0xFF475569),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPriceInputField({
    required TextEditingController controller,
    required String label,
  }) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: [
          Text(
            '₹',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0C831F),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
              decoration: InputDecoration(
                hintText: label,
                hintStyle: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: const Color(0xFF94A3B8),
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInStockToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: _inStockOnly ? const Color(0xFFE7F3E9) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _inStockOnly ? const Color(0xFF0C831F) : const Color(0xFFE2E8F0),
          width: _inStockOnly ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: _inStockOnly
                  ? const Color(0xFF0C831F)
                  : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.inventory_2_outlined,
              size: 16,
              color: _inStockOnly ? Colors.white : const Color(0xFF64748B),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'In-Stock Products Only',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                Text(
                  'Hide items that are out of stock for this pincode',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: _inStockOnly,
            onChanged: (val) => setState(() => _inStockOnly = val),
            activeThumbColor: const Color(0xFF0C831F),
            activeTrackColor: const Color(0xFF9FD4A8),
          ),
        ],
      ),
    );
  }
}
