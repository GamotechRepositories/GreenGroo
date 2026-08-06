import 'package:flutter/material.dart';

import '../routes/app_routes.dart';
import '../theme/app_colors.dart';
import '../../data/services/auth_service.dart';

/// Shared app-bar back button. Pops if possible, otherwise goes to [fallbackRoute].
class AppBackButton extends StatelessWidget {
  const AppBackButton({super.key, this.fallbackRoute});

  final String? fallbackRoute;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
      color: AppColors.textPrimary,
      onPressed: () => goBack(context, fallbackRoute: fallbackRoute),
    );
  }
}

void goBack(BuildContext context, {String? fallbackRoute}) {
  if (Navigator.of(context).canPop()) {
    Navigator.of(context).pop();
    return;
  }
  if (fallbackRoute != null) {
    Navigator.of(context).pushReplacementNamed(fallbackRoute);
  }
}

/// Saves onboarding progress (+ optional profile fields) then navigates.
Future<void> goOnboardingStep(
  BuildContext context, {
  required String step,
  required String route,
  bool replace = false,
  Object? arguments,
  Map<String, dynamic>? data,
}) async {
  await AuthService.instance.updateOnboarding(step: step, data: data);
  if (!context.mounted) return;
  if (replace) {
    Navigator.pushReplacementNamed(context, route, arguments: arguments);
  } else {
    Navigator.pushNamed(context, route, arguments: arguments);
  }
}

Future<void> completeOnboarding(BuildContext context) async {
  await AuthService.instance.updateOnboarding(
    step: 'home',
    complete: true,
    data: {'livenessPassed': true},
  );
  if (!context.mounted) return;
  Navigator.pushNamedAndRemoveUntil(
    context,
    AppRoutes.home,
    (route) => false,
  );
}

Future<void> logoutAndGoLogin(BuildContext context) async {
  if (AuthService.instance.isLoggedIn) {
    try {
      await AuthService.instance.updateStatus('offline');
    } catch (_) {}
  }
  await AuthService.instance.clearSession();
  if (!context.mounted) return;
  Navigator.pushNamedAndRemoveUntil(
    context,
    AppRoutes.login,
    (route) => false,
  );
}
