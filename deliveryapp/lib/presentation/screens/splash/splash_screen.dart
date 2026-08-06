import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import 'widgets/splash_background.dart';
import 'widgets/splash_bottom_banner.dart';
import 'widgets/splash_branding.dart';
import 'widgets/splash_progress_line.dart';
import 'widgets/splash_scooter.dart';

/// Splash: scooter drives slowly across mid-screen on a progress line,
/// then app name appears after it reaches the right edge.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  // Scooter ~38s across (very slow), then branding → login
  static const _totalDuration = Duration(milliseconds: 55000);

  late final AnimationController _controller;
  late final Animation<double> _scooterProgress;
  late final Animation<double> _titleOpacity;
  late final Animation<double> _taglineOpacity;

  bool _started = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    final isDark = ThemeController.instance.isDark;
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      ),
    );

    _controller = AnimationController(vsync: this, duration: _totalDuration);

    // Very slow left → right (~38 seconds)
    _scooterProgress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.02, 0.72, curve: Curves.linear),
      ),
    );

    // App name ONLY after scooter reaches the right edge
    _titleOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.74, 0.84, curve: Curves.easeOut),
    );

    _taglineOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.82, 0.90, curve: Curves.easeOut),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _goToLogin();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => _prepareAndStart());
  }

  Future<void> _prepareAndStart() async {
    if (!mounted || _started) return;

    try {
      await precacheImage(
        const NetworkImage(AppAssets.deliveryScooter),
        context,
      ).timeout(const Duration(seconds: 4));
    } catch (_) {}

    if (!mounted || _started) return;
    _started = true;
    await Future<void>.delayed(const Duration(milliseconds: 120));
    if (!mounted) return;
    _controller.forward();
  }

  void _goToLogin() {
    if (!mounted || _navigated) return;
    _navigated = true;
    Navigator.of(context).pushReplacementNamed(AppRoutes.selectLanguage);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final scooterWidth = (size.width * 0.48).clamp(160.0, 240.0);
    final scooterHeight = scooterWidth * 0.72;

    return Scaffold(
      backgroundColor: const Color(0xFFE6F4E9),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final progress = _scooterProgress.value;
          final left = _scooterLeft(
            progress: progress,
            screenWidth: size.width,
            scooterWidth: scooterWidth,
          );

          return Stack(
            fit: StackFit.expand,
            clipBehavior: Clip.none,
            children: [
              const SplashBackground(),

              // App name — above scooter
              Positioned(
                left: 24,
                right: 24,
                top: size.height * 0.12,
                child: SplashBranding(
                  titleOpacity: _titleOpacity.value,
                  taglineOpacity: _taglineOpacity.value,
                ),
              ),

              // Scooter — above bottom banner, near vertical center
              Positioned(
                left: left,
                top: size.height * 0.28,
                width: scooterWidth,
                height: scooterHeight,
                child: SplashScooter(
                  width: scooterWidth,
                  height: scooterHeight,
                ),
              ),

              // Progress line under scooter
              Positioned(
                left: 0,
                right: 0,
                top: size.height * 0.28 + scooterHeight - 8,
                child: Center(child: SplashProgressLine(progress: progress)),
              ),

              // Full bottom panel — fills empty space
              const Align(
                alignment: Alignment.bottomCenter,
                child: SplashBottomBanner(),
              ),
            ],
          );
        },
      ),
    );
  }

  double _scooterLeft({
    required double progress,
    required double screenWidth,
    required double scooterWidth,
  }) {
    final start = -scooterWidth;
    final end = screenWidth + 8;
    return start + (end - start) * progress;
  }
}
