import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/refresh/app_refresh.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/scroll/vertical_scroll_pause_scope.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import 'home_load_gate.dart';
import 'home_providers.dart';
import 'widgets/banner1_hero_widget.dart';
import 'widgets/best_deals_section.dart';
import 'widgets/category_pills_section.dart';
import 'widgets/department_hero_widget.dart';
import 'widgets/home_all_category_products.dart';
import 'widgets/home_delivery_bar.dart';
import 'widgets/home_header_category_strip.dart';
import 'widgets/home_search_bar.dart';
import 'widgets/hot_selling_section.dart';
import 'widgets/just_arrived_section.dart';
import 'widgets/recently_viewed_section.dart';
import 'widgets/zepto_festive_hero_section.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _verticalScrolling = ValueNotifier<bool>(false);
  final _isHeaderLightNotifier = ValueNotifier<bool>(true);

  bool _scrollGateTriggered = false;
  bool _scrollActivityAttached = false;

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.home, _scrollController);
      _attachVerticalScrollActivityListener();
      unawaited(
        Future<void>.delayed(const Duration(milliseconds: 260), () {
          if (!mounted) return;
          ref.read(homeLoadGateProvider.notifier).enableBrands();
        }),
      );
    });
  }

  void _attachVerticalScrollActivityListener() {
    if (_scrollActivityAttached || !_scrollController.hasClients) return;
    _scrollActivityAttached = true;
    _scrollController.position.isScrollingNotifier
        .addListener(_onVerticalScrollActivity);
    _onVerticalScrollActivity();
  }

  void _onVerticalScrollActivity() {
    if (!_scrollController.hasClients) return;
    final scrolling = _scrollController.position.isScrollingNotifier.value;
    if (_verticalScrolling.value != scrolling) {
      _verticalScrolling.value = scrolling;
    }
  }

  void _onScroll() {
    _attachVerticalScrollActivityListener();

    if (_scrollGateTriggered) return;
    if (_scrollController.offset < 48) return;
    _scrollGateTriggered = true;
    ref.read(homeLoadGateProvider.notifier).enableScrolled();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    if (_scrollActivityAttached && _scrollController.hasClients) {
      _scrollController.position.isScrollingNotifier
          .removeListener(_onVerticalScrollActivity);
    }
    _verticalScrolling.dispose();
    _isHeaderLightNotifier.dispose();
    _tabScrollRegistry.unregister(ShellTabIndex.home, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    final bottomContentSpacer = ShellBottomInsets.of(context) + 56;
    final currentStore = ref.watch(selectedStoreTabProvider);

    return VerticalScrollPauseScope(
      isScrolling: _verticalScrolling,
      child: ColoredBox(
        color: const Color(0xFFF8FAFC),
        child: RefreshIndicator(
          color: const Color(0xFF0C831F),
          onRefresh: () => refreshHomeData(ref),
          child: CustomScrollView(
            controller: _scrollController,
            physics: AppScrollConfig.listPhysics,
            cacheExtent: AppScrollConfig.cacheExtent,
            slivers: [
              // 1. Pinned Sticky Header
              SliverPersistentHeader(
                pinned: true,
                delegate: _StickyHeaderDelegate(
                  topInset: topInset,
                  isLightNotifier: _isHeaderLightNotifier,
                  currentStore: currentStore,
                ),
              ),

              // 2. Department Hero / Banner
              SliverToBoxAdapter(
                child: currentStore == 'main'
                    ? const Banner1HeroWidget()
                    : DepartmentHeroWidget(storeType: currentStore),
              ),

              // 3. Marquee Ticker
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 8),
                  child: TickerMarqueeStrip(
                    backgroundColor: currentStore == 'festive'
                        ? const Color(0xFFC2410C)
                        : currentStore == 'mall'
                            ? const Color(0xFF1E40AF)
                            : const Color(0xFF047857),
                  ),
                ),
              ),

              // 4. Offer Banner / Discount Pill (Only for Preorder store)
              if (currentStore == 'main')
                const SliverToBoxAdapter(
                  child: ZeptoHeroOfferCardsSection(),
                ),

              // 5. Department Category Pills Section
              const SliverToBoxAdapter(child: CategoryPillsSection()),

              // 6. Category-wise Products Grid
              const SliverToBoxAdapter(child: HomeAllCategoryProducts()),

              // 7. Featured Deal Sections (Only on Preorder / Main tab)
              if (currentStore == 'main') ...[
                const SliverToBoxAdapter(
                  child: GatedHomeSection(
                    minPhase: HomeLoadPhase.scrolled,
                    placeholderHeight: 280,
                    child: RepaintBoundary(child: BestDealsSection()),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: GatedHomeSection(
                    minPhase: HomeLoadPhase.scrolled,
                    placeholderHeight: 280,
                    child: RepaintBoundary(child: JustArrivedSection()),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: GatedHomeSection(
                    minPhase: HomeLoadPhase.scrolled,
                    placeholderHeight: 280,
                    child: RepaintBoundary(child: HotSellingSection()),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: GatedHomeSection(
                    minPhase: HomeLoadPhase.scrolled,
                    placeholderHeight: 280,
                    child: RepaintBoundary(child: RecentlyViewedSection()),
                  ),
                ),
              ],

              // 8. Footer
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                  child: Text(
                    'GreenGrocc · Fresh groceries, fast',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF9CA3AF),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(child: SizedBox(height: bottomContentSpacer)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double topInset;
  final ValueNotifier<bool> isLightNotifier;
  final String currentStore;

  _StickyHeaderDelegate({
    required this.topInset,
    required this.isLightNotifier,
    required this.currentStore,
  });

  @override
  double get minExtent => topInset + 104.0;

  @override
  double get maxExtent => topInset + 172.0;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final currentExtent =
        (maxExtent - shrinkOffset).clamp(minExtent, maxExtent);
    final maxShrink = maxExtent - minExtent;
    final progress =
        maxShrink > 0 ? (shrinkOffset / maxShrink).clamp(0.0, 1.0) : 1.0;
    final deliveryBarHeight = (68.0 * (1.0 - progress)).clamp(0.0, 68.0);

    final headerBgColor = currentStore == 'festive'
        ? const Color(0xFFFDE8CD)
        : currentStore == 'mall'
            ? const Color(0xFFDCE9FF)
            : const Color(0xFFB0DAC6);

    return SizedBox(
      height: currentExtent,
      child: ColoredBox(
        color: headerBgColor,
        child: Padding(
          padding: EdgeInsets.only(top: topInset),
          child: ClipRect(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (progress < 1.0)
                  SizedBox(
                    height: deliveryBarHeight,
                    child: OverflowBox(
                      minHeight: 68.0,
                      maxHeight: 68.0,
                      alignment: Alignment.bottomCenter,
                      child: Opacity(
                        opacity: (1.0 - progress * 1.5).clamp(0.0, 1.0),
                        child: const HomeDeliveryBar(),
                      ),
                    ),
                  ),
                const HomeSearchBar(isLightBg: true),
                const HomeHeaderCategoryStrip(isLightBg: true),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) {
    return oldDelegate.isLightNotifier != isLightNotifier ||
        oldDelegate.topInset != topInset ||
        oldDelegate.currentStore != currentStore;
  }
}
