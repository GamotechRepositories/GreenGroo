import 'package:flutter/material.dart';

/// Shared scroll tuning for smoother vertical lists across the app.
abstract final class AppScrollConfig {
  /// Pre-build off-screen children to reduce jank while flinging.
  static const double cacheExtent = 640;

  static const ScrollPhysics listPhysics = AlwaysScrollableScrollPhysics();
}
