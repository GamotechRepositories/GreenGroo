import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/push_notification_service.dart';
import 'widgets/splash_background.dart';
import 'widgets/splash_footer.dart';
import 'widgets/splash_header.dart';
import 'widgets/splash_progress_line.dart';
import 'widgets/splash_scooter.dart';
import 'widgets/splash_speed_lines.dart';

/// Full-screen splash — scooter starts immediately; navigate the instant it exits.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  /// Fast left → right ride (~4s).
  static const _rideDuration = Duration(milliseconds: 2000);

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

    _controller = AnimationController(vsync: this, duration: _rideDuration);

    _scooterProgress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.linear),
    );

    // Navigate the moment the scooter leaves the right edge — no pause.
    _controller.addListener(_onRideTick);

    // Warm session/image in background; never block navigation.
    _prepareAuthInBackground();
    // FCM setup in background — do not delay splash navigation.
    PushNotificationService.instance.init();

    WidgetsBinding.instance.addPostFrameCallback((_) => _startScooterNow());
  }

  void _onRideTick() {
    if (_navigated || !_started) return;
    // Progress 1.0 = fully past the right edge.
    if (_scooterProgress.value >= 1.0) {
      _goNext();
    }
  }

  Future<void> _prepareAuthInBackground() async {
    try {
      Future(() async {
        try {
          if (!mounted) return;
          await precacheImage(
            const AssetImage(AppAssets.deliveryScooter),
            context,
          );
        } catch (_) {}
      });

      await AuthService.instance.loadSession();
      if (AuthService.instance.isLoggedIn) {
        // Fire-and-forget refresh — do not delay splash exit.
        // ignore: unawaited_futures
        AuthService.instance.fetchMe();
      }
    } catch (_) {}
  }

  void _startScooterNow() {
    if (!mounted || _started) return;
    _started = true;
    _controller.forward();
  }

  Future<void> _goNext() async {
    if (!mounted || _navigated) return;
    _navigated = true;
    _controller.removeListener(_onRideTick);

    final auth = AuthService.instance;
    if (auth.isLoggedIn) {
      final boy = auth.deliveryBoy;
      final lastRoute = await auth.getLastRoute();
      if (!mounted) return;
      final route = AuthService.routeForStep(
        boy?.onboardingStep ?? 'vehicle',
        complete: boy?.onboardingComplete ?? false,
        boy: boy,
        lastRoute: lastRoute,
      );
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
    _controller.removeListener(_onRideTick);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    const trackHorizontalPad = 36.0;
    final trackWidth = size.width - trackHorizontalPad * 2;
    final scooterWidth = size.width * 0.52;
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
          final showScooter = _started && scooterLeft < trackWidth;
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
              const SafeArea(
                child: Column(
                  children: [
                    SplashHeader(),
                    Spacer(),
                    SplashFooter(),
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
    return -scooterWidth + progress * (trackWidth + scooterWidth);
  }
}
