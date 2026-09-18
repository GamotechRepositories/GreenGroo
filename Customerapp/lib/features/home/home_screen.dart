import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/refresh/app_refresh.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/scroll/vertical_scroll_pause_scope.dart';
import '../../routes/route_paths.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import 'home_load_gate.dart';
import 'widgets/best_deals_section.dart';
import 'widgets/category_pills_section.dart';
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
              // 1. Pinned Sticky White Header containing Department cards, Location bar, Search bar + Super Offers badge & Category icons strip
              SliverPersistentHeader(
                pinned: true,
                delegate: _StickyHeaderDelegate(
                  topInset: topInset,
                  isLightNotifier: _isHeaderLightNotifier,
                ),
              ),

              // 2. Banner 1 Hero Image Card (Fresh FRUITS Nature's Goodness in Every Bite)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
                  child: InkWell(
                    onTap: () => context.push(RoutePaths.product),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          'assets/images/banner1.png',
                          fit: BoxFit.cover,
                          width: double.infinity,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // 3. Continuous Full-Width Marquee Offer Ticker Animation (Right-to-Left)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 8),
                  child: TickerMarqueeStrip(
                    backgroundColor: Color(0xFF047857),
                  ),
                ),
              ),

              // 4. Offer Banner Carousel (1.png, 2.png, 3.png) + SBI Card Instant Discount Pill
              const SliverToBoxAdapter(
                child: ZeptoHeroOfferCardsSection(),
              ),

              // 5. Explore GG Category (2 Rows Grid with Leaf/Wheat Watermark Shades + Ready to Cook + Instant Order + Book Order)
              const SliverToBoxAdapter(child: CategoryPillsSection()),

              // 6. Category-wise Products Grid
              const SliverToBoxAdapter(child: HomeAllCategoryProducts()),

              // 7. Featured Deal Sections
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

  _StickyHeaderDelegate({
    required this.topInset,
    required this.isLightNotifier,
  });

  @override
  double get minExtent => topInset + 100.0;

  @override
  double get maxExtent => topInset + 174.0;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final maxShrink = maxExtent - minExtent;
    final progress =
        maxShrink > 0 ? (shrinkOffset / maxShrink).clamp(0.0, 1.0) : 1.0;
    final deliveryBarHeight = (74.0 * (1.0 - progress)).clamp(0.0, 74.0);

    return ColoredBox(
      color: Colors.white,
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
                    minHeight: 74.0,
                    maxHeight: 74.0,
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
    );
  }

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) {
    return oldDelegate.isLightNotifier != isLightNotifier ||
        oldDelegate.topInset != topInset;
  }
}
