import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/theme/store_chrome.dart';
import '../../models/category.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/select_delivery_location_sheet.dart';
import '../../widgets/common/app_network_image.dart';
import '../../widgets/common/offers_badge_button.dart';
import '../../widgets/common/voice_mic_button.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../home/home_providers.dart';
import '../home/widgets/category_pills_section.dart';
import '../home/widgets/home_header_category_strip.dart';

/// Admin → Sections (name, badge, colour, description) keyed by slug.
final sectionsMetaProvider = FutureProvider<Map<String, Map<String, dynamic>>>((ref) async {
  final sections = await ref.read(apiServiceProvider).fetchSections(null, ref);
  return {
    for (final s in sections)
      (s['slug'] ?? s['storeType'] ?? '').toString().toLowerCase(): s,
  };
});

Color? _hex(String? value) {
  var hex = (value ?? '').trim().replaceAll('#', '');
  if (hex.length == 3) hex = hex.split('').map((c) => '$c$c').join();
  if (hex.length != 6) return null;
  final n = int.tryParse(hex, radix: 16);
  return n == null ? null : Color(0xFF000000 | n);
}

String _departmentName(String store) {
  if (store == 'festive') return 'Ready2Cook';
  if (store == 'mall') return 'InstantOrder';
  return 'PreOrder';
}

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.categories, _scrollController);
    });
  }

  Future<void> _refresh() async {
    ref.invalidate(categoriesProvider);
    ref.invalidate(sectionsMetaProvider);
    await ref.read(categoriesProvider.future).catchError((_) => <Category>[]);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabScrollRegistry.unregister(ShellTabIndex.categories, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  void _onCategoryTapped(String categoryName) {
    ref.read(selectedCategoryHeaderTabProvider.notifier).setCategory(categoryName);
    context.push('${RoutePaths.product}?categoryName=${Uri.encodeComponent(categoryName)}');
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
    final store = ref.watch(selectedStoreTabProvider);
    final section = bannerSectionForStore(store);
    final categoriesAsync = ref.watch(categoriesProvider);
    final meta = ref.watch(sectionsMetaProvider).value?[section];
    final topInset = MediaQuery.paddingOf(context).top;
    final location = ref.watch(deliveryLocationProvider);
    final storeName = ref.watch(nearestStoreProvider).value?.store?.storeName;
    final chrome = StoreChrome.forStore(store);

    final addressText = location?.hasLocation == true
        ? location!.displayAddress
        : 'Select location to see nearby stock';

    final title = (meta?['sectionName'] ?? _departmentName(store)).toString();
    final titleColor = _hex(meta?['color']?.toString()) ?? chrome.accent;

    return ColoredBox(
      color: Colors.white,
      child: RefreshIndicator(
        onRefresh: _refresh,
        color: chrome.accent,
        child: CustomScrollView(
          controller: _scrollController,
          physics: AppScrollConfig.listPhysics,
          slivers: [
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickyCategoryHeaderDelegate(
                topInset: topInset,
                addressText: addressText,
                storeName: storeName,
                searchController: _searchController,
                onSubmitted: _submitSearch,
                headerColor: chrome.header,
                locationColor: chrome.locationColor,
                searchHint: chrome.searchHint,
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                child: Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    height: 1.2,
                    fontWeight: FontWeight.w800,
                    color: titleColor,
                  ),
                ),
              ),
            ),
            ...categoriesAsync.when(
              loading: () => [_message('Loading categories…')],
              error: (_, _) => [_message('Could not load categories. Pull down to retry.')],
              data: (categories) => categories.isEmpty
                  ? [_message('No categories yet.')]
                  : [
                      SliverPadding(
                        padding: const EdgeInsets.all(16),
                        sliver: SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            mainAxisExtent: 122,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, i) {
                              final category = categories[i];
                              return BorderedCategoryCard(
                                name: category.categoryName,
                                image: category.categoryImage.isEmpty
                                    ? const ColoredBox(color: Color(0xFFF8FAFC))
                                    : AppNetworkImage(
                                        imageUrl: category.categoryImage,
                                        fit: BoxFit.contain,
                                      ),
                                onTap: () => _onCategoryTapped(category.categoryName),
                              );
                            },
                            childCount: categories.length,
                          ),
                        ),
                      ),
                    ],
            ),
            SliverToBoxAdapter(child: SizedBox(height: ShellBottomInsets.of(context) + 24)),
          ],
        ),
      ),
    );
  }

  Widget _message(String text) => SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(fontSize: 13, color: const Color(0xFF64748B)),
          ),
        ),
      );
}

class _StickyCategoryHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double topInset;
  final String addressText;
  final String? storeName;
  final TextEditingController searchController;
  final ValueChanged<String> onSubmitted;
  final Color headerColor;
  final Color locationColor;
  final String searchHint;

  _StickyCategoryHeaderDelegate({
    required this.topInset,
    required this.addressText,
    required this.storeName,
    required this.searchController,
    required this.onSubmitted,
    required this.headerColor,
    required this.locationColor,
    required this.searchHint,
  });

  @override
  double get minExtent => topInset + 92.0;

  @override
  double get maxExtent => topInset + 92.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      width: double.infinity,
      height: maxExtent,
      color: headerColor,
      foregroundDecoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6))),
      ),
      child: ClipRect(
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Padding(
            padding: EdgeInsets.only(top: topInset + 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 0, 12, 6),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 32,
                        height: 28,
                        child: IconButton(
                          onPressed: () {
                            if (context.canPop()) {
                              context.pop();
                            } else {
                              context.go(RoutePaths.home);
                            }
                          },
                          icon: const Icon(
                            Icons.arrow_back_rounded,
                            size: 22,
                            color: Color(0xFF111827),
                          ),
                          visualDensity: VisualDensity.compact,
                          padding: EdgeInsets.zero,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Consumer(
                          builder: (context, ref, _) => InkWell(
                            onTap: () => showSelectDeliveryLocationBottomSheet(context, ref),
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 1, horizontal: 2),
                              child: Row(
                                children: [
                                  Icon(Icons.location_on_rounded, size: 16, color: locationColor),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      addressText,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF111827),
                                      ),
                                    ),
                                  ),
                                  Icon(Icons.keyboard_arrow_down_rounded,
                                      size: 18, color: locationColor),
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
                                          color: locationColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE5E5E5)),
                          ),
                          padding: const EdgeInsets.only(left: 12, right: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.search_rounded,
                                  color: Color(0xFF6B7280), size: 20),
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
                                    hintText: searchHint,
                                    hintStyle: GoogleFonts.plusJakartaSans(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF9CA3AF),
                                    ),
                                    filled: false,
                                    isCollapsed: true,
                                    border: InputBorder.none,
                                    enabledBorder: InputBorder.none,
                                    focusedBorder: InputBorder.none,
                                    disabledBorder: InputBorder.none,
                                    errorBorder: InputBorder.none,
                                    focusedErrorBorder: InputBorder.none,
                                    isDense: true,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                              ),
                              VoiceMicButton(
                                onTranscript: (text, isFinal) {
                                  searchController.value = TextEditingValue(
                                    text: text,
                                    selection: TextSelection.collapsed(offset: text.length),
                                  );
                                  if (isFinal) onSubmitted(text);
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const OffersBadgeButton(height: 40),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyCategoryHeaderDelegate oldDelegate) => true;
}
