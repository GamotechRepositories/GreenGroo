import 'package:flutter/material.dart';

import 'flipkart_bottom_nav.dart';

/// Scroll padding so list content clears the full-width shell bottom nav.
abstract final class ShellBottomInsets {
  static const double _extraBuffer = 10;

  static double of(BuildContext context) {
    return MediaQuery.paddingOf(context).bottom +
        FlipkartBottomNav.barHeight +
        _extraBuffer;
  }

  static EdgeInsets listPadding(
    BuildContext context, {
    double left = 16,
    double top = 0,
    double right = 16,
  }) {
    return EdgeInsets.fromLTRB(left, top, right, of(context));
  }

  /// Extra bottom padding for bottom sheets inside the shell (above nav).
  static const double navBarOverlay =
      FlipkartBottomNav.barHeight + _extraBuffer;
}
