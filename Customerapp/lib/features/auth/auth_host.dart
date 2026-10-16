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

  bool _isTopRoutePopup(NavigatorState navigator) {
    var isPopup = false;
    navigator.popUntil((route) {
      isPopup = route is PopupRoute;
      return true;
    });
    return isPopup;
  }

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
      if (mode != null) {
        if (_visibleMode == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            _showAuthSheet(mode);
          });
        } else {
          _visibleMode = mode;
        }
      } else if (mode == null && _visibleMode != null) {
        _visibleMode = null;
        final navContext = rootNavigatorKey.currentContext;
        if (navContext != null && navContext.mounted) {
          final navigator = Navigator.maybeOf(navContext, rootNavigator: true);
          if (navigator != null && _isTopRoutePopup(navigator)) {
            navigator.pop();
          }
        }
      }
    });

    return widget.child;
  }
}
