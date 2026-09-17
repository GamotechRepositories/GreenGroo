import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';

import '../../../routes/route_paths.dart';

class TickerOfferData {
  const TickerOfferData({
    required this.icon,
    required this.badge,
    required this.badgeBg,
    required this.badgeTextColor,
    required this.text,
    required this.code,
  });

  final String icon;
  final String badge;
  final Color badgeBg;
  final Color badgeTextColor;
  final String text;
  final String code;
}

const _tickerOffers = [
  TickerOfferData(
    icon: '🏷️',
    badge: 'SPECIAL OFFER',
    badgeBg: Color(0xFFF59E0B),
    badgeTextColor: Colors.black,
    text: 'FLAT 50% OFF on First 3 Orders',
    code: 'USE: FRESH50',
  ),
  TickerOfferData(
    icon: '👨‍🌾',
    badge: 'DIRECT FARMERS',
    badgeBg: Color(0xFF047857),
    badgeTextColor: Colors.white,
    text: 'Nashik Farmers Co-op Harvest',
    code: '100% ORGANIC',
  ),
  TickerOfferData(
    icon: '⚡',
    badge: 'EXPRESS',
    badgeBg: Color(0xFF059669),
    badgeTextColor: Colors.white,
    text: 'FREE 10-Min Express Delivery on ₹99+',
    code: 'NO CODE NEEDED',
  ),
  TickerOfferData(
    icon: '💳',
    badge: 'BANK DEAL',
    badgeBg: Color(0xFF0284C7),
    badgeTextColor: Colors.white,
    text: '10% Instant Discount on SBI Cards',
    code: 'SAVE UP TO ₹100',
  ),
  TickerOfferData(
    icon: '🎁',
    badge: 'FREE GIFT',
    badgeBg: Color(0xFF9333EA),
    badgeTextColor: Colors.white,
    text: 'Free Fresh Palak Bunch on Orders ₹199+',
    code: 'AUTO-ADDED',
  ),
];

class ZeptoFestiveHeroSection extends StatefulWidget {
  const ZeptoFestiveHeroSection({super.key});

  @override
  State<ZeptoFestiveHeroSection> createState() =>
      _ZeptoFestiveHeroSectionState();
}

class _ZeptoFestiveHeroSectionState extends State<ZeptoFestiveHeroSection> {
  VideoPlayerController? _videoController;
  bool _videoInitialized = false;

  final ScrollController _marqueeScrollController = ScrollController();
  Timer? _marqueeTimer;

  @override
  void initState() {
    super.initState();
    _initVideo();
    _startMarqueeTimer();
  }

  Future<void> _initVideo() async {
    try {
      _videoController = VideoPlayerController.asset(
        'assets/video/10847026-hd_1920_1080_25fps.mp4',
      );
      await _videoController!.initialize();
      await _videoController!.setLooping(true);
      await _videoController!.setVolume(0);
      await _videoController!.play();
      if (mounted) {
        setState(() => _videoInitialized = true);
      }
    } catch (e, st) {
      debugPrint('Error initializing local asset video: $e\n$st');
      try {
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(
            'https://raw.githubusercontent.com/intel/cart-sample/main/video.mp4',
          ),
        );
        await _videoController!.initialize();
        await _videoController!.setLooping(true);
        await _videoController!.setVolume(0);
        await _videoController!.play();
        if (mounted) {
          setState(() => _videoInitialized = true);
        }
      } catch (e2) {
        debugPrint('Error initializing fallback network video: $e2');
      }
    }
  }

  void _startMarqueeTimer() {
    _marqueeTimer = Timer.periodic(const Duration(milliseconds: 40), (_) {
      if (!_marqueeScrollController.hasClients) return;
      final maxExtent = _marqueeScrollController.position.maxScrollExtent;
      final currentOffset = _marqueeScrollController.offset;
      if (currentOffset >= maxExtent) {
        _marqueeScrollController.jumpTo(0);
      } else {
        _marqueeScrollController.jumpTo(currentOffset + 1.2);
      }
    });
  }

  @override
  void dispose() {
    _marqueeTimer?.cancel();
    _marqueeScrollController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.transparent,
      child: Column(
        children: [
          // 1. Sky Blue / Video Header Card with "Explore More" Button
          Container(
            height: 180,
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (_videoInitialized && _videoController != null)
                  FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: _videoController!.value.size.width,
                      height: _videoController!.value.size.height,
                      child: VideoPlayer(_videoController!),
                    ),
                  )
                else
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF064E3B), Color(0xFF0F172A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shopping_bag_outlined,
                        size: 64,
                        color: Colors.white24,
                      ),
                    ),
                  ),
                // Dark Overlay Gradient
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.2),
                        Colors.black.withValues(alpha: 0.6),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Continuous Moving Offers Marquee Strip
          Container(
            height: 34,
            margin: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: ListView.builder(
              controller: _marqueeScrollController,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final offer = _tickerOffers[index % _tickerOffers.length];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(
                    children: [
                      Text(offer.icon, style: const TextStyle(fontSize: 12)),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: offer.badgeBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          offer.badge,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: offer.badgeTextColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        offer.text,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Text(
                          offer.code,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF065F46),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Text('•', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

/// Asset Image Banner Carousel (1.png, 2.png, 3.png with peek preview on left & right) + SBI Card Box
class ZeptoHeroOfferCardsSection extends StatelessWidget {
  const ZeptoHeroOfferCardsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.only(top: 14, bottom: 6),
      child: Column(
        children: [
          // Banner Image Carousel (1.png, 2.png, 3.png)
          const BannerSliderCarousel(),

          const SizedBox(height: 12),

          // SBI Card Instant Discount Pill
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Row(
                children: [
                  // SBI Logo Pill
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00A3E0),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'SBI card',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 1,
                    height: 24,
                    color: const Color(0xFFE5E7EB),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '10% Instant Discount*',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF111827),
                          ),
                        ),
                        Text(
                          'with SBI Credit Card (also valid on EMI)',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '*T&C',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

/// Infinite PageView Banner Slider showing 1.png, 2.png, 3.png with peek previews on left & right
class BannerSliderCarousel extends StatefulWidget {
  const BannerSliderCarousel({super.key});

  @override
  State<BannerSliderCarousel> createState() => _BannerSliderCarouselState();
}

class _BannerSliderCarouselState extends State<BannerSliderCarousel> {
  static const _images = [
    'assets/images/1.png',
    'assets/images/2.png',
    'assets/images/3.png',
  ];

  late final PageController _pageController;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Start at a high page multiple of 3 so scrolling left/right infinitely works smoothly
    _pageController = PageController(
      initialPage: 1000 * _images.length,
      viewportFraction: 0.85,
    );
    _startAutoScroll();
  }

  void _startAutoScroll() {
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_pageController.hasClients) return;
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 168,
      child: PageView.builder(
        controller: _pageController,
        itemBuilder: (context, index) {
          final imagePath = _images[index % _images.length];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: InkWell(
              onTap: () => context.push(RoutePaths.product),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.cover,
                    width: double.infinity,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
