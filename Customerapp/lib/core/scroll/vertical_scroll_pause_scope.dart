import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Signals when the parent vertical list is actively scrolling so nested
/// auto-animations can pause and avoid competing with user scroll.
class VerticalScrollPauseScope extends InheritedWidget {
  const VerticalScrollPauseScope({
    super.key,
    required this.isScrolling,
    required super.child,
  });

  final ValueListenable<bool> isScrolling;

  static bool isParentVerticalScrolling(BuildContext context) {
    final scope =
        context.getInheritedWidgetOfExactType<VerticalScrollPauseScope>();
    return scope?.isScrolling.value ?? false;
  }

  @override
  bool updateShouldNotify(VerticalScrollPauseScope oldWidget) {
    return oldWidget.isScrolling != isScrolling;
  }
}
