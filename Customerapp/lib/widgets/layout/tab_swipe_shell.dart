import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/auth_controller.dart';

/// Broadcast hub for shell branch stack changes.
final shellBranchNavigatorHub = ShellBranchNavigatorHub();

class ShellBranchNavigatorHub {
  final _listeners = <VoidCallback>{};

  void addListener(VoidCallback listener) => _listeners.add(listener);

  void removeListener(VoidCallback listener) => _listeners.remove(listener);

  void notify() {
    for (final listener in List<VoidCallback>.of(_listeners)) {
      listener();
    }
  }
}

/// One instance per shell branch navigator — do not share across navigators.
class ShellBranchNavigatorObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      shellBranchNavigatorHub.notify();

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      shellBranchNavigatorHub.notify();

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      shellBranchNavigatorHub.notify();

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      shellBranchNavigatorHub.notify();
}

/// Swipeable main-tab container synced with [StatefulNavigationShell].
class TabSwipeShell extends ConsumerStatefulWidget {
  const TabSwipeShell({
    super.key,
    required this.navigationShell,
    required this.children,
    required this.branchNavigatorKeys,
  });

  final StatefulNavigationShell navigationShell;
  final List<Widget> children;
  final List<GlobalKey<NavigatorState>> branchNavigatorKeys;

  @override
  ConsumerState<TabSwipeShell> createState() => _TabSwipeShellState();
}

class _TabSwipeShellState extends ConsumerState<TabSwipeShell> {
  static const _authRequiredIndices = {2, 3};

  late final PageController _pageController;
  bool _syncingFromShell = false;
  bool _stackRebuildScheduled = false;
  bool _isOnBranchRoot = true;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(
      initialPage: widget.navigationShell.currentIndex,
    );
    shellBranchNavigatorHub.addListener(_onBranchStackChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncBranchRootState());
  }

  void _onBranchStackChanged() {
    if (!mounted || _stackRebuildScheduled) return;
    _stackRebuildScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _stackRebuildScheduled = false;
      _syncBranchRootState();
    });
  }

  @override
  void didUpdateWidget(TabSwipeShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    final target = widget.navigationShell.currentIndex;
    if (target != _pageController.page?.round()) {
      _syncingFromShell = true;
      _pageController
          .animateToPage(
            target,
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
          )
          .whenComplete(() {
        if (mounted) _syncingFromShell = false;
      });
    }

    _syncBranchRootState();
  }

  @override
  void dispose() {
    shellBranchNavigatorHub.removeListener(_onBranchStackChanged);
    _pageController.dispose();
    super.dispose();
  }

  bool _canNavigateTo(int index) {
    if (!_authRequiredIndices.contains(index)) return true;
    return ref.read(authControllerProvider).isLoggedIn;
  }

  bool _computeIsOnBranchRoot() {
    final index = widget.navigationShell.currentIndex;
    if (index < 0 || index >= widget.branchNavigatorKeys.length) {
      return true;
    }
    final navigator = widget.branchNavigatorKeys[index].currentState;
    return !(navigator?.canPop() ?? false);
  }

  void _syncBranchRootState() {
    if (!mounted) return;
    final next = _computeIsOnBranchRoot();
    if (next == _isOnBranchRoot) return;
    setState(() => _isOnBranchRoot = next);
  }

  void _onPageChanged(int index) {
    if (_syncingFromShell) return;

    if (!_canNavigateTo(index)) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      _syncingFromShell = true;
      _pageController
          .animateToPage(
            widget.navigationShell.currentIndex,
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
          )
          .whenComplete(() {
        if (mounted) _syncingFromShell = false;
      });
      return;
    }

    if (index == widget.navigationShell.currentIndex) return;

    HapticFeedback.lightImpact();
    widget.navigationShell.goBranch(index, initialLocation: false);
  }

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _pageController,
      physics: _isOnBranchRoot
          ? const PageScrollPhysics()
          : const NeverScrollableScrollPhysics(),
      onPageChanged: _onPageChanged,
      allowImplicitScrolling: false,
      itemCount: widget.children.length,
      itemBuilder: (context, index) => widget.children[index],
    );
  }
}
