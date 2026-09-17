import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../models/category.dart';
import '../../routes/route_paths.dart';
import '../../widgets/category/category_grid_tile.dart';
import '../../widgets/common/app_loading.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../home/home_providers.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  List<Category> _preorderCategories = [];
  List<Category> _readyToCookCategories = [];
  List<Category> _instantCategories = [];

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.categories, _scrollController);
      _fetchDepartmentCategories();
    });
  }

  Future<void> _fetchDepartmentCategories() async {
    try {
      final api = ref.read(apiServiceProvider);
      final results = await Future.wait<List<Category>>([
        api.fetchCategories(section: 'preorder').catchError((_, _) => <Category>[]),
        api.fetchCategories(section: 'ready2cook').catchError((_, _) => <Category>[]),
        api.fetchCategories(section: 'instantorder').catchError((_, _) => <Category>[]),
      ]);
      if (mounted) {
        setState(() {
          _preorderCategories = results[0];
          _readyToCookCategories = results[1];
          _instantCategories = results[2];
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabScrollRegistry.unregister(ShellTabIndex.categories, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  void _onCategoryTapped(BuildContext context, String categoryName) {
    context.push(
      '${RoutePaths.product}?categoryName=${Uri.encodeComponent(categoryName)}',
    );
  }

  void _submitSearch(String query) {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      context.push(RoutePaths.product);
      return;
    }
    context.push('${RoutePaths.product}?q=${Uri.encodeComponent(trimmed)}');
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final topInset = MediaQuery.paddingOf(context).top;
    final location = ref.watch(deliveryLocationProvider);
    final nearestAsync = ref.watch(nearestStoreProvider);

    final addressText = location?.hasLocation == true
        ? location!.displayAddress
        : 'Select location to see nearby stock';
    final storeName = nearestAsync.value?.store?.storeName;

    return ColoredBox(
      color: const Color(0xFFF8FAFC),
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
          await _fetchDepartmentCategories();
        },
        color: const Color(0xFF047857),
        child: categoriesAsync.when(
          loading: () => const AppLoading(message: 'Loading department categories...'),
          error: (error, _) => _buildDirectoryBody(
            context: context,
            topInset: topInset,
            addressText: addressText,
            storeName: storeName,
            allCategories: resolveDisplayCategories(const []),
          ),
          data: (allCats) => _buildDirectoryBody(
            context: context,
            topInset: topInset,
            addressText: addressText,
            storeName: storeName,
            allCategories: resolveDisplayCategories(allCats),
          ),
        ),
      ),
    );
  }

  Widget _buildDirectoryBody({
    required BuildContext context,
    required double topInset,
    required String addressText,
    required String? storeName,
    required List<Category> allCategories,
  }) {
    final preorderList = _preorderCategories.isNotEmpty
        ? _preorderCategories
        : allCategories;

    final readyList = _readyToCookCategories.isNotEmpty
        ? _readyToCookCategories
        : allCategories;

    final instantList = _instantCategories.isNotEmpty
        ? _instantCategories
        : allCategories;

    return CustomScrollView(
      controller: _scrollController,
      physics: AppScrollConfig.listPhysics,
      cacheExtent: AppScrollConfig.cacheExtent,
      slivers: [
        // 1. Pinned Sticky Header with Full Gradient (#A8DEE0 to #F9EAD2): Location Bar (collapsible) + Search Bar (sticky)
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyCategoryHeaderDelegate(
            topInset: topInset,
            addressText: addressText,
            storeName: storeName,
            searchController: _searchController,
            onSubmitted: _submitSearch,
          ),
        ),

        // 2. Department Section 1: Preorder Store Categories (Whitish Grey Background)
        _buildDepartmentHeaderSliver(
          title: 'Preorder Categories',
          subtitle: 'Book in advance for fresh produce & farm items',
          icon: Icons.calendar_today_rounded,
          iconColor: const Color(0xFF047857),
          badgeColor: Colors.white,
        ),
        _buildCategoryGridSliver(context, preorderList),

        // 3. Department Section 2: Ready to Cook Store Categories (Whitish Grey Background)
        _buildDepartmentHeaderSliver(
          title: 'Ready to Cook Categories',
          subtitle: 'Pre-cut vegetables, meal kits & instant cooking',
          icon: Icons.restaurant_rounded,
          iconColor: const Color(0xFFEA580C),
          badgeColor: Colors.white,
        ),
        _buildCategoryGridSliver(context, readyList),

        // 4. Department Section 3: Instant Order Store Categories (Whitish Grey Background)
        _buildDepartmentHeaderSliver(
          title: 'Instant Order Categories',
          subtitle: 'Express delivery items & quick snacks',
          icon: Icons.bolt_rounded,
          iconColor: const Color(0xFF2563EB),
          badgeColor: Colors.white,
        ),
        _buildCategoryGridSliver(context, instantList),

        SliverToBoxAdapter(
          child: SizedBox(height: ShellBottomInsets.of(context) + 24),
        ),
      ],
    );
  }

  Widget _buildDepartmentHeaderSliver({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color badgeColor,
  }) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryGridSliver(
    BuildContext context,
    List<Category> categoryList,
  ) {
    if (categoryList.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.82,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final cat = categoryList[index];
            final imageUrl = resolveCategoryImageUrl(cat);

            return InkWell(
              onTap: () => _onCategoryTapped(context, cat.categoryName),
              borderRadius: BorderRadius.circular(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Single image box (NO double box around tile)
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                      ),
                      padding: const EdgeInsets.all(8),
                      child: Center(
                        child: imageUrl != null
                            ? AppNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.contain,
                                errorIcon: Icons.restaurant_rounded,
                                errorIconSize: 32,
                              )
                            : const Icon(
                                Icons.category_rounded,
                                size: 32,
                                color: Color(0xFF047857),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Category name outside the box (NO '4 items' or 'Explore' text)
                  Text(
                    cat.categoryName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
            );
          },
          childCount: categoryList.length,
        ),
      ),
    );
  }
}

class _StickyCategoryHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double topInset;
  final String addressText;
  final String? storeName;
  final TextEditingController searchController;
  final ValueChanged<String> onSubmitted;

  _StickyCategoryHeaderDelegate({
    required this.topInset,
    required this.addressText,
    required this.storeName,
    required this.searchController,
    required this.onSubmitted,
  });

  @override
  double get minExtent => topInset + 86.0;

  @override
  double get maxExtent => topInset + 86.0;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final currentHeight = (maxExtent - shrinkOffset).clamp(minExtent, maxExtent);

    return Container(
      width: double.infinity,
      height: currentHeight,
      color: const Color(0xFFFFF6EE),
      child: ClipRect(
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: topInset + 2),
              // 1. Select Location Row (with Back Button)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go(RoutePaths.home);
                        }
                      },
                      icon: const Icon(
                        Icons.arrow_back_rounded,
                        size: 20,
                        color: Color(0xFF0F172A),
                      ),
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: InkWell(
                        onTap: () => context.push(RoutePaths.location),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                size: 16,
                                color: Color(0xFF047857),
                              ),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  addressText,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF06311D),
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 18,
                                color: Color(0xFF047857),
                              ),
                              if (storeName?.isNotEmpty == true) ...[
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    '($storeName)',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF047857),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              // 2. Search Bar Box (Pure White inner box)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Container(
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.search_rounded,
                        color: Color(0xFF047857),
                        size: 19,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: searchController,
                          onSubmitted: onSubmitted,
                          textInputAction: TextInputAction.search,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF111827),
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search',
                            hintStyle: GoogleFonts.plusJakartaSans(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
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
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyCategoryHeaderDelegate oldDelegate) {
    return oldDelegate.topInset != topInset ||
        oldDelegate.addressText != addressText ||
        oldDelegate.storeName != storeName;
  }
}
