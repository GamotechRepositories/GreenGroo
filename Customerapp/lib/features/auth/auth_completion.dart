import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/user.dart';
import '../../routes/app_router.dart';
import '../../routes/route_paths.dart';
import 'auth_controller.dart';

bool _isTopRoutePopup(NavigatorState navigator) {
  var isPopup = false;
  navigator.popUntil((route) {
    isPopup = route is PopupRoute;
    return true;
  });
  return isPopup;
}

/// Closes auth UI and lands on the home tab after sign-in / sign-up.
void completeAuthAndGoHome({
  required WidgetRef ref,
  required BuildContext sheetContext,
  required User user,
  required bool isSignup,
}) {
  if (sheetContext.mounted) {
    final nav = Navigator.maybeOf(sheetContext, rootNavigator: true) ??
        Navigator.maybeOf(sheetContext);
    if (nav != null && _isTopRoutePopup(nav)) {
      nav.pop();
    }
  }

  ref.read(authControllerProvider.notifier).closeAuthModal();

  WidgetsBinding.instance.addPostFrameCallback((_) {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null || !ctx.mounted) return;

    GoRouter.of(ctx).go(RoutePaths.home);

    final greetingName =
        user.name.trim().isNotEmpty ? user.name.trim() : 'there';
    ScaffoldMessenger.of(ctx).showSnackBar(
      SnackBar(
        content: Text(
          isSignup
              ? 'Welcome to GreenGroo, $greetingName!'
              : 'Welcome back, $greetingName!',
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  });
}
