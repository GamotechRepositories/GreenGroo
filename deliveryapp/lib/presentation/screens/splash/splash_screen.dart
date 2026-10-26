import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/services/auth_service.dart';
import '../../../pickup_driver/pickup_driver_service.dart';

/// Full-screen splash — brand illustration centred on its own background colour.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  static const _holdDuration = Duration(milliseconds: 1800);

  bool _navigated = false;
  late final Future<void> _sessionReady;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppAssets.splashBackground,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );

    _sessionReady = _prepareSession();
    Future.wait([_sessionReady, Future.delayed(_holdDuration)])
        .whenComplete(_goNext);
  }

  Future<void> _prepareSession() async {
    try {
      await AuthService.instance.loadSession();
      if (AuthService.instance.isLoggedIn) {
        // Fire-and-forget refresh — do not delay splash exit.
        // ignore: unawaited_futures
        AuthService.instance.fetchMe();
      }
    } catch (_) {}
  }

  Future<void> _goNext() async {
    if (!mounted || _navigated) return;
    _navigated = true;

    final pickup = PickupDriverService.instance;
    try {
      await pickup.loadSession();
    } catch (_) {}
    if (!mounted) return;
    if (pickup.isLoggedIn) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.pickupDriverHome);
      return;
    }

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
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final imageSize = (size.shortestSide * 0.82).clamp(220.0, 520.0);

    return Scaffold(
      backgroundColor: AppAssets.splashBackground,
      body: Center(
        child: Image.asset(
          AppAssets.splashImage,
          width: imageSize,
          height: imageSize,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.medium,
        ),
      ),
    );
  }
}
