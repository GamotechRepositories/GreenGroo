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
import 'widgets/hot_selling_section.dart';
import 'widgets/just_arrived_section.dart';
import 'widgets/recently_viewed_section.dart';
import 'widgets/zepto_festive_home.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _verticalScrolling = ValueNotifier<bool>(false);

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
    _scrollController.removeListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    if (_scrollActivityAttached && _scrollController.hasClients) {
      _scrollController.position.isScrollingNotifier
          .removeListener(_onVerticalScrollActivity);
    }
    _verticalScrolling.dispose();
    _tabScrollRegistry.unregister(ShellTabIndex.home, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomContentSpacer = ShellBottomInsets.of(context) + 56;

    return VerticalScrollPauseScope(
      isScrolling: _verticalScrolling,
      child: ColoredBox(
        color: const Color(0xFFFFF6E0),
        child: RefreshIndicator(
          color: const Color(0xFFE11D48),
          onRefresh: () => refreshHomeData(ref),
          child: CustomScrollView(
            controller: _scrollController,
            physics: AppScrollConfig.listPhysics,
            cacheExtent: AppScrollConfig.cacheExtent,
            slivers: [
              const SliverToBoxAdapter(child: ZeptoFestiveHeroSection()),
              const ContouredCreamToWhite(),
              const SliverToBoxAdapter(child: FestiveTopPicksSection()),
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
              ContouredCreamToWhite(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
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

/// Soft curve from cream hero into white content.
class ContouredCreamToWhite extends StatelessWidget {
  const ContouredCreamToWhite({super.key, this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: child ?? const SizedBox(height: 8),
      ),
    );
  }
}

/// Dark floating “Unlock free delivery” bar (Zepto-style).
class FreeDeliveryOfferBar extends StatelessWidget {
  const FreeDeliveryOfferBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(RoutePaths.coupons),
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Color(0xFF374151),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.delivery_dining_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Unlock free delivery',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Shop for ₹199',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFFD1D5DB),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Colors.white70),
                ],
              ),
            ),
            Positioned(
              top: -10,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE11D48),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Offers ▲',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
