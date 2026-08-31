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

/// Splash: gray track appears first, then scooter rides left → right filling it green.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
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

    _scooterProgress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.78, curve: Curves.linear),
      ),
    );

    // Appears only after scooter exits off the right edge.
    _titleOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.78, 0.92, curve: Curves.easeOut),
    );

    _taglineOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.84, 0.96, curve: Curves.easeOut),
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
    _hasSession = AuthService.instance.isLoggedIn;

    if (!mounted || _started) return;
    _started = true;
    await Future<void>.delayed(const Duration(milliseconds: 400));
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
    const horizontalPad = 20.0;
    final trackWidth = size.width - horizontalPad * 2;
    var scooterWidth = (size.width * 0.62).clamp(220.0, 320.0);
    var scooterHeight = scooterWidth * 0.78;
    const lineHeight = 6.0;
    var trackBlockHeight = scooterHeight + lineHeight + 8;
    final maxAnimationHeight = (size.height * 0.36).clamp(180.0, 320.0);
    const brandingReserve = 88.0;
    if (brandingReserve + trackBlockHeight > maxAnimationHeight) {
      final scale =
          ((maxAnimationHeight - brandingReserve - lineHeight - 8) / scooterHeight)
              .clamp(0.45, 1.0);
      final scaledWidth = scooterWidth * scale;
      scooterWidth = scaledWidth;
      scooterHeight = scaledWidth * 0.78;
      trackBlockHeight = scooterHeight + lineHeight + 8;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFE6F4E9),
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

          return Column(
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: const [SplashBackground()],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(horizontalPad, 0, horizontalPad, 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      height: brandingReserve,
                      child: Center(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: SplashBranding(
                            titleOpacity: _titleOpacity.value,
                            taglineOpacity: _taglineOpacity.value,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(
                      width: trackWidth,
                      height: trackBlockHeight,
                      child: Stack(
                        clipBehavior: Clip.hardEdge,
                        alignment: Alignment.bottomLeft,
                        children: [
                          Positioned(
                            left: 0,
                            right: 0,
                            bottom: 0,
                            child: SplashProgressLine(
                              progress: progress,
                              width: trackWidth,
                              height: lineHeight,
                            ),
                          ),
                          if (showScooter)
                            Positioned(
                              left: scooterLeft,
                              bottom: lineHeight - 1,
                              width: scooterWidth,
                              height: scooterHeight,
                              child: SplashScooter(
                                width: scooterWidth,
                                height: scooterHeight,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SplashBottomBanner(),
            ],
          );
        },
      ),
    );
  }

  /// progress 0 → off-screen left; progress 1 → fully off-screen right.
  double _scooterLeftOnTrack({
    required double progress,
    required double trackWidth,
    required double scooterWidth,
  }) {
    if (progress <= 0) return -scooterWidth;
    return -scooterWidth + progress * (trackWidth + scooterWidth);
  }
}
