import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/bootstrap/app_bootstrap.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/cart/cart_controller.dart';
import 'app_back_binding.dart';
import 'common/offline_banner.dart';
import 'layout/flipkart_bottom_nav.dart';
import 'layout/mobile_header.dart';
import 'wishlist/wishlist_toast.dart';

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  static const _tabs = <FlipkartNavItem>[
    FlipkartNavItem(
      label: 'Home',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    FlipkartNavItem(
      label: 'Categories',
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
    ),
    FlipkartNavItem(
      label: 'Orders',
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long_rounded,
    ),
    FlipkartNavItem(
      label: 'Cart',
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart_rounded,
      showBadge: true,
    ),
    FlipkartNavItem(
      label: 'Account',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  static const _authRequiredIndices = {2, 3};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future<void>.delayed(const Duration(milliseconds: 800), () {
        if (mounted) _maybeBootstrap();
      });
    });
  }

  void _maybeBootstrap() {
    unawaited(bootstrapUserSession(ref));
  }

  Future<void> _onTap(int index) async {
    final auth = ref.read(authControllerProvider);

    if (_authRequiredIndices.contains(index) && !auth.isLoggedIn) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      return;
    }

    final isCurrentTab = index == widget.navigationShell.currentIndex;

    if (isCurrentTab) {
      await ref.read(tabScrollRegistryProvider).scrollToTop(index);
      widget.navigationShell.goBranch(index, initialLocation: true);
      return;
    }

    widget.navigationShell.goBranch(index, initialLocation: false);
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = ref.watch(
      cartControllerProvider.select((s) => s.cartCount),
    );
    final accountInitial = ref.watch(
      authControllerProvider.select((s) {
        final name = s.user?.name;
        if (name == null || name.trim().isEmpty) return null;
        return name.trim()[0].toUpperCase();
      }),
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        AppBackBinding.instance.handleBack();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: const SystemUiOverlayStyle(
          systemNavigationBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.transparent,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
        child: Scaffold(
          extendBody: true,
          backgroundColor: const Color(0xFFF4F5F7),
          body: OfflineBannerHost(
            child: Stack(
              children: [
                Column(
                  children: [
                    MobileHeader(
                      key: ValueKey(widget.navigationShell.currentIndex),
                      isHomeTab: widget.navigationShell.currentIndex == 0,
                    ),
                    Expanded(child: widget.navigationShell),
                  ],
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: FlipkartBottomNav(
                    currentIndex: widget.navigationShell.currentIndex,
                    items: _tabs,
                    cartBadgeCount: cartCount,
                    accountInitial: accountInitial,
                    onTap: _onTap,
                  ),
                ),
                const _ShellSideEffects(),
                const WishlistToast(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Side-effect listeners isolated so cart/auth updates don't rebuild the shell tree.
class _ShellSideEffects extends ConsumerWidget {
  const _ShellSideEffects();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.isLoggedIn != true && next.isLoggedIn) {
        unawaited(bootstrapUserSession(ref));
      }
    });

    return const SizedBox.shrink();
  }
}
