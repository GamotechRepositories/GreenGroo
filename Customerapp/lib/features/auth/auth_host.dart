import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../routes/app_router.dart';
import 'auth_controller.dart';
import 'auth_sheet.dart';
import 'auth_state.dart';

class AuthHost extends ConsumerStatefulWidget {
  const AuthHost({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AuthHost> createState() => _AuthHostState();
}

class _AuthHostState extends ConsumerState<AuthHost> {
  AuthModalMode? _visibleMode;

  void _showAuthSheet(AuthModalMode mode) {
    final sheetContext = rootNavigatorKey.currentContext;
    if (sheetContext == null || !sheetContext.mounted) return;

    _visibleMode = mode;
    showModalBottomSheet<void>(
      context: sheetContext,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AuthSheet(mode: mode),
    ).whenComplete(() {
      _visibleMode = null;
      ref.read(authControllerProvider.notifier).closeAuthModal();
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      final mode = next.authModal;
      if (mode != null && mode != _visibleMode) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _showAuthSheet(mode);
        });
      }
    });

    return widget.child;
  }
}
