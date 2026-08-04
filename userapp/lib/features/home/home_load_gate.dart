import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Controls staged home content loading to reduce cold-start API/rebuild pressure.
enum HomeLoadPhase {
  /// Hero banner + categories only.
  critical,

  /// + top brands (after first frame).
  brands,

  /// + product rows, testimonials, social (after user scrolls).
  scrolled,
}

class HomeLoadGateController extends Notifier<HomeLoadPhase> {
  @override
  HomeLoadPhase build() => HomeLoadPhase.critical;

  void enableBrands() {
    if (state.index < HomeLoadPhase.brands.index) {
      state = HomeLoadPhase.brands;
    }
  }

  void enableScrolled() {
    if (state.index < HomeLoadPhase.scrolled.index) {
      state = HomeLoadPhase.scrolled;
    }
  }
}

final homeLoadGateProvider =
    NotifierProvider<HomeLoadGateController, HomeLoadPhase>(
  HomeLoadGateController.new,
);

bool homePhaseAtLeast(HomeLoadPhase current, HomeLoadPhase required) {
  return current.index >= required.index;
}

/// Lightweight placeholder until [minPhase] is reached; then builds [child].
class GatedHomeSection extends ConsumerWidget {
  const GatedHomeSection({
    super.key,
    required this.minPhase,
    required this.placeholderHeight,
    required this.child,
  });

  final HomeLoadPhase minPhase;
  final double placeholderHeight;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phase = ref.watch(homeLoadGateProvider);
    if (!homePhaseAtLeast(phase, minPhase)) {
      return SizedBox(height: placeholderHeight);
    }
    return child;
  }
}
