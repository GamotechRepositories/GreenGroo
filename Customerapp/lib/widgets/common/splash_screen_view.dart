import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Clean, elegant Splash Screen View for GreenGrocc.
///
/// Features:
/// - Crisp, uncropped, unblurred centered splash emblem (`assets/images/splash.png`).
/// - Big, premium brand title "GreenGrocc" in dark forest green.
/// - Soothing multi-tone pastel green gradient covering the full screen.
class SplashScreenView extends StatefulWidget {
  const SplashScreenView({
    super.key,
    this.onFinished,
    this.isStandalone = false,
  });

  final VoidCallback? onFinished;
  final bool isStandalone;

  @override
  State<SplashScreenView> createState() => _SplashScreenViewState();
}

class _SplashScreenViewState extends State<SplashScreenView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _entranceController;

  late final Animation<double> _bgFadeAnimation;
  late final Animation<double> _imageFadeAnimation;
  late final Animation<double> _imageScaleAnimation;
  late final Animation<double> _textFadeAnimation;
  late final Animation<double> _textSlideAnimation;

  @override
  void initState() {
    super.initState();

    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _bgFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOut),
      ),
    );

    // Subtle, natural reveal for the center image — no distortion or blur
    _imageFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.15, 0.70, curve: Curves.easeOut),
      ),
    );

    _imageScaleAnimation = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.15, 0.75, curve: Curves.easeOutCubic),
      ),
    );

    // Smooth upward glide and fade for "GreenGrocc" text
    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.40, 0.90, curve: Curves.easeOut),
      ),
    );

    _textSlideAnimation = Tween<double>(begin: 22.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.40, 0.95, curve: Curves.easeOutCubic),
      ),
    );

    _entranceController.forward().then((_) {
      if (mounted) {
        widget.onFinished?.call();
      }
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    // Size the image proportionally so it is prominent in the middle,
    // without overflowing or requiring any crop or compression.
    final imageDimension = math.min(
      size.width * 0.78,
      math.min(size.height * 0.42, 330.0),
    );

    final titleFontSize = math.min(size.width * 0.105, 42.0);

    return Scaffold(
      backgroundColor: const Color(0xFFF1FAF4),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── 1. Full Screen Pastel Green Gradient ──────────────────────────
          FadeTransition(
            opacity: _bgFadeAnimation,
            child: Container(
              width: double.infinity,
              height: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFF3FAF5), // Pale fresh morning mint
                    Color(0xFFE5F7EC), // Calming pastel honeydew
                    Color(0xFFD6F2DF), // Soft pastel celadon
                    Color(0xFFC7EBD4), // Gentle pastel jade
                    Color(0xFFBCE6CE), // Warm pastel sage
                  ],
                  stops: [0.0, 0.25, 0.55, 0.80, 1.0],
                ),
              ),
            ),
          ),

          // ── 2. Subtle Organic Pastel Glow Orbs (Soft Depth) ───────────────
          Positioned(
            top: -size.width * 0.25,
            left: -size.width * 0.2,
            child: Container(
              width: size.width * 1.3,
              height: size.width * 1.3,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFA7F3D0).withValues(alpha: 0.25),
                    const Color(0xFFA7F3D0).withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -size.width * 0.3,
            right: -size.width * 0.25,
            child: Container(
              width: size.width * 1.4,
              height: size.width * 1.4,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF86EFAC).withValues(alpha: 0.20),
                    const Color(0xFF86EFAC).withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),

          // ── 3. Exact Middle: Crisp Center Image & Brand Title ─────────────
          Center(
            child: SafeArea(
              child: SingleChildScrollView(
                physics: const NeverScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // ── Exact Center Image (No crop, no blur, no compression) ──
                      AnimatedBuilder(
                        animation: _entranceController,
                        builder: (context, child) {
                          return Opacity(
                            opacity: _imageFadeAnimation.value,
                            child: Transform.scale(
                              scale: _imageScaleAnimation.value,
                              child: child,
                            ),
                          );
                        },
                        child: Image.asset(
                          'assets/images/splash.png',
                          width: imageDimension,
                          height: imageDimension,
                          fit: BoxFit.contain,
                          filterQuality: FilterQuality.high,
                          errorBuilder: (context, error, stackTrace) {
                            return Image.asset(
                              'assets/images/app_logo.png',
                              width: imageDimension,
                              height: imageDimension,
                              fit: BoxFit.contain,
                              filterQuality: FilterQuality.high,
                            );
                          },
                        ),
                      ),

                      const SizedBox(height: 24),

                      // ── Brand Typography: GreenGrocc in Dark Green ─────────
                      AnimatedBuilder(
                        animation: _entranceController,
                        builder: (context, child) {
                          return Opacity(
                            opacity: _textFadeAnimation.value,
                            child: Transform.translate(
                              offset: Offset(0, _textSlideAnimation.value),
                              child: child,
                            ),
                          );
                        },
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'GreenGrocc',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: titleFontSize,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF064E3B), // Rich dark forest green
                                letterSpacing: 0.8,
                                height: 1.1,
                              ),
                            ),

                            const SizedBox(height: 8),

                            // Elegant tag line
                            Text(
                              'FARM FRESH · INSTANT DELIVERY',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 3.2,
                                color: const Color(0xFF065F17), // Deep dark green
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Organic Freshness Pill Badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 6.5,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.80),
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(
                                  color: const Color(0xFF065F17).withValues(alpha: 0.20),
                                  width: 1.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF064E3B).withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('🌱', style: TextStyle(fontSize: 12)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Purely Fresh, Directly from Farmers',
                                    style: GoogleFonts.outfit(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF064E3B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
