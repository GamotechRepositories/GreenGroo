import 'package:flutter/foundation.dart';

/// Lets child screens switch the main shell bottom tab.
class ShellNavigation {
  ShellNavigation._();
  static final instance = ShellNavigation._();

  ValueNotifier<int>? tabNotifier;

  void bind(ValueNotifier<int> notifier) {
    tabNotifier = notifier;
  }

  void unbind() {
    tabNotifier = null;
  }

  void goToTab(int index) {
    tabNotifier?.value = index;
  }
}
