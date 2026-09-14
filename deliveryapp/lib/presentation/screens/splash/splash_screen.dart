import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/routes/app_routes.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/push_notification_service.dart';

/// Simple white splash — centered logo, then navigate to next screen.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  static const _holdDuration = Duration(milliseconds: 1600);
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

    _prepareAuthInBackground();
    PushNotificationService.instance.init();
    Future.delayed(_holdDuration, _goNext);
  }

  Future<void> _prepareAuthInBackground() async {
    try {
      await AuthService.instance.loadSession();
      if (AuthService.instance.isLoggedIn) {
        // ignore: unawaited_futures
        AuthService.instance.fetchMe();
      }
    } catch (_) {}
  }

  Future<void> _goNext() async {
    if (!mounted || _navigated) return;
    _navigated = true;

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
    final logoSize = (size.width * 0.42).clamp(140.0, 220.0);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Image.asset(
            'assets/icon/icon.png',
            width: logoSize,
            height: logoSize,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => Image.asset(
              'assets/branding/app_icon.png',
              width: logoSize,
              height: logoSize,
              fit: BoxFit.contain,
            ),
          ),
        ),
      ),
    );
  }
}
