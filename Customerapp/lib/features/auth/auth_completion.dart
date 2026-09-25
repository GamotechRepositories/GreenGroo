import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/user.dart';
import '../../routes/app_router.dart';
import '../../routes/route_paths.dart';
import 'auth_controller.dart';

/// Closes auth UI and lands on the home tab after sign-in / sign-up.
void completeAuthAndGoHome({
  required WidgetRef ref,
  required BuildContext sheetContext,
  required User user,
  required bool isSignup,
}) {
  ref.read(authControllerProvider.notifier).closeAuthModal();

  if (sheetContext.mounted) {
    try {
      Navigator.of(sheetContext, rootNavigator: true).pop();
    } catch (_) {
      try {
        Navigator.of(sheetContext).pop();
      } catch (_) {}
    }
  } else {
    final rootContext = rootNavigatorKey.currentContext;
    if (rootContext != null && rootContext.mounted) {
      try {
        Navigator.of(rootContext, rootNavigator: true).pop();
      } catch (_) {}
    }
  }

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
