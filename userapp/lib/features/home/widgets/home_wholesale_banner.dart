import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../config/app_decorations.dart';
import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../models/offer_banner.dart';
import '../../../widgets/common/app_network_image.dart';
import '../home_providers.dart';

class HomeWholesaleBanner extends ConsumerStatefulWidget {
  const HomeWholesaleBanner({super.key});

  @override
  ConsumerState<HomeWholesaleBanner> createState() => _HomeWholesaleBannerState();
}

class _HomeWholesaleBannerState extends ConsumerState<HomeWholesaleBanner> {
  static const _autoPlayMs = 5000;

  final PageController _pageController = PageController();
  Timer? _autoPlayTimer;
  int _currentPage = 0;

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _scheduleAutoPlay(int itemCount) {
    _autoPlayTimer?.cancel();
    if (itemCount <= 1) return;

    _autoPlayTimer = Timer.periodic(const Duration(milliseconds: _autoPlayMs), (_) {
      if (!_pageController.hasClients) return;
      final current = _pageController.page?.round() ?? _currentPage;
      final next = (current + 1) % itemCount;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeOutCubic,
      );
    });
  }

  void _pauseAutoPlay() {
    _autoPlayTimer?.cancel();
    _autoPlayTimer = null;
  }

  void _goToPage(int index, int itemCount) {
    if (!_pageController.hasClients || itemCount <= 1) return;
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _openLink(String linkUrl) async {
    final trimmed = linkUrl.trim();
    if (trimmed.isEmpty) return;

    final uri = Uri.tryParse(trimmed);
    if (uri == null) return;

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  OfferBanner _fallbackBanner() {
    return const OfferBanner(
      id: 'fallback',
      imageUrl: AppConstants.promoBannerImage,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bannersAsync = ref.watch(offerBannersProvider);

    return bannersAsync.when(
      loading: () => Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
          child: Container(
            height: 168,
            color: AppColors.mobileSurface,
          ),
        ),
      ),
      error: (_, _) => _buildBanner(context, _fallbackBanner()),
      data: (banners) {
        final slides = banners.isEmpty ? [_fallbackBanner()] : banners;
        _scheduleAutoPlay(slides.length);

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          child: Column(
            children: [
              SizedBox(
                height: 168,
                child: Stack(
                  children: [
                    PageView.builder(
                      controller: _pageController,
                      itemCount: slides.length,
                      onPageChanged: (index) {
                        setState(() => _currentPage = index);
                        _scheduleAutoPlay(slides.length);
                      },
                      itemBuilder: (context, index) => _buildBanner(context, slides[index]),
                    ),
                    if (slides.length > 1) ...[
                      Positioned(
                        left: 6,
                        top: 0,
                        bottom: 0,
                        child: Center(
                          child: _SliderArrowButton(
                            icon: Icons.chevron_left_rounded,
                            onPressed: () {
                              _pauseAutoPlay();
                              _goToPage(
                                (_currentPage - 1 + slides.length) % slides.length,
                                slides.length,
                              );
                              _scheduleAutoPlay(slides.length);
                            },
                          ),
                        ),
                      ),
                      Positioned(
                        right: 6,
                        top: 0,
                        bottom: 0,
                        child: Center(
                          child: _SliderArrowButton(
                            icon: Icons.chevron_right_rounded,
                            onPressed: () {
                              _pauseAutoPlay();
                              _goToPage((_currentPage + 1) % slides.length, slides.length);
                              _scheduleAutoPlay(slides.length);
                            },
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (slides.length > 1) ...[
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(slides.length, (index) {
                    final active = index == _currentPage;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: active ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: active ? AppColors.primary : AppColors.borderLight,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    );
                  }),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildBanner(BuildContext context, OfferBanner banner) {
    final content = ClipRRect(
      borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
      child: Stack(
        children: [
          SizedBox(
            height: 168,
            width: double.infinity,
            child: AppNetworkImage(
              imageUrl: banner.imageUrl,
              fit: BoxFit.cover,
              cacheWidth: 720,
              cacheHeight: 336,
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.82),
                    Colors.black.withValues(alpha: 0.45),
                    Colors.black.withValues(alpha: 0.1),
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        height: 1.25,
                      ),
                      children: [
                        TextSpan(text: '${banner.title} '),
                        TextSpan(
                          text: banner.titleHighlight,
                          style: const TextStyle(color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    banner.subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.9),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    if (banner.linkUrl.trim().isNotEmpty) {
      return GestureDetector(
        onTap: () => _openLink(banner.linkUrl),
        child: content,
      );
    }

    return content;
  }
}

class _SliderArrowButton extends StatelessWidget {
  const _SliderArrowButton({
    required this.icon,
    required this.onPressed,
  });

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.38),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          width: 30,
          height: 30,
          child: Icon(icon, color: Colors.white, size: 22),
        ),
      ),
    );
  }
}
