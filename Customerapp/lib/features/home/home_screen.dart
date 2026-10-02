import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/refresh/app_refresh.dart';
import '../../core/theme/store_chrome.dart';
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

              // 4. Department Category Pills Section
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

    final headerBgColor = StoreChrome.forStore(currentStore).header;

    final Color topBarColor;
    if (currentStore == 'festive' || currentStore == 'ready2cook') {
      topBarColor = const Color(0xFF451A03);
    } else if (currentStore == 'mall' || currentStore == 'instantorder') {
      topBarColor = const Color(0xFF0F172A);
    } else {
      topBarColor = const Color(0xFF0F291E);
    }

    final int activeTabIndex = (currentStore == 'festive' || currentStore == 'ready2cook')
        ? 1
        : (currentStore == 'mall' || currentStore == 'instantorder')
            ? 2
            : 0;

    // Smoothly transition the top status-bar color from topBarColor to headerBgColor as search bar sticks
    final currentTopBarColor =
        Color.lerp(topBarColor, headerBgColor, (progress * 1.2).clamp(0.0, 1.0)) ??
            topBarColor;

    return SizedBox(
      height: currentExtent,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Layered backdrop at the top providing the contrasting top bar for inactive tabs when expanded,
          // smoothly transitioning to headerBgColor as search bar sticks
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: topInset + 44,
            child: ColoredBox(color: currentTopBarColor),
          ),

          // 2. Main curved header surface rising up around the active department
          ClipPath(
            clipper: CurvedHeaderClipper(
              topInset: topInset,
              progress: progress,
              activeTabIndex: activeTabIndex,
            ),
            child: Container(
              color: headerBgColor,
            ),
          ),

          // 3. Existing header content
          Padding(
            padding: EdgeInsets.only(top: topInset),
            child: ClipRect(
              child: OverflowBox(
                minHeight: 0,
                maxHeight: 300,
                alignment: Alignment.topCenter,
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
        ],
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

/// Custom clipper that applies the exact arc wave around the current open department tab,
/// and a smooth wave-like Bézier transition at the lower boundary.
class CurvedHeaderClipper extends CustomClipper<Path> {
  final double topInset;
  final double progress;
  final int activeTabIndex;

  CurvedHeaderClipper({
    required this.topInset,
    required this.progress,
    required this.activeTabIndex,
  });

  @override
  Path getClip(Size size) {
    final w = size.width;
    final h = size.height;
    final path = Path();

    final double arcFactor = (1.0 - progress).clamp(0.0, 1.0);

    // Geometry of the 3 department pills:
    // In HomeDeliveryBar: Container padding is (14, 4, 14, 2)
    // Inside: Padding horizontal 8.
    // Total margin on each side: 14 + 8 = 22.0.
    const double startX = 22.0;
    final double endX = w - 22.0;
    const double totalGap = 12.0; // 2 gaps of 6.0
    final double pillWidth = (endX - startX - totalGap) / 3.0;

    final double activeLeft = startX + activeTabIndex * (pillWidth + 6.0);
    final double activeRight = activeLeft + pillWidth;

    // Vertical coordinates:
    // Pills are 32px tall, starting 4px below topInset.
    final double pillTop = topInset + 4.0;
    final double tabTop = pillTop - 3.0 * arcFactor;
    final double baselineY = (pillTop + 32.0 + 3.0) * arcFactor + topInset * (1.0 - arcFactor);

    final double tabLeft = (activeLeft - 3.0).clamp(0.0, w);
    final double tabRight = (activeRight + 3.0).clamp(0.0, w);
    const double cornerR = 14.0;
    const double filletR = 14.0;

    if (arcFactor > 0.05) {
      if (activeTabIndex == 0) {
        // Active tab is Tab 0 (PreOrder, on left)
        path.moveTo(0, tabTop + cornerR);
        // Rounded top-left of tab 0
        path.quadraticBezierTo(0, tabTop, cornerR, tabTop);
        // Across top of tab 0
        path.lineTo(tabRight - cornerR, tabTop);
        // Rounded top-right of tab 0
        path.quadraticBezierTo(tabRight, tabTop, tabRight, tabTop + cornerR);
        // Vertical down toward baseline
        path.lineTo(tabRight, baselineY - filletR);
        // Smooth concave fillet down to baseline
        path.cubicTo(
          tabRight,
          baselineY - 3.0,
          tabRight + 4.0,
          baselineY,
          tabRight + filletR,
          baselineY,
        );
        // Across baseline to right edge
        path.lineTo(w, baselineY);
      } else if (activeTabIndex == 1) {
        // Active tab is Tab 1 (Ready2Cook, in center)
        path.moveTo(0, baselineY);
        // Line across baseline to left of Tab 1
        path.lineTo(tabLeft - filletR, baselineY);
        // Smooth concave fillet curving UP into Tab 1
        path.cubicTo(
          tabLeft - 4.0,
          baselineY,
          tabLeft,
          baselineY - 3.0,
          tabLeft,
          baselineY - filletR,
        );
        // Vertical up
        path.lineTo(tabLeft, tabTop + cornerR);
        // Rounded top-left of Tab 1
        path.quadraticBezierTo(tabLeft, tabTop, tabLeft + cornerR, tabTop);
        // Across top of Tab 1
        path.lineTo(tabRight - cornerR, tabTop);
        // Rounded top-right of Tab 1
        path.quadraticBezierTo(tabRight, tabTop, tabRight, tabTop + cornerR);
        // Vertical down
        path.lineTo(tabRight, baselineY - filletR);
        // Smooth concave fillet curving DOWN to baseline
        path.cubicTo(
          tabRight,
          baselineY - 3.0,
          tabRight + 4.0,
          baselineY,
          tabRight + filletR,
          baselineY,
        );
        // Across baseline to right edge
        path.lineTo(w, baselineY);
      } else {
        // Active tab is Tab 2 (InstantOrder, on right)
        path.moveTo(0, baselineY);
        // Line across baseline to left of Tab 2
        path.lineTo(tabLeft - filletR, baselineY);
        // Smooth concave fillet curving UP into Tab 2
        path.cubicTo(
          tabLeft - 4.0,
          baselineY,
          tabLeft,
          baselineY - 3.0,
          tabLeft,
          baselineY - filletR,
        );
        // Vertical up
        path.lineTo(tabLeft, tabTop + cornerR);
        // Rounded top-left of Tab 2
        path.quadraticBezierTo(tabLeft, tabTop, tabLeft + cornerR, tabTop);
        // Across top of Tab 2
        path.lineTo(tabRight - cornerR, tabTop);
        // Rounded top-right of Tab 2
        path.quadraticBezierTo(tabRight, tabTop, tabRight, tabTop + cornerR);
        // If tabRight is near w, curve to edge
        if (tabRight + filletR < w) {
          path.lineTo(tabRight, baselineY - filletR);
          path.cubicTo(
            tabRight,
            baselineY - 3.0,
            tabRight + 4.0,
            baselineY,
            tabRight + filletR,
            baselineY,
          );
          path.lineTo(w, baselineY);
        } else {
          path.lineTo(w, tabTop + cornerR);
        }
      }
    } else {
      // Scrolled collapsed state: cover top status bar area completely with headerBgColor
      path.moveTo(0, 0);
      path.lineTo(w, 0);
    }

    // Right side straight down to bottom
    path.lineTo(w, h);

    // Straight bottom line below the category row
    path.lineTo(0, h);

    // Close path back to start
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CurvedHeaderClipper oldClipper) {
    return oldClipper.topInset != topInset ||
        oldClipper.progress != progress ||
        oldClipper.activeTabIndex != activeTabIndex;
  }
}
