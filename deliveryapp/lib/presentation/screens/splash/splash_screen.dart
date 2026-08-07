import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import 'widgets/splash_background.dart';
import 'widgets/splash_bottom_banner.dart';
import 'widgets/splash_branding.dart';
import 'widgets/splash_progress_line.dart';
import 'widgets/splash_scooter.dart';

/// Splash: scooter rides left → right across mid-screen, then routes by session.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  /// Slow 15s pass so the scooter is easy to see.
  static const _fullDuration = Duration(milliseconds: 15000);
  static const _shortDuration = Duration(milliseconds: 15000);

  late final AnimationController _controller;
  late final Animation<double> _scooterProgress;
  late final Animation<double> _titleOpacity;
  late final Animation<double> _taglineOpacity;

  bool _started = false;
  bool _navigated = false;
  bool _hasSession = false;

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

    _hasSession = AuthService.instance.isLoggedIn;
    final duration = _hasSession ? _shortDuration : _fullDuration;

    _controller = AnimationController(vsync: this, duration: duration);

    // Slow left → right ride across most of the splash.
    _scooterProgress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.82, curve: Curves.linear),
      ),
    );

    _titleOpacity = CurvedAnimation(
      parent: _controller,
      curve: Interval(
        _hasSession ? 0.55 : 0.72,
        _hasSession ? 0.8 : 0.9,
        curve: Curves.easeOut,
      ),
    );

    _taglineOpacity = CurvedAnimation(
      parent: _controller,
      curve: Interval(
        _hasSession ? 0.7 : 0.82,
        _hasSession ? 0.92 : 0.96,
        curve: Curves.easeOut,
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _goNext();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => _prepareAndStart());
  }

  Future<void> _prepareAndStart() async {
    if (!mounted || _started) return;

    try {
      await precacheImage(
        const AssetImage(AppAssets.deliveryScooter),
        context,
      );
    } catch (_) {}

    if (_hasSession) {
      // Don't block scooter animation on network.
      AuthService.instance.fetchMe();
    }

    if (!mounted || _started) return;
    _started = true;
    await Future<void>.delayed(const Duration(milliseconds: 60));
    if (!mounted) return;
    _controller.forward();
  }

  void _goNext() {
    if (!mounted || _navigated) return;
    _navigated = true;

    final auth = AuthService.instance;
    if (auth.isLoggedIn) {
      final boy = auth.deliveryBoy;
      final route = AuthService.routeForStep(
        boy?.onboardingStep ?? 'vehicle',
        complete: boy?.onboardingComplete ?? false,
      );
      Navigator.of(context).pushReplacementNamed(
        route,
        arguments: AuthService.argumentsForStep(boy),
      );
      return;
    }

    // New / not registered users: Splash → Choose Language → Login/Register.
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
    final scooterWidth = (size.width * 0.58).clamp(200.0, 280.0);
    final scooterHeight = scooterWidth * 0.78;

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
              Positioned(
                left: 24,
                right: 24,
                top: size.height * 0.10,
                child: SplashBranding(
                  titleOpacity: _titleOpacity.value,
                  taglineOpacity: _taglineOpacity.value,
                ),
              ),
              // Scooter above background, below banner — mid screen.
              Positioned(
                left: left,
                top: size.height * 0.34,
                width: scooterWidth,
                height: scooterHeight,
                child: SplashScooter(
                  width: scooterWidth,
                  height: scooterHeight,
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                top: size.height * 0.34 + scooterHeight - 6,
                child: Center(child: SplashProgressLine(progress: progress)),
              ),
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

  /// Starts slightly on-screen so the rider is visible immediately.
  double _scooterLeft({
    required double progress,
    required double screenWidth,
    required double scooterWidth,
  }) {
    final start = -scooterWidth * 0.55;
    final end = screenWidth - scooterWidth * 0.15;
    return start + (end - start) * progress;
  }
}
