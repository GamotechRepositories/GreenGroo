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

  final rootContext = rootNavigatorKey.currentContext;
  final navigator = rootContext != null && rootContext.mounted
      ? Navigator.of(rootContext, rootNavigator: true)
      : sheetContext.mounted
          ? Navigator.of(sheetContext, rootNavigator: true)
          : null;

  if (navigator != null && navigator.canPop()) {
    navigator.pop();
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
              ? 'Welcome to BulkMobileMart, $greetingName!'
              : 'Welcome back, $greetingName!',
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  });
}
