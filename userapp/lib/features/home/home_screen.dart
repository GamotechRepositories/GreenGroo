import 'package:flutter/material.dart';
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';



import '../../config/theme.dart';

import '../../core/refresh/app_refresh.dart';

import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/scroll/vertical_scroll_pause_scope.dart';

import 'home_load_gate.dart';

import '../../widgets/layout/shell_bottom_insets.dart';
import 'widgets/best_deals_section.dart';

import 'widgets/category_nav_section.dart';

import 'widgets/hero_banner_carousel.dart';

import 'widgets/hot_selling_section.dart';

import 'widgets/just_arrived_section.dart';

import 'widgets/recently_viewed_section.dart';

import 'widgets/social_media_carousel_section.dart';

import 'widgets/testimonials_section.dart';

import 'widgets/home_wholesale_banner.dart';

import 'widgets/top_brands_section.dart';

import 'widgets/why_choose_us_section.dart';



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

      // Give first frame time to settle before starting non-critical home fetch.
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
    final scrolling =
        _scrollController.position.isScrollingNotifier.value;
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
    final bottomContentSpacer = ShellBottomInsets.of(context);

    return VerticalScrollPauseScope(
      isScrolling: _verticalScrolling,
      child: ColoredBox(

      color: AppColors.pageBackground,

      child: RefreshIndicator(

        color: const Color(0xFFFF7A00),

        onRefresh: () => refreshHomeData(ref),

        child: CustomScrollView(

          controller: _scrollController,

          physics: AppScrollConfig.listPhysics,

          cacheExtent: AppScrollConfig.cacheExtent,

          slivers: [

            SliverToBoxAdapter(

              child: DecoratedBox(

                decoration: const BoxDecoration(

                  gradient: LinearGradient(

                    begin: Alignment.topCenter,

                    end: Alignment.bottomCenter,

                    colors: [

                      AppColors.headerSearchBg,

                      AppColors.headerFadeBg,

                      AppColors.pageBackground,

                    ],

                    stops: [0.0, 0.45, 1.0],

                  ),

                ),

                child: Column(

                  children: [

                    const Padding(

                      padding: EdgeInsets.fromLTRB(12, 8, 12, 4),

                      child: RepaintBoundary(child: HeroBannerCarousel()),

                    ),

                  ],

                ),

              ),

            ),

            const SliverToBoxAdapter(child: CategoryNavSection()),

            const SliverToBoxAdapter(

              child: GatedHomeSection(

                minPhase: HomeLoadPhase.brands,

                placeholderHeight: 140,

                child: TopBrandsSection(),

              ),

            ),

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

            const SliverToBoxAdapter(

              child: GatedHomeSection(

                minPhase: HomeLoadPhase.scrolled,

                placeholderHeight: 280,

                child: RepaintBoundary(child: WhyChooseUsSection()),

              ),

            ),

            const SliverToBoxAdapter(

              child: GatedHomeSection(

                minPhase: HomeLoadPhase.scrolled,

                placeholderHeight: 168,

                child: HomeWholesaleBanner(),

              ),

            ),

            const SliverToBoxAdapter(

              child: GatedHomeSection(

                minPhase: HomeLoadPhase.scrolled,

                placeholderHeight: 180,

                child: TestimonialsSection(),

              ),

            ),

            const SliverToBoxAdapter(

              child: GatedHomeSection(

                minPhase: HomeLoadPhase.scrolled,

                placeholderHeight: 160,

                child: SocialMediaCarouselSection(),

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

