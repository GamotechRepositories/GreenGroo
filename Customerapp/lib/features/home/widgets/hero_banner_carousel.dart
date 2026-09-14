import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/app_decorations.dart';
import '../../../config/theme.dart';
import '../../../models/hero_banner.dart';
import '../../../widgets/common/app_network_image.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../home_providers.dart';

class HeroBannerCarousel extends ConsumerStatefulWidget {
  const HeroBannerCarousel({super.key});

  @override
  ConsumerState<HeroBannerCarousel> createState() => _HeroBannerCarouselState();
}

class _HeroBannerCarouselState extends ConsumerState<HeroBannerCarousel> {
  static const _bannerHeight = 228.0;
  final _pageController = PageController(viewportFraction: 0.92);

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<HeroBanner> _visibleBanners(List<HeroBanner> banners) {
    return banners
        .where((banner) => banner.isActive && banner.imageUrl.trim().isNotEmpty)
        .toList()
      ..sort((a, b) => a.order.compareTo(b.order));
  }

  @override
  Widget build(BuildContext context) {
    final bannersAsync = ref.watch(heroBannersProvider);

    return bannersAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.only(top: 4, bottom: 12),
        child: SkeletonHeroBanner(),
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (banners) {
        final slides = _visibleBanners(banners);
        if (slides.isEmpty) return const SizedBox.shrink();
        return _buildCarousel(slides);
      },
    );
  }

  Widget _buildCarousel(List<HeroBanner> slides) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 12),
      child: Column(
        children: [
          SizedBox(
            height: _bannerHeight,
            child: PageView.builder(
              controller: _pageController,
              itemCount: slides.length,
              allowImplicitScrolling: false,
              itemBuilder: (context, index) {
                final banner = slides[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _BannerSlide(banner: banner),
                );
              },
            ),
          ),
          if (slides.length > 1) ...[
            const SizedBox(height: 12),
            _BannerPageDots(
              controller: _pageController,
              itemCount: slides.length,
            ),
          ],
        ],
      ),
    );
  }
}

class _BannerPageDots extends StatefulWidget {
  const _BannerPageDots({
    required this.controller,
    required this.itemCount,
  });

  final PageController controller;
  final int itemCount;

  @override
  State<_BannerPageDots> createState() => _BannerPageDotsState();
}

class _BannerPageDotsState extends State<_BannerPageDots> {
  int _current = 0;

  @override
  void initState() {
    super.initState();
    _current = widget.controller.initialPage;
    widget.controller.addListener(_onPageChanged);
  }

  @override
  void didUpdateWidget(covariant _BannerPageDots oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onPageChanged);
      widget.controller.addListener(_onPageChanged);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onPageChanged);
    super.dispose();
  }

  void _onPageChanged() {
    final page = widget.controller.page?.round() ?? 0;
    if (page == _current) return;
    setState(() => _current = page);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.itemCount, (index) {
        final active = index == _current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: active ? 18 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: active ? AppColors.primary : AppColors.borderLight,
            borderRadius: BorderRadius.circular(999),
          ),
        );
      }),
    );
  }
}

class _BannerSlide extends StatelessWidget {
  const _BannerSlide({required this.banner});

  final HeroBanner banner;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
      child: SizedBox(
        height: _HeroBannerCarouselState._bannerHeight,
        width: double.infinity,
        child: AppNetworkImage(
          imageUrl: banner.imageUrl,
          fit: BoxFit.cover,
          alignment: Alignment.topCenter,
          width: double.infinity,
          height: _HeroBannerCarouselState._bannerHeight,
          cacheWidth: 400,
          cacheHeight: _HeroBannerCarouselState._bannerHeight.toInt(),
        ),
      ),
    );
  }
}
