import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Bottom nav tab indices — must match [AppShell] branch order.
abstract final class ShellTabIndex {
  static const home = 0;
  static const categories = 1;
  static const orders = 2;
  static const cart = 3;
  static const account = 4;
}

class TabScrollRegistry {
  final _controllers = <int, ScrollController>{};

  void register(int tabIndex, ScrollController controller) {
    _controllers[tabIndex] = controller;
  }

  void unregister(int tabIndex, ScrollController controller) {
    if (identical(_controllers[tabIndex], controller)) {
      _controllers.remove(tabIndex);
    }
  }

  Future<void> scrollToTop(int tabIndex) async {
    final controller = _controllers[tabIndex];
    if (controller == null) return;

    for (var attempt = 0; attempt < 6; attempt++) {
      if (!controller.hasClients) {
        await Future<void>.delayed(const Duration(milliseconds: 32));
        continue;
      }

      final position = controller.position;
      if (!position.hasPixels || position.pixels <= 0) return;

      await controller.animateTo(
        0,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
      return;
    }
  }
}

final tabScrollRegistryProvider = Provider<TabScrollRegistry>((ref) {
  return TabScrollRegistry();
});
