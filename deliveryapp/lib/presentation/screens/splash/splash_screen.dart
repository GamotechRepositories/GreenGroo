import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import 'widgets/splash_background.dart';
import 'widgets/splash_footer.dart';
import 'widgets/splash_header.dart';
import 'widgets/splash_progress_line.dart';
import 'widgets/splash_scooter.dart';
import 'widgets/splash_speed_lines.dart';

/// Full-screen splash — large scooter rides left → right on dotted path.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const _fullDuration = Duration(milliseconds: 20000);
  static const _shortDuration = Duration(milliseconds: 20000);

  late final AnimationController _controller;
  late final Animation<double> _scooterProgress;

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

    final duration =
        AuthService.instance.isLoggedIn ? _shortDuration : _fullDuration;

    _controller = AnimationController(vsync: this, duration: duration);

    _scooterProgress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.9, curve: Curves.linear),
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

    await AuthService.instance.loadSession();
    if (AuthService.instance.isLoggedIn) {
      await AuthService.instance.fetchMe();
    }

    if (!mounted || _started) return;
    _started = true;
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    _controller.forward();
  }

  Future<void> _goNext() async {
    if (!mounted || _navigated) return;
    _navigated = true;

    final auth = AuthService.instance;
    if (auth.isLoggedIn) {
      final boy = auth.deliveryBoy;
      final lastRoute = await auth.getLastRoute();
      final route = AuthService.routeForStep(
        boy?.onboardingStep ?? 'vehicle',
        complete: boy?.onboardingComplete ?? false,
        boy: boy,
        lastRoute: lastRoute,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed(
        route,
        arguments: AuthService.argumentsForStep(boy),
      );
      return;
    }

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
    const trackHorizontalPad = 36.0;
    final trackWidth = size.width - trackHorizontalPad * 2;
    final scooterWidth = size.width * 0.84;
    final scooterHeight = scooterWidth * 0.74;
    const dotSize = 6.0;
    final trackTop = size.height * 0.575;

    return Scaffold(
      backgroundColor: const Color(0xFFF0FAF2),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final progress = _scooterProgress.value;
          final scooterLeft = _scooterLeftOnTrack(
            progress: progress,
            trackWidth: trackWidth,
            scooterWidth: scooterWidth,
          );
          final showScooter = progress > 0 && scooterLeft < trackWidth;
          final speedOpacity = showScooter ? (1 - progress * 0.35) : 0.0;
          final scooterFront =
              (scooterLeft + scooterWidth * 0.8).clamp(0.0, trackWidth);

          return Stack(
            fit: StackFit.expand,
            children: [
              const SplashBackground(),
              Positioned(
                left: trackHorizontalPad,
                top: trackTop,
                width: trackWidth,
                child: SplashProgressLine(
                  width: trackWidth,
                  fillPosition: scooterFront,
                  dotSize: dotSize,
                ),
              ),
              if (showScooter)
                Positioned(
                  left: trackHorizontalPad + scooterLeft,
                  top: trackTop - scooterHeight + dotSize + 2,
                  width: scooterWidth,
                  height: scooterHeight,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.centerLeft,
                    children: [
                      Positioned(
                        left: -scooterWidth * 0.32,
                        top: scooterHeight * 0.22,
                        child: SplashSpeedLines(
                          width: scooterWidth * 0.42,
                          height: scooterHeight * 0.45,
                          opacity: speedOpacity,
                        ),
                      ),
                      SplashScooter(
                        width: scooterWidth,
                        height: scooterHeight,
                      ),
                    ],
                  ),
                ),
              SafeArea(
                child: Column(
                  children: [
                    const SplashHeader(),
                    const Spacer(),
                    const SplashFooter(),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  double _scooterLeftOnTrack({
    required double progress,
    required double trackWidth,
    required double scooterWidth,
  }) {
    if (progress <= 0) return -scooterWidth;
    return -scooterWidth + progress * (trackWidth + scooterWidth);
  }
}
